/**
 * Protocol conformance tests.
 *
 * The vectors below are lifted verbatim from IRremoteESP8266's own
 * `test/ir_Electra_test.cpp` — several of them are real captures from physical
 * Electra remotes (see the linked issues). If this file passes, the encoder in
 * `src/lib/electra.ts` produces exactly the bytes and exactly the infrared
 * timings that a genuine remote does.
 *
 * Run with:  npm test
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';

import {
  DEFAULT_STATE,
  ELECTRA_STATE_LENGTH,
  checksum,
  decodeState,
  encodePulses,
  encodeState,
  fromHex,
  isChecksumValid,
  toHex,
} from '../src/lib/electra.ts';

/**
 * The expected on-air signal for the packet below, copied from the
 * `TestSendElectraAC.SendDataOnly` expectation. `m` = carrier on (mark),
 * `s` = carrier off (space), both in microseconds. The trailing `s100000` is
 * the inter-message gap, which we deliberately do not emit inside a frame.
 */
const EXPECTED_SIGNAL =
  'm9166s4470m646s1647m646s1647m646s547m646s547m646s547m646s547m646s1647m646s16' +
  '47m646s1647m646s1647m646s1647m646s547m646s547m646s547m646s547m646s1647m646s5' +
  '47m646s1647m646s1647m646s547m646s1647m646s1647m646s1647m646s1647m646s547m646' +
  's547m646s547m646s1647m646s547m646s1647m646s547m646s547m646s547m646s547m646s5' +
  '47m646s547m646s547m646s1647m646s1647m646s547m646s547m646s547m646s547m646s547' +
  'm646s547m646s547m646s547m646s547m646s547m646s547m646s547m646s547m646s547m646' +
  's1647m646s547m646s547m646s547m646s547m646s547m646s547m646s547m646s547m646s54' +
  '7m646s547m646s547m646s547m646s547m646s547m646s547m646s547m646s547m646s547m64' +
  '6s547m646s547m646s547m646s547m646s547m646s1647m646s547m646s547m646s547m646s5' +
  '47m646s547m646s547m646s547m646s547m646s547m646s547m646s1647m646s547m646s1647' +
  'm646s547m646s547m646s547m646s547m646s547m646s1647m646s547m646s1647m646s1647m' +
  '646s547m646s547m646s547m646s547m646s100000';

const EXPECTED_PULSES = [...EXPECTED_SIGNAL.matchAll(/[ms](\d+)/g)].map((m) =>
  Number(m[1]),
);

/** The packet that produces the signal above. */
const CAPTURED_PACKET = fromHex('C3 87 F6 28 60 00 20 00 00 20 00 05 0D');

test('captured packet has a valid checksum', () => {
  assert.equal(CAPTURED_PACKET.length, ELECTRA_STATE_LENGTH);
  assert.equal(checksum(CAPTURED_PACKET), 0x0d);
  assert.ok(isChecksumValid(CAPTURED_PACKET));
});

test('pulse encoding matches the reference signal exactly', () => {
  const pulses = encodePulses(CAPTURED_PACKET);

  // A frame is 2 header + 104 bits * 2 + 1 trailing mark.
  assert.equal(pulses.length, 211);
  // The reference string carries one extra entry: the inter-message gap.
  assert.equal(EXPECTED_PULSES.length, 212);
  assert.deepEqual(pulses, EXPECTED_PULSES.slice(0, 211));
});

test('pulses always start with a mark, as ConsumerIrManager requires', () => {
  const pulses = encodePulses(encodeState(DEFAULT_STATE));
  assert.equal(pulses[0], 9166);
  assert.equal(pulses.length % 2, 1);
});

test('repeats are separated by the message gap', () => {
  const once = encodePulses(CAPTURED_PACKET, 0);
  const twice = encodePulses(CAPTURED_PACKET, 1);
  assert.equal(twice.length, once.length * 2 + 1);
  assert.equal(twice[once.length], 100000);
  assert.deepEqual(twice.slice(0, once.length), once);
});

test('decodes the captured packet to its documented settings', () => {
  // "Power: On, Mode: 1 (Cool), Temp: 24C, Fan: 3 (Low),
  //  Swing(V): Off, Swing(H): Off"
  const s = decodeState(CAPTURED_PACKET);
  assert.equal(s.power, true);
  assert.equal(s.mode, 'cool');
  assert.equal(s.temp, 24);
  assert.equal(s.fan, 'low');
  assert.equal(s.swingV, false);
  assert.equal(s.swingH, false);
});

test('reproduces a real turbo-mode packet byte for byte', () => {
  // From IRremoteESP8266 issue #1033 (comment 583888046): a genuine remote
  // capture with turbo engaged.
  const expected = fromHex('C3 87 E0 00 60 40 20 00 00 20 00 08 12');

  const actual = encodeState({
    ...DEFAULT_STATE,
    power: true,
    mode: 'cool',
    temp: 24,
    fan: 'low',
    swingV: false,
    swingH: false,
    turbo: true,
  });

  assert.equal(toHex(actual), toHex(expected));
});

test('temperature occupies the top 5 bits of byte 1', () => {
  for (const [temp, byte1] of [
    [16, 0x47],
    [24, 0x87],
    [32, 0xc7],
  ]) {
    const bytes = encodeState({ ...DEFAULT_STATE, power: true, temp });
    assert.equal(bytes[1], byte1, `temp ${temp}`);
  }
});

test('temperature is clamped to the 16-32C range', () => {
  assert.equal(decodeState(encodeState({ ...DEFAULT_STATE, temp: 5 })).temp, 16);
  assert.equal(decodeState(encodeState({ ...DEFAULT_STATE, temp: 99 })).temp, 32);
});

test('mode and fan bits match the reference constants', () => {
  const modeOf = (mode) => encodeState({ ...DEFAULT_STATE, mode })[6] >> 5;
  assert.equal(modeOf('auto'), 0b000);
  assert.equal(modeOf('cool'), 0b001);
  assert.equal(modeOf('dry'), 0b010);
  assert.equal(modeOf('heat'), 0b100);
  assert.equal(modeOf('fan'), 0b110);

  const fanOf = (fan) => encodeState({ ...DEFAULT_STATE, fan })[4] >> 5;
  assert.equal(fanOf('auto'), 0b101);
  assert.equal(fanOf('low'), 0b011);
  assert.equal(fanOf('med'), 0b010);
  assert.equal(fanOf('high'), 0b001);
});

test('swing is inverted — 0b000 means swinging', () => {
  const on = encodeState({ ...DEFAULT_STATE, swingV: true, swingH: true });
  assert.equal(on[1] & 0b111, 0b000);
  assert.equal(on[2] >> 5, 0b000);

  const off = encodeState({ ...DEFAULT_STATE, swingV: false, swingH: false });
  assert.equal(off[1] & 0b111, 0b111);
  assert.equal(off[2] >> 5, 0b111);
});

test('power lives in bit 5 of byte 9, clean in bit 2', () => {
  assert.equal(encodeState({ ...DEFAULT_STATE, power: true })[9] & 0x20, 0x20);
  assert.equal(encodeState({ ...DEFAULT_STATE, power: false })[9] & 0x20, 0x00);
  assert.equal(encodeState({ ...DEFAULT_STATE, clean: true })[9] & 0x04, 0x04);
});

test('iFeel carries the ambient temperature with a 0x4A offset', () => {
  // Real capture from issue #1033: iFeel on, sensor reading 26C.
  const captured = fromHex('C3 6F E0 00 A0 00 28 64 00 20 00 1E 7C');
  const s = decodeState(captured);
  assert.equal(s.iFeel, true);
  assert.equal(s.sensorTemp, 26);
  assert.equal(s.temp, 21);
  assert.equal(s.fan, 'auto');
  assert.equal(s.mode, 'cool');
  assert.ok(isChecksumValid(captured));

  const bytes = encodeState({ ...DEFAULT_STATE, iFeel: true, sensorTemp: 26 });
  assert.equal(bytes[7], 0x64);
  assert.equal(bytes[6] & 0x08, 0x08);
});

test('every generated packet carries a valid checksum', () => {
  for (const mode of ['auto', 'cool', 'dry', 'heat', 'fan']) {
    for (const fan of ['auto', 'low', 'med', 'high']) {
      for (let temp = 16; temp <= 32; temp++) {
        const bytes = encodeState({
          ...DEFAULT_STATE,
          power: true,
          mode,
          fan,
          temp,
        });
        assert.ok(isChecksumValid(bytes), `${mode}/${fan}/${temp}`);
      }
    }
  }
});

test('encode and decode round-trip', () => {
  const state = {
    ...DEFAULT_STATE,
    power: true,
    mode: 'heat',
    temp: 27,
    fan: 'high',
    swingV: true,
    swingH: true,
    turbo: true,
    quiet: false,
    clean: true,
    iFeel: true,
    sensorTemp: 22,
    lightToggle: true,
    sensorUpdate: false,
  };
  assert.deepEqual(decodeState(encodeState(state)), state);
});

test('hex helpers round-trip', () => {
  const bytes = encodeState({ ...DEFAULT_STATE, power: true });
  assert.deepEqual(fromHex(toHex(bytes)), bytes);
});
