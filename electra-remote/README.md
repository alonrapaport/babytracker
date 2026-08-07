# Electra AC Remote

An infrared remote control for Electra air conditioners — the kind with the
`YKR-M/003E` handset — that transmits the **real IR signal**, either from an
Android phone's own emitter or through an IR bridge on your network.

Also works with AUX, Frigidaire, Electrolux, Centek, Subtropic and De'Longhi
units, which all share the same 13-byte encoding.

---

## Read this first: what can and cannot transmit infrared

This matters more than anything else in the project, so it is worth being blunt
about it.

**A web browser cannot emit infrared.** There is no web API for it — not
WebUSB, not WebBluetooth, nothing. A page open in Chrome or Safari on your
phone physically cannot drive the IR LED, even if the phone has one. Any web
app that claims otherwise is showing you a mock.

So there are exactly two ways to actually control the A/C:

| Path | What you need | Works offline |
| --- | --- | --- |
| **Phone IR blaster** | An Android phone with a hardware IR emitter, running this app as an APK | Yes |
| **Network bridge** | Any phone, plus something on your LAN with an emitter (Broadlink, ESPHome node, Tasmota, a Pi) | LAN only |

Phones with an IR emitter are mostly Xiaomi / Redmi / Poco, plus older Huawei
and Samsung models. If yours has one, the app detects it and says
"Phone IR blaster" in the status line. If it does not, the app says so rather
than pretending the command went out.

Run in a plain browser and everything still works except transmission — the
remote, the encoder, and the copyable codes are all live. That is genuinely
useful for setting up a hub, but it will not cool your room.

---

## Quick start

```bash
npm install
npm test        # verifies the protocol against real captured remote traces
npm run dev     # http://localhost:5173
```

### Build the Android app (the one that actually blasts IR)

```bash
npm install
npm run android          # build + cap sync + open Android Studio
```

Then **Run ▶** in Android Studio, or **Build → Build APK** and side-load it.
The app id is `com.electra.acremote`; minimum Android 8.0.

The `android/` project is checked in, including a small local Capacitor plugin
(`IrBlasterPlugin.java`) that wraps Android's `ConsumerIrManager`. That plugin
is the entire native surface — everything else is the web layer.

---

## How the protocol works

Electra remotes are not what people expect. There is no "temperature up"
command. **Every button press retransmits the complete state of the unit** —
power, mode, setpoint, fan, swing, the lot — as a single 13-byte (104-bit)
packet. The A/C adopts whatever it last heard.

```
byte  0   0xC3                       fixed preamble
byte  1   swingV (0-2), temp (3-7)   temp is °C − 8; swing is inverted
byte  2   swingH (5-7)               0b000 = swinging, 0b111 = parked
byte  3   sensor-only update (6)
byte  4   fan (5-7)
byte  5   turbo (6), quiet (7)
byte  6   iFeel (3), mode (5-7)
byte  7   ambient temp for iFeel     value is °C + 0x4A
byte  9   clean (2), power (5)
byte 11   display-light toggle
byte 12   checksum                   sum of bytes 0-11, low 8 bits
```

That packet is then sent as a 38 kHz modulated pulse train — header, 104 bits,
trailing mark, 211 timings in all:

```
header      9166 µs on, 4470 µs off
logical 1    646 µs on, 1647 µs off
logical 0    646 µs on,  547 µs off
```

Bits go out **least-significant-first within each byte**, which is the opposite
of most IR protocols and the single easiest thing to get wrong.

Get the checksum wrong and the unit beeps at you but ignores the command —
which is a genuinely useful debugging signal, because it means the timings were
right and only the payload was wrong.

### Why you can trust this implementation

`src/lib/electra.ts` is a port of [`ir_Electra.h/.cpp`][ir] from
IRremoteESP8266 — the reference implementation behind Home Assistant, ESPHome
and Tasmota. `npm test` checks that port against IRremoteESP8266's own test
suite, including packets captured from physical remotes:

- the exact 211-entry pulse train for a known packet, compared timing by timing
- a real turbo-mode capture reproduced byte for byte
- a real iFeel capture decoded to its documented settings
- every mode × fan × temperature combination checksum-verified

[ir]: https://github.com/crankyoldgit/IRremoteESP8266/blob/master/src/ir_Electra.cpp

---

## The network bridge

If your phone has no IR emitter, point the app at something that does. Put a
URL in **Settings → IR bridge URL** and the app will POST this to it on every
button press:

```json
{
  "protocol": "ELECTRA_AC",
  "frequency": 38000,
  "dutyCycle": 50,
  "repeat": 0,
  "pattern": [9166, 4470, 646, 1647, ...],
  "hex": "C3 87 E0 00 60 40 20 00 00 20 00 08 12",
  "state": { "power": true, "mode": "cool", "temp": 24, ... }
}
```

Every representation is included so a bridge can use whichever suits its
hardware. `bridge/server.mjs` is a working, dependency-free reference:

```bash
# Just print what would be sent — good for checking the app end to end
node bridge/server.mjs

# Forward to a Tasmota IR node (it knows ELECTRA_AC natively)
node bridge/server.mjs --target tasmota --host 10.0.0.42

# Hand the timings to anything else — Broadlink CLI, LIRC, pigpio
node bridge/server.mjs --target command \
  --exec "broadlink_cli --device @dev.txt --send {pulsesCsv}"
```

Then set the bridge URL to `http://<that-machine>:8787/ir`.

Two caveats worth knowing:

- The bridge listens on your LAN **without authentication** unless you pass
  `--token`. Keep it on a trusted network.
- If you serve the web app over HTTPS and the bridge over plain HTTP, browsers
  block the request as mixed content. Use the Android app, or serve the web app
  over HTTP on the LAN too.

### Not using a bridge?

Open the **Signal** panel in the app and copy a ready-made snippet for Tasmota,
ESPHome, Home Assistant, or the raw timing array. All of them are generated
from the same verified encoder, so what you paste is exactly what the app would
transmit.

---

## Project layout

```
src/
  lib/electra.ts     the protocol — state → 13 bytes → pulse timings
  lib/ir.ts          transport selection: native emitter, bridge, or neither
  lib/exports.ts     copyable Tasmota / ESPHome / Home Assistant snippets
  components/        icons, collapsible panels, copyable code blocks
  App.tsx            the remote itself
test/                protocol conformance against captured remote traces
bridge/server.mjs    reference IR bridge, no dependencies
android/             Capacitor shell + the ConsumerIrManager plugin
```

## Troubleshooting

**"No emitter" in the status line.** The phone has no IR LED, or you are
running in a browser. Add a bridge URL, or build the APK on a phone that has
one.

**The A/C beeps but does nothing.** The timings reached it but the payload was
rejected — almost always a checksum problem. Worth filing as a bug, with the
hex from the Signal panel.

**Nothing happens at all.** Point the top edge of the phone at the unit from
within a couple of metres; IR is directional and needs line of sight. If that
does not help, try **Settings → Repeats per press → +1**.

**It works but the unit disagrees about the state.** The A/C only knows what it
last heard. If someone used the physical remote in between, press any button
here to resynchronise everything at once.

## Credits

Protocol reverse engineering by the [IRremoteESP8266][ir] project
(David Conran and contributors, GPL-2.0). This is an independent
reimplementation of that documented protocol.
