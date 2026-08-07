/**
 * The copyable snippets are the fallback path for anyone driving the A/C
 * through a hub instead of the app, so they need to stay consistent with the
 * encoder rather than drifting into decoration.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';

import {
  DEFAULT_STATE,
  encodePulses,
  encodeState,
  toHex,
} from '../src/lib/electra.ts';
import { buildSnippets } from '../src/lib/exports.ts';

const STATE = {
  ...DEFAULT_STATE,
  power: true,
  mode: 'cool',
  temp: 24,
  fan: 'low',
  turbo: true,
};

test('every snippet is present and non-empty', () => {
  const snippets = buildSnippets(STATE);
  const ids = snippets.map((s) => s.id);

  assert.deepEqual(ids, ['raw', 'tasmota', 'esphome', 'homeassistant', 'hex']);
  for (const snippet of snippets) {
    assert.ok(snippet.body.length > 0, `${snippet.id} body`);
    assert.ok(snippet.hint.length > 0, `${snippet.id} hint`);
    assert.ok(snippet.label.length > 0, `${snippet.id} label`);
  }
});

test('raw snippet is exactly the encoder output', () => {
  const [raw] = buildSnippets(STATE);
  assert.deepEqual(JSON.parse(raw.body), encodePulses(encodeState(STATE)));
});

test('tasmota snippet carries the packet Tasmota expects', () => {
  const tasmota = buildSnippets(STATE).find((s) => s.id === 'tasmota');
  const compact = toHex(encodeState(STATE)).replace(/ /g, '');

  assert.equal(
    tasmota.body,
    `IRsend {"Protocol":"ELECTRA_AC","Bits":104,"Data":"0x${compact}"}`,
  );
  // Must be parseable as the JSON payload Tasmota's console takes.
  const json = JSON.parse(tasmota.body.slice('IRsend '.length));
  assert.equal(json.Protocol, 'ELECTRA_AC');
  assert.equal(json.Bits, 104);
});

test('esphome snippet alternates positive marks and negative spaces', () => {
  const esphome = buildSnippets(STATE).find((s) => s.id === 'esphome');
  const codes = esphome.body
    .slice(esphome.body.indexOf('code: [') + 'code: ['.length)
    .replace(/\]\s*$/, '')
    .split(',')
    .map((value) => Number(value.trim()))
    .filter((value) => !Number.isNaN(value));

  const expected = encodePulses(encodeState(STATE));
  assert.equal(codes.length, expected.length);

  codes.forEach((value, index) => {
    // Marks are positive, spaces negative — ESPHome's raw convention.
    assert.equal(Math.abs(value), expected[index], `entry ${index}`);
    assert.equal(value > 0, index % 2 === 0, `sign of entry ${index}`);
  });

  assert.ok(esphome.body.includes('carrier_frequency: 38000Hz'));
});

test('home assistant snippet includes every timing', () => {
  const ha = buildSnippets(STATE).find((s) => s.id === 'homeassistant');
  const expected = encodePulses(encodeState(STATE));

  assert.ok(ha.body.includes('remote.send_command'));
  assert.ok(ha.body.includes(`raw:${expected.join(',')}`));
});

test('repeats propagate into the snippets', () => {
  const once = buildSnippets(STATE, 0);
  const twice = buildSnippets(STATE, 1);

  const rawOnce = JSON.parse(once[0].body);
  const rawTwice = JSON.parse(twice[0].body);
  assert.equal(rawTwice.length, rawOnce.length * 2 + 1);

  // The Tasmota form is protocol-level, so repeats do not change the payload.
  const tasmotaOf = (list) => list.find((s) => s.id === 'tasmota').body;
  assert.equal(tasmotaOf(once), tasmotaOf(twice));
});
