import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { CodeBlock } from './components/CodeBlock.tsx';
import { Panel, ToggleRow } from './components/Panel.tsx';
import {
  AutoIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  DropletsIcon,
  LightbulbIcon,
  MoonIcon,
  PowerIcon,
  SendIcon,
  SlidersIcon,
  SnowflakeIcon,
  SparklesIcon,
  SunIcon,
  SwingIcon,
  TerminalIcon,
  ThermometerIcon,
  WindIcon,
  ZapIcon,
} from './components/Icons.tsx';
import {
  DEFAULT_STATE,
  FAN_SPEEDS,
  MAX_TEMP,
  MIN_TEMP,
  MODES,
  type AcState,
  type Fan,
  type Mode,
  encodePulses,
  encodeState,
  toHex,
} from './lib/electra.ts';
import { buildSnippets } from './lib/exports.ts';
import {
  DEFAULT_SETTINGS,
  type SendResult,
  type Settings,
  type TransportKind,
  activeTransport,
  sendState,
} from './lib/ir.ts';

const STATE_KEY = 'electra.state.v1';
const SETTINGS_KEY = 'electra.settings.v1';

const MODE_ICONS: Record<Mode, typeof SnowflakeIcon> = {
  cool: SnowflakeIcon,
  heat: SunIcon,
  dry: DropletsIcon,
  fan: WindIcon,
  auto: AutoIcon,
};

const FAN_LABELS: Record<Fan, string> = {
  auto: 'Auto',
  low: 'Low',
  med: 'Med',
  high: 'High',
};

function load<T>(key: string, fallback: T): T {
  try {
    const stored = localStorage.getItem(key);
    return stored ? { ...fallback, ...JSON.parse(stored) } : fallback;
  } catch {
    return fallback;
  }
}

const TRANSPORT_LABEL: Record<TransportKind, string> = {
  native: 'Phone IR blaster',
  bridge: 'Network bridge',
  none: 'No emitter',
};

export default function App() {
  const [state, setState] = useState<AcState>(() => load(STATE_KEY, DEFAULT_STATE));
  const [settings, setSettings] = useState<Settings>(() =>
    load(SETTINGS_KEY, DEFAULT_SETTINGS),
  );
  const [transport, setTransport] = useState<TransportKind>('none');
  const [result, setResult] = useState<SendResult | null>(null);
  const [flash, setFlash] = useState(false);

  const flashTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => {
    localStorage.setItem(STATE_KEY, JSON.stringify(state));
  }, [state]);

  useEffect(() => {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  }, [settings]);

  useEffect(() => {
    let cancelled = false;
    activeTransport(settings).then((kind) => {
      if (!cancelled) setTransport(kind);
    });
    return () => {
      cancelled = true;
    };
  }, [settings]);

  useEffect(() => () => clearTimeout(flashTimer.current), []);

  /**
   * Transmit a state. A real Electra remote re-sends everything on every press,
   * so each control change is a full packet — there are no incremental commands.
   */
  const transmit = useCallback(
    async (next: AcState) => {
      setFlash(true);
      clearTimeout(flashTimer.current);
      flashTimer.current = setTimeout(() => setFlash(false), 220);

      if (navigator.vibrate) navigator.vibrate(12);

      const sent = await sendState(next, settings);
      setResult(sent);

      // The light bit is a toggle the unit acts on once, so it must not stick
      // around and flip the display again on the next command.
      if (next.lightToggle) {
        setState((current) => ({ ...current, lightToggle: false }));
      }
    },
    [settings],
  );

  /**
   * Apply a change and immediately send the resulting full state.
   *
   * The send deliberately happens outside the state updater: updaters run
   * twice under StrictMode, which would transmit every command twice in dev.
   */
  const apply = useCallback(
    (patch: Partial<AcState>) => {
      const next = { ...state, ...patch };
      setState(next);
      void transmit(next);
    },
    [state, transmit],
  );

  const off = !state.power;

  const cycleMode = () =>
    apply({ mode: MODES[(MODES.indexOf(state.mode) + 1) % MODES.length] });

  const cycleFan = () =>
    apply({
      fan: FAN_SPEEDS[(FAN_SPEEDS.indexOf(state.fan) + 1) % FAN_SPEEDS.length],
    });

  const nudgeTemp = (delta: number) => {
    const next = state.temp + delta;
    if (next < MIN_TEMP || next > MAX_TEMP) return;
    apply({ temp: next });
  };

  const bytes = useMemo(() => encodeState(state), [state]);
  const pulses = useMemo(
    () => encodePulses(bytes, settings.repeat),
    [bytes, settings.repeat],
  );
  const snippets = useMemo(
    () => buildSnippets(state, settings.repeat),
    [state, settings.repeat],
  );

  const ModeIcon = MODE_ICONS[state.mode];
  // In fan-only mode the unit has no setpoint, and the handset blanks the digits.
  const showTemp = state.mode !== 'fan';

  const tone: 'ok' | 'warn' | 'error' | 'idle' = !result
    ? transport === 'none'
      ? 'warn'
      : 'idle'
    : result.ok
      ? 'ok'
      : 'error';

  return (
    <div className="app">
      <div className="remote">
        <div className="brand">
          <h1>Electra</h1>
          <span className="emitter" data-flash={flash} aria-hidden="true" />
        </div>

        <div className="lcd" data-on={state.power}>
          <div className="lcd-row">
            <span className="lcd-mode">
              <ModeIcon size={17} />
              {state.mode}
            </span>
            <span>Fan {FAN_LABELS[state.fan]}</span>
          </div>

          <div className="lcd-temp">
            <span className="value">{showTemp ? state.temp : '--'}</span>
            <span className="unit">°C</span>
          </div>

          <div className="lcd-flags">
            {state.swingV && <span>Swing</span>}
            {state.swingH && <span>Swing H</span>}
            {state.turbo && <span>Turbo</span>}
            {state.quiet && <span>Quiet</span>}
            {state.clean && <span>Clean</span>}
            {state.iFeel && <span>iFeel {state.sensorTemp}°</span>}
            <span className="spacer">{state.power ? 'On' : 'Off'}</span>
          </div>
        </div>

        <div className="primary">
          <div className="rocker">
            <button
              type="button"
              onClick={() => nudgeTemp(1)}
              disabled={off || !showTemp || state.temp >= MAX_TEMP}
              aria-label="Temperature up"
            >
              <ChevronUpIcon size={26} />
            </button>
            <span className="divider" />
            <button
              type="button"
              onClick={() => nudgeTemp(-1)}
              disabled={off || !showTemp || state.temp <= MIN_TEMP}
              aria-label="Temperature down"
            >
              <ChevronDownIcon size={26} />
            </button>
          </div>

          <button
            type="button"
            className="power"
            data-on={state.power}
            onClick={() => apply({ power: !state.power })}
            aria-label={state.power ? 'Turn off' : 'Turn on'}
          >
            <PowerIcon size={30} strokeWidth={2.5} />
          </button>
        </div>

        <div className="keys">
          <button type="button" className="key" onClick={cycleMode} disabled={off}>
            <ModeIcon size={20} />
            <span className="label">Mode</span>
            <span className="value">{state.mode}</span>
          </button>

          <button type="button" className="key" onClick={cycleFan} disabled={off}>
            <WindIcon size={20} />
            <span className="label">Fan</span>
            <span className="value">{FAN_LABELS[state.fan]}</span>
          </button>

          <button
            type="button"
            className="key"
            data-active={state.swingV}
            onClick={() => apply({ swingV: !state.swingV })}
            disabled={off}
          >
            <SwingIcon size={20} />
            <span className="label">Swing</span>
            <span className="value">{state.swingV ? 'On' : 'Off'}</span>
          </button>

          <button
            type="button"
            className="key"
            data-active={state.turbo}
            onClick={() => apply({ turbo: !state.turbo, quiet: false })}
            disabled={off}
          >
            <ZapIcon size={20} />
            <span className="label">Turbo</span>
            <span className="value">{state.turbo ? 'On' : 'Off'}</span>
          </button>

          <button
            type="button"
            className="key"
            data-active={state.quiet}
            onClick={() => apply({ quiet: !state.quiet, turbo: false })}
            disabled={off}
          >
            <MoonIcon size={20} />
            <span className="label">Quiet</span>
            <span className="value">{state.quiet ? 'On' : 'Off'}</span>
          </button>

          <button
            type="button"
            className="key"
            onClick={() => apply({ lightToggle: true })}
            disabled={off}
          >
            <LightbulbIcon size={20} />
            <span className="label">Light</span>
            <span className="value">Toggle</span>
          </button>
        </div>
      </div>

      <div className="status" data-tone={tone}>
        <span className="dot" />
        <span>
          {TRANSPORT_LABEL[transport]}
          {result && <span className="detail"> · {result.detail}</span>}
        </span>
      </div>

      <button type="button" className="resend panel" onClick={() => transmit(state)}>
        <SendIcon size={15} />
        Send current state again
      </button>

      <Panel icon={<SlidersIcon size={15} />} title="More controls">
        <ToggleRow
          title="Horizontal swing"
          description="Left-right louvre movement, on units that have it."
          checked={state.swingH}
          onChange={(value) => apply({ swingH: value })}
          disabled={off}
        />
        <ToggleRow
          title="Self clean"
          description="Dries the coil after cooling to keep mould down."
          checked={state.clean}
          onChange={(value) => apply({ clean: value })}
          disabled={off}
        />
        <ToggleRow
          title="iFeel"
          description="The unit follows the temperature reported below instead of its own sensor. Re-send periodically to keep it current."
          checked={state.iFeel}
          onChange={(value) => apply({ iFeel: value })}
          disabled={off}
        />

        {state.iFeel && (
          <div className="field">
            <label htmlFor="sensor-temp">
              <ThermometerIcon size={11} /> Reported room temperature
            </label>
            <input
              id="sensor-temp"
              type="number"
              min={0}
              max={50}
              value={state.sensorTemp}
              onChange={(event) =>
                apply({ sensorTemp: Number(event.target.value) })
              }
            />
          </div>
        )}
      </Panel>

      <Panel icon={<SparklesIcon size={15} />} title="Settings">
        <div className="field">
          <label htmlFor="bridge-url">IR bridge URL</label>
          <input
            id="bridge-url"
            type="url"
            inputMode="url"
            placeholder="http://192.168.1.50:8787/ir"
            value={settings.bridgeUrl}
            onChange={(event) =>
              setSettings((s) => ({ ...s, bridgeUrl: event.target.value }))
            }
          />
          <p className="hint">
            Leave blank if your phone has its own IR blaster. Otherwise point
            this at something on your network that can emit infrared — see{' '}
            <code>bridge/server.mjs</code> in the repo for a working example.
          </p>
        </div>

        <ToggleRow
          title="Prefer the bridge"
          description="Use the network bridge even when the phone has an emitter."
          checked={settings.preferBridge}
          onChange={(value) => setSettings((s) => ({ ...s, preferBridge: value }))}
        />

        <div className="field">
          <label>Repeats per press</label>
          <div className="chips">
            {[0, 1, 2].map((count) => (
              <button
                key={count}
                type="button"
                className="chip"
                data-active={settings.repeat === count}
                onClick={() => setSettings((s) => ({ ...s, repeat: count }))}
              >
                {count === 0 ? 'Send once' : `+${count} repeat${count > 1 ? 's' : ''}`}
              </button>
            ))}
          </div>
          <p className="hint">
            Add a repeat if the A/C occasionally misses a command across the room.
          </p>
        </div>
      </Panel>

      <Panel icon={<TerminalIcon size={15} />} title="Signal">
        <CodeBlock
          label="Packet (13 bytes)"
          body={toHex(bytes)}
          hint="Byte 12 is the checksum. Get it wrong and the unit beeps but ignores you."
        />
        <p className="note">
          {pulses.length} timings · 38 kHz carrier · 50% duty
        </p>
        {snippets
          .filter((snippet) => snippet.id !== 'hex')
          .map((snippet) => (
            <CodeBlock
              key={snippet.id}
              label={snippet.label}
              body={snippet.body}
              hint={snippet.hint}
              tone={snippet.id === 'raw' ? 'cyan' : 'green'}
            />
          ))}
      </Panel>

      <p className="footer">
        Protocol ported from IRremoteESP8266 and checked against its captured
        remote traces. Works on Electra, AUX, Frigidaire and Electrolux units
        that use the 13-byte encoding.
      </p>
    </div>
  );
}
