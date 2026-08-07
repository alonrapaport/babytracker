/**
 * Electra / AUX A/C infrared protocol — 13 bytes (104 bits).
 *
 * Covers the remotes Electra ships in Israel (YKR-M/003E and relatives) and the
 * AUX/Frigidaire/Electrolux units that share the same encoding.
 *
 * This is a faithful port of `ir_Electra.h` / `ir_Electra.cpp` from
 * IRremoteESP8266 (David Conran, GPL-2.0) — the reference implementation that
 * Home Assistant, ESPHome and Tasmota all lean on. Every constant, bit offset
 * and timing below comes from that source, and `test/electra.test.mjs` asserts
 * this file reproduces the project's own captured test vectors byte-for-byte
 * and pulse-for-pulse.
 *
 * Two things are worth knowing before changing anything here:
 *
 *  1. Electra remotes are *stateless-looking but stateful*. There is no
 *     "temperature up" command. Every button press re-transmits the complete
 *     state of the unit — power, mode, temp, fan, swing — as one packet.
 *  2. Bits go out LSB-first within each byte, which is the opposite of what
 *     most IR protocols do and the easiest thing in here to get wrong.
 */

export const ELECTRA_STATE_LENGTH = 13;

/** Carrier frequency in Hz, and duty cycle as a percentage. */
export const IR_CARRIER_HZ = 38000;
export const IR_DUTY_CYCLE = 50;

/** Pulse timings in microseconds. */
export const TIMING = {
  hdrMark: 9166,
  hdrSpace: 4470,
  bitMark: 646,
  oneSpace: 1647,
  zeroSpace: 547,
  /** kDefaultMessageGap — only inserted *between* repeats. */
  gap: 100000,
} as const;

export const MIN_TEMP = 16;
export const MAX_TEMP = 32;
const TEMP_DELTA = 8;

export const SENSOR_MIN_TEMP = 0;
export const SENSOR_MAX_TEMP = 50;
const SENSOR_TEMP_DELTA = 0x4a;

const SWING_ON = 0b000;
const SWING_OFF = 0b111;

const LIGHT_TOGGLE_ON = 0x15;
const LIGHT_TOGGLE_OFF = 0x08;

export type Mode = 'auto' | 'cool' | 'dry' | 'heat' | 'fan';
export type Fan = 'auto' | 'low' | 'med' | 'high';

export const MODES: Mode[] = ['cool', 'heat', 'dry', 'fan', 'auto'];
export const FAN_SPEEDS: Fan[] = ['auto', 'low', 'med', 'high'];

const MODE_BITS: Record<Mode, number> = {
  auto: 0b000,
  cool: 0b001,
  dry: 0b010,
  heat: 0b100,
  fan: 0b110,
};

const FAN_BITS: Record<Fan, number> = {
  auto: 0b101,
  low: 0b011,
  med: 0b010,
  high: 0b001,
};

export interface AcState {
  power: boolean;
  mode: Mode;
  /** Setpoint in °C, 16–32. */
  temp: number;
  fan: Fan;
  swingV: boolean;
  swingH: boolean;
  turbo: boolean;
  quiet: boolean;
  clean: boolean;
  /** Use the remote's own thermometer instead of the unit's. */
  iFeel: boolean;
  /** Ambient temp reported to the unit when `iFeel` is on, 0–50 °C. */
  sensorTemp: number;
  /**
   * Toggles the unit's display LED. This is a *toggle*, not a level: the A/C
   * flips its light every time it sees the "on" value, so we only emit it for
   * the single transmission the user asked for.
   */
  lightToggle: boolean;
  /**
   * Sensor-only update: the unit takes `sensorTemp` from the packet, ignores
   * every other setting, and stays silent (no confirmation beep).
   */
  sensorUpdate: boolean;
}

export const DEFAULT_STATE: AcState = {
  power: false,
  mode: 'cool',
  temp: 24,
  fan: 'auto',
  swingV: false,
  swingH: false,
  turbo: false,
  quiet: false,
  clean: false,
  iFeel: false,
  sensorTemp: 25,
  lightToggle: false,
  sensorUpdate: false,
};

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, Math.round(value)));

/**
 * Write `value` into `nbits` bits starting at bit `offset` of `bytes[index]`.
 * Bit 0 is the least significant bit, matching how the reference C struct's
 * bitfields are laid out by gcc on little-endian targets.
 */
function setBits(
  bytes: Uint8Array,
  index: number,
  offset: number,
  nbits: number,
  value: number,
): void {
  const mask = ((1 << nbits) - 1) << offset;
  bytes[index] = (bytes[index] & ~mask & 0xff) | ((value << offset) & mask);
}

/** Sum of bytes 0..11, truncated to 8 bits. Byte 12 carries the result. */
export function checksum(bytes: Uint8Array): number {
  let sum = 0;
  for (let i = 0; i < ELECTRA_STATE_LENGTH - 1; i++) sum += bytes[i];
  return sum & 0xff;
}

export function isChecksumValid(bytes: Uint8Array): boolean {
  return bytes.length === ELECTRA_STATE_LENGTH && bytes[12] === checksum(bytes);
}

/** Build the 13-byte packet for a given remote state. */
export function encodeState(state: AcState): Uint8Array {
  const bytes = new Uint8Array(ELECTRA_STATE_LENGTH);

  // Byte 0 — fixed preamble.
  bytes[0] = 0xc3;

  // Byte 1 — vertical swing (bits 0-2), temperature (bits 3-7).
  setBits(bytes, 1, 0, 3, state.swingV ? SWING_ON : SWING_OFF);
  setBits(bytes, 1, 3, 5, clamp(state.temp, MIN_TEMP, MAX_TEMP) - TEMP_DELTA);

  // Byte 2 — horizontal swing (bits 5-7).
  setBits(bytes, 2, 5, 3, state.swingH ? SWING_ON : SWING_OFF);

  // Byte 3 — silent sensor-only update (bit 6).
  setBits(bytes, 3, 6, 1, state.sensorUpdate ? 1 : 0);

  // Byte 4 — fan speed (bits 5-7).
  setBits(bytes, 4, 5, 3, FAN_BITS[state.fan] ?? FAN_BITS.auto);

  // Byte 5 — turbo (bit 6), quiet (bit 7).
  setBits(bytes, 5, 6, 1, state.turbo ? 1 : 0);
  setBits(bytes, 5, 7, 1, state.quiet ? 1 : 0);

  // Byte 6 — iFeel (bit 3), mode (bits 5-7).
  setBits(bytes, 6, 3, 1, state.iFeel ? 1 : 0);
  setBits(bytes, 6, 5, 3, MODE_BITS[state.mode] ?? MODE_BITS.auto);

  // Byte 7 — ambient temp for iFeel, offset by a fixed delta.
  bytes[7] = state.iFeel
    ? (clamp(state.sensorTemp, SENSOR_MIN_TEMP, SENSOR_MAX_TEMP) +
        SENSOR_TEMP_DELTA) &
      0xff
    : 0x00;

  // Byte 8 — unused.

  // Byte 9 — clean (bit 2), power (bit 5).
  setBits(bytes, 9, 2, 1, state.clean ? 1 : 0);
  setBits(bytes, 9, 5, 1, state.power ? 1 : 0);

  // Byte 10 — unused.

  // Byte 11 — display-light toggle.
  bytes[11] = state.lightToggle ? LIGHT_TOGGLE_ON : LIGHT_TOGGLE_OFF;

  // Byte 12 — checksum.
  bytes[12] = checksum(bytes);

  return bytes;
}

/** Read a packet back into a state object. Useful for decoding shared codes. */
export function decodeState(bytes: Uint8Array): AcState {
  const bit = (index: number, offset: number, nbits = 1) =>
    (bytes[index] >> offset) & ((1 << nbits) - 1);

  const modeBits = bit(6, 5, 3);
  const fanBits = bit(4, 5, 3);
  const mode =
    (Object.keys(MODE_BITS) as Mode[]).find((m) => MODE_BITS[m] === modeBits) ??
    'auto';
  const fan =
    (Object.keys(FAN_BITS) as Fan[]).find((f) => FAN_BITS[f] === fanBits) ??
    'auto';

  return {
    power: bit(9, 5) === 1,
    mode,
    temp: bit(1, 3, 5) + TEMP_DELTA,
    fan,
    // Swing is inverted: 0b000 means "swinging", 0b111 means "parked".
    swingV: bit(1, 0, 3) === SWING_ON,
    swingH: bit(2, 5, 3) === SWING_ON,
    turbo: bit(5, 6) === 1,
    quiet: bit(5, 7) === 1,
    clean: bit(9, 2) === 1,
    iFeel: bit(6, 3) === 1,
    sensorTemp: Math.max(0, bytes[7] - SENSOR_TEMP_DELTA),
    lightToggle: (bytes[11] & 0x11) === 0x11,
    sensorUpdate: bit(3, 6) === 1,
  };
}

/**
 * Turn a packet into the alternating on/off microsecond durations that an IR
 * emitter needs. The array always starts with a carrier-on period, which is
 * what Android's `ConsumerIrManager.transmit()` requires.
 *
 * A single frame is 2 (header) + 104 * 2 (bits) + 1 (trailing mark) = 211
 * entries.
 */
export function encodePulses(bytes: Uint8Array, repeat = 0): number[] {
  const frame: number[] = [];

  for (let r = 0; r <= repeat; r++) {
    if (r > 0) frame.push(TIMING.gap);

    frame.push(TIMING.hdrMark, TIMING.hdrSpace);

    for (let i = 0; i < bytes.length; i++) {
      // LSB-first within each byte.
      for (let b = 0; b < 8; b++) {
        frame.push(TIMING.bitMark);
        frame.push((bytes[i] >> b) & 1 ? TIMING.oneSpace : TIMING.zeroSpace);
      }
    }

    frame.push(TIMING.bitMark);
  }

  return frame;
}

/** Convenience: state straight to pulses. */
export function statePulses(state: AcState, repeat = 0): number[] {
  return encodePulses(encodeState(state), repeat);
}

export function toHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0').toUpperCase())
    .join(' ');
}

export function fromHex(hex: string): Uint8Array {
  const parts = hex.trim().split(/[\s,]+/).filter(Boolean);
  return Uint8Array.from(parts.map((p) => parseInt(p.replace(/^0x/i, ''), 16)));
}

/** Human-readable one-liner, handy in the debug panel and in logs. */
export function describe(state: AcState): string {
  if (state.sensorUpdate) return `Sensor update · ${state.sensorTemp}°C`;
  if (!state.power) return 'Power off';
  const bits = [state.mode, state.mode === 'fan' ? '' : `${state.temp}°C`, `fan ${state.fan}`];
  if (state.swingV) bits.push('swing');
  if (state.turbo) bits.push('turbo');
  if (state.quiet) bits.push('quiet');
  return bits.filter(Boolean).join(' · ');
}
