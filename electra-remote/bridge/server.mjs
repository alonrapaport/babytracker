#!/usr/bin/env node
/**
 * Reference IR bridge.
 *
 * Phones without an infrared LED can still drive the A/C if something else on
 * the network owns an emitter. This is that something else: a small HTTP
 * server that accepts the app's JSON payload and hands it to whatever hardware
 * you actually have.
 *
 * No dependencies — Node 18+ only.
 *
 *   node bridge/server.mjs                                   # print, send nothing
 *   node bridge/server.mjs --target tasmota --host 10.0.0.42
 *   node bridge/server.mjs --target command \
 *     --exec "broadlink_cli --device @dev.txt --send {pulses}"
 *
 * Then put http://<this-machine>:8787/ir into the app's Settings.
 *
 * Note this listens on your LAN without authentication unless you pass
 * --token, which the app does not currently send. Keep it on a trusted
 * network, or put it behind something that does auth properly.
 */
import { createServer } from 'node:http';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

const run = promisify(execFile);

const args = parseArgs(process.argv.slice(2));
const port = Number(args.port ?? 8787);
const target = args.target ?? 'log';

const server = createServer(async (req, res) => {
  // The app may be served from a different origin than this bridge.
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');

  if (req.method === 'OPTIONS') {
    res.writeHead(204).end();
    return;
  }

  if (req.method !== 'POST') {
    res.writeHead(405, { 'Content-Type': 'text/plain' });
    res.end('POST a payload to /ir\n');
    return;
  }

  if (args.token && req.headers.authorization !== `Bearer ${args.token}`) {
    res.writeHead(401).end();
    return;
  }

  let payload;
  try {
    payload = JSON.parse(await readBody(req));
  } catch {
    res.writeHead(400, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Invalid JSON' }));
    return;
  }

  if (!Array.isArray(payload?.pattern) || payload.pattern.length === 0) {
    res.writeHead(400, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Missing pattern' }));
    return;
  }

  const label = describe(payload);

  try {
    await dispatch(payload);
    console.log(`✓ ${label}`);
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ ok: true, target }));
  } catch (error) {
    console.error(`✗ ${label}: ${error.message}`);
    res.writeHead(502, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ ok: false, error: error.message }));
  }
});

server.listen(port, () => {
  console.log(`IR bridge listening on http://0.0.0.0:${port}/ir  (target: ${target})`);
  if (target === 'log') {
    console.log('Nothing will actually be transmitted — pass --target to send.');
  }
});

async function dispatch(payload) {
  switch (target) {
    case 'log':
      console.log(`  hex     ${payload.hex}`);
      console.log(`  pulses  ${payload.pattern.length} timings @ ${payload.frequency} Hz`);
      return;

    case 'tasmota':
      return sendTasmota(payload);

    case 'command':
      return sendCommand(payload);

    default:
      throw new Error(`Unknown target "${target}"`);
  }
}

/**
 * Tasmota's IR build embeds IRremoteESP8266, so it understands this protocol
 * by name and re-derives the timings itself — we only send the 13 bytes.
 */
async function sendTasmota(payload) {
  if (!args.host) throw new Error('--host is required for the tasmota target');

  const command = `IRsend {"Protocol":"ELECTRA_AC","Bits":104,"Data":"0x${payload.hex.replace(/ /g, '')}"}`;
  const url = new URL(`http://${args.host}/cm`);
  url.searchParams.set('cmnd', command);
  if (args.user) url.searchParams.set('user', args.user);
  if (args.password) url.searchParams.set('password', args.password);

  const response = await fetch(url, { signal: AbortSignal.timeout(5000) });
  if (!response.ok) throw new Error(`Tasmota returned ${response.status}`);
}

/**
 * Escape hatch for everything else — Broadlink CLI, LIRC, pigpio, a Python
 * script you already have. Placeholders are passed as separate argv entries,
 * never interpolated into a shell string.
 */
async function sendCommand(payload) {
  if (!args.exec) throw new Error('--exec is required for the command target');

  const [program, ...rest] = args.exec.split(/\s+/);
  const argv = rest.map((token) =>
    token
      .replace('{pulses}', payload.pattern.join(' '))
      .replace('{pulsesCsv}', payload.pattern.join(','))
      .replace('{hex}', payload.hex.replace(/ /g, ''))
      .replace('{frequency}', String(payload.frequency)),
  );

  const { stdout, stderr } = await run(program, argv, { timeout: 10000 });
  if (stdout.trim()) console.log(`  ${stdout.trim()}`);
  if (stderr.trim()) console.log(`  ${stderr.trim()}`);
}

function describe(payload) {
  const s = payload.state ?? {};
  if (!s.power) return 'power off';
  const temp = s.mode === 'fan' ? '' : ` ${s.temp}C`;
  return `${s.mode}${temp} fan:${s.fan}${s.swingV ? ' swing' : ''}`;
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk;
      // A frame is a few KB; anything much larger is not ours.
      if (body.length > 1e6) {
        reject(new Error('Body too large'));
        req.destroy();
      }
    });
    req.on('end', () => resolve(body));
    req.on('error', reject);
  });
}

function parseArgs(argv) {
  const out = {};
  for (let i = 0; i < argv.length; i++) {
    if (!argv[i].startsWith('--')) continue;
    const key = argv[i].slice(2);
    const next = argv[i + 1];
    if (next && !next.startsWith('--')) {
      out[key] = next;
      i++;
    } else {
      out[key] = true;
    }
  }
  return out;
}
