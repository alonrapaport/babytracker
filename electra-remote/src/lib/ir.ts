/**
 * Getting the encoded packet out of the device and into the air.
 *
 * There is no web API for infrared — not WebUSB, not WebBluetooth, nothing. A
 * page in Chrome or Safari physically cannot drive an IR LED. So the app has
 * two real transports and one honest fallback:
 *
 *   native  — the phone's own IR emitter, via Android's ConsumerIrManager.
 *             Only some phones have the hardware (Xiaomi, Redmi, Poco, older
 *             Huawei/Samsung). This is the "no extra kit" path.
 *   bridge  — HTTP POST to something on your network that owns an emitter:
 *             a Broadlink hub, an ESPHome node, Home Assistant, a Pi.
 *   none    — neither is available. The UI still works and still shows the
 *             codes, but nothing is transmitted, and we say so rather than
 *             pretending the command went out.
 */
import { Capacitor, registerPlugin } from '@capacitor/core';

import {
  IR_CARRIER_HZ,
  IR_DUTY_CYCLE,
  type AcState,
  encodePulses,
  encodeState,
  toHex,
} from './electra.ts';

export interface IrBlasterPlugin {
  /** Does this device have a hardware IR emitter? */
  isAvailable(): Promise<{
    available: boolean;
    frequencies: { min: number; max: number }[];
  }>;
  /** Transmit an alternating on/off pattern in microseconds. */
  transmit(options: { frequency: number; pattern: number[] }): Promise<void>;
}

const IrBlaster = registerPlugin<IrBlasterPlugin>('IrBlaster');

export type TransportKind = 'native' | 'bridge' | 'none';

export interface Settings {
  /** Full URL of an HTTP IR bridge, or '' to disable. */
  bridgeUrl: string;
  /** Extra transmissions per press. Some units are happier with 1. */
  repeat: number;
  /** Prefer the bridge even when the phone has an emitter. */
  preferBridge: boolean;
}

export const DEFAULT_SETTINGS: Settings = {
  bridgeUrl: '',
  repeat: 0,
  preferBridge: false,
};

export interface SendResult {
  ok: boolean;
  transport: TransportKind;
  /** Short, user-facing explanation. */
  detail: string;
}

let nativeAvailable: boolean | null = null;

/**
 * Whether this build can talk to a hardware emitter on the device itself.
 * Cached after the first probe — the answer cannot change at runtime.
 */
export async function probeNative(): Promise<boolean> {
  if (nativeAvailable !== null) return nativeAvailable;

  if (!Capacitor.isNativePlatform() || !Capacitor.isPluginAvailable('IrBlaster')) {
    nativeAvailable = false;
    return false;
  }

  let available = false;
  try {
    available = (await IrBlaster.isAvailable()).available;
  } catch {
    // An older build of the plugin, or a platform that does not have it.
    available = false;
  }

  nativeAvailable = available;
  return available;
}

/** Which transport a send would actually use, given current settings. */
export async function activeTransport(settings: Settings): Promise<TransportKind> {
  const hasBridge = settings.bridgeUrl.trim().length > 0;
  const hasNative = await probeNative();

  if (settings.preferBridge && hasBridge) return 'bridge';
  if (hasNative) return 'native';
  if (hasBridge) return 'bridge';
  return 'none';
}

/**
 * The JSON an HTTP bridge receives. Everything a receiver could plausibly
 * want is included, so a bridge can pick whichever representation suits its
 * hardware without the app needing to know which one it is.
 */
export interface BridgePayload {
  protocol: 'ELECTRA_AC';
  frequency: number;
  dutyCycle: number;
  repeat: number;
  /** Alternating carrier-on / carrier-off durations, microseconds. */
  pattern: number[];
  /** The 13-byte packet, space-separated uppercase hex. */
  hex: string;
  /** The decoded settings, for bridges that drive an A/C abstraction. */
  state: AcState;
}

export function buildPayload(state: AcState, repeat: number): BridgePayload {
  const bytes = encodeState(state);
  return {
    protocol: 'ELECTRA_AC',
    frequency: IR_CARRIER_HZ,
    dutyCycle: IR_DUTY_CYCLE,
    repeat,
    pattern: encodePulses(bytes, repeat),
    hex: toHex(bytes),
    state,
  };
}

async function sendViaBridge(
  payload: BridgePayload,
  url: string,
): Promise<SendResult> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 5000);

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    if (!response.ok) {
      return {
        ok: false,
        transport: 'bridge',
        detail: `Bridge returned ${response.status}`,
      };
    }

    return { ok: true, transport: 'bridge', detail: 'Sent via bridge' };
  } catch (error) {
    const aborted = error instanceof DOMException && error.name === 'AbortError';
    return {
      ok: false,
      transport: 'bridge',
      detail: aborted ? 'Bridge timed out' : 'Bridge unreachable',
    };
  } finally {
    clearTimeout(timer);
  }
}

async function sendViaNative(payload: BridgePayload): Promise<SendResult> {
  try {
    await IrBlaster.transmit({
      frequency: payload.frequency,
      pattern: payload.pattern,
    });
    return { ok: true, transport: 'native', detail: 'Sent via phone IR' };
  } catch (error) {
    return {
      ok: false,
      transport: 'native',
      detail: error instanceof Error ? error.message : 'IR transmit failed',
    };
  }
}

/** Encode `state` and push it out over the best available transport. */
export async function sendState(
  state: AcState,
  settings: Settings,
): Promise<SendResult> {
  const payload = buildPayload(state, settings.repeat);
  const transport = await activeTransport(settings);

  switch (transport) {
    case 'native':
      return sendViaNative(payload);
    case 'bridge':
      return sendViaBridge(payload, settings.bridgeUrl.trim());
    default:
      return {
        ok: false,
        transport: 'none',
        detail: 'No IR emitter — add a bridge in Settings',
      };
  }
}
