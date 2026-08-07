/**
 * Ready-to-paste snippets for the common smart-home paths.
 *
 * All of these derive from the same verified pulse array, so whatever you
 * paste is exactly what the app itself would transmit.
 */
import {
  IR_CARRIER_HZ,
  type AcState,
  describe,
  encodePulses,
  encodeState,
  toHex,
} from './electra.ts';

export interface Snippet {
  id: string;
  label: string;
  language: string;
  hint: string;
  body: string;
}

export function buildSnippets(state: AcState, repeat = 0): Snippet[] {
  const bytes = encodeState(state);
  const pulses = encodePulses(bytes, repeat);
  const hex = toHex(bytes);
  const compactHex = hex.replace(/ /g, '');
  const summary = describe(state);

  return [
    {
      id: 'raw',
      label: 'Raw timings',
      language: 'json',
      hint: 'Alternating carrier-on / carrier-off durations in microseconds, starting with on. This is the universal form — every IR sender accepts some version of it.',
      body: JSON.stringify(pulses),
    },
    {
      id: 'tasmota',
      label: 'Tasmota',
      language: 'text',
      hint: 'Tasmota bundles IRremoteESP8266, so it knows this protocol by name — no raw timings needed. Send from the console or via MQTT.',
      body: `IRsend {"Protocol":"ELECTRA_AC","Bits":104,"Data":"0x${compactHex}"}`,
    },
    {
      id: 'esphome',
      label: 'ESPHome',
      language: 'yaml',
      hint: 'Drop this into a button or script on a node that has a remote_transmitter configured.',
      body: [
        '# ' + summary,
        '- remote_transmitter.transmit_raw:',
        `    carrier_frequency: ${IR_CARRIER_HZ}Hz`,
        '    code: [',
        ...chunk(
          // ESPHome marks are positive, spaces negative.
          pulses.map((value, index) => (index % 2 === 0 ? value : -value)),
        ).map((line) => `      ${line}`),
        '    ]',
      ].join('\n'),
    },
    {
      id: 'homeassistant',
      label: 'Home Assistant',
      language: 'yaml',
      hint: 'For a Broadlink or other IR hub exposed through the remote integration. Point entity_id at your hub.',
      body: [
        `# ${summary}`,
        'action: remote.send_command',
        'target:',
        '  entity_id: remote.your_ir_hub',
        'data:',
        '  num_repeats: 1',
        '  command:',
        `    - "raw:${pulses.join(',')}"`,
      ].join('\n'),
    },
    {
      id: 'hex',
      label: 'Packet',
      language: 'text',
      hint: 'The raw 13-byte Electra packet. Byte 12 is the checksum — the unit ignores the command if it does not match.',
      body: hex,
    },
  ];
}

/** Wrap a long numeric list into readable lines. */
function chunk(values: number[], perLine = 8): string[] {
  const lines: string[] = [];
  for (let i = 0; i < values.length; i += perLine) {
    const slice = values.slice(i, i + perLine);
    const last = i + perLine >= values.length;
    lines.push(slice.join(', ') + (last ? '' : ','));
  }
  return lines;
}
