# Buzzer Hub

A standalone two-station buzzer system. Two ESP32 stations sit on the media network.
Each one holds a WebSocket open to this hub. The first press that reaches the hub wins,
both stations lock, and the winning button lights up.

```
[Station A ESP32] ──ws──┐
                        ├──► Hub (npm start) ──ws──► Bell screen now / the game later
[Station B ESP32] ──ws──┘     decides first
```

It is built to be the buzzer system the final game connects to later (see **Integrating with
the game** below).

---

## 1. Run the hub

```bash
cd buzzer-hub
npm install
npm start
```

The hub announces itself on the network (mDNS/Bonjour, `_buzzer._tcp`), so the stations find
it on their own. No IP address goes in the firmware. If you move the hub to another machine,
just run `npm start` there: the stations look for it again within about 10 seconds.

```
  Bell screen   http://localhost:8090
  Simulator     http://localhost:8090/sim
  On network    http://192.168.1.50:8090   (stations find this automatically)
```

- Run **only one hub** per network. If two are running, stations use whichever answers first.
- If the network blocks mDNS (some managed networks do), type the hub's address (for example
  `192.168.1.50:8090`) in the station's setup page. In that case, **reserve that IP on the router**.
- Port 8090 is used because Resolume Arena already uses 8080. Change it with `PORT=9000 npm start` (and `HUB_PORT` in the firmware) if needed.
- The first time, macOS may ask whether `node` can accept incoming connections. Click **Allow**,
  or the stations can't reach the hub.

### Screens
- **Bell screen** (`/`): the big display. `Space` resets and arms, `L` locks, `1`/`2` blink
  station A's or B's light (to check which box is which), `M` mutes, `F` toggles fullscreen.
  Click once anywhere to enable sound (browsers require it).
- **Simulator** (`/sim`): two virtual stations. You can test everything before any wiring.
  Press `A` and `B` together to race them.

---

## 2. Wiring (per station)

**What you need for each station:** an ESP32 DevKit V1, an arcade button with an LED, a few
jumper wires, and a USB power bank or 5 V USB adapter. To drive the button's LED properly you
also need one NPN transistor (2N2222 / PN2222) and one 1 kΩ resistor.

### Find your button's terminals
Most LED arcade buttons have **two parts**:
- **The microswitch** (the box under the button) has 2–3 tabs: **COM**, **NO** (normally open),
  and sometimes **NC**. Use COM and NO. Leave NC empty.
- **The LED** has 2 tabs, usually marked **+** and **−**. It is rated for either **5 V or 12 V**.
  Check the listing or the LED holder.

### Button (same for every button)
| Button tab | ESP32 pin |
|---|---|
| Switch **COM** | **GND** |
| Switch **NO** | **D27** |

No resistor needed: the firmware turns on the ESP32's internal pull-up.

### LED (5 V LED, the common kind)
The ESP32's pins only give 3.3 V and a little current, so a transistor switches the LED from the
5 V pin.

```
ESP32 D26 ──[ 1 kΩ ]── B (base)
                        2N2222
ESP32 GND ───────────── E (emitter)
LED −     ───────────── C (collector)
LED +     ───────────── ESP32 VIN (5 V from USB)
```

2N2222 / PN2222 pins: hold it **flat side facing you, legs down**. Left to right they are
**E, B, C**. (Check your part's datasheet: some variants are C, B, E.)

### LED (12 V LED)
Same circuit, but **LED +** goes to the **+12 V** of a 12 V supply, and that supply's **GND**
connects to **ESP32 GND**. Never connect 12 V to any ESP32 pin.

### No transistor on hand?
Skip the button LED for now. The ESP32's **onboard blue LED** shows exactly the same patterns,
so you can test everything. Wire the button LED once you have the part.

### Pins at a glance
| Wire | Pin |
|---|---|
| Button COM | GND |
| Button NO | D27 |
| LED driver (via 1 kΩ to transistor base) | D26 |
| LED + (5 V LED) | VIN |
| Transistor emitter | GND |

---

## 3. Flash the stations

Both boards get **the same firmware with nothing to edit**.

1. Open the **Arduino IDE**.
2. **Library Manager:** install **"WebSockets" by Markus Sattler** and **"WiFiManager" by tzapu**.
3. Open `firmware/buzzer_station/buzzer_station.ino`.
4. **Tools → Board:** "DOIT ESP32 DEVKIT V1". **Tools → Port:** the USB port.
5. Upload to both boards.

If the upload hangs on `Connecting.....`, hold the **BOOT** button on the board until it starts
writing.

### Set up each station (like WLED)
1. Power the station. Its light **triple-blinks**: that means the setup hotspot is open.
2. On a phone, join the Wi-Fi network **`Buzzer-Setup`**. A setup page should pop up. If it
   doesn't, open `http://192.168.4.1` in the browser.
3. Tap **Configure WiFi**, pick the media network, and type its password.
4. **Station letter:** `A` or `B`. **Hub address:** leave blank.
5. Tap **Save**. The station restarts, joins the network, finds the hub, and starts breathing.
6. Label the box with its letter. Do the same for the other station.

The settings are kept through power cycles. The station only opens the hotspot again if it
can't find its Wi-Fi. While the hotspot is open it is named `Buzzer-A-Setup` or
`Buzzer-B-Setup`, and if nobody joins it within 2 minutes the station retries the saved Wi-Fi.

**To change networks or letters:** hold the button down while plugging the station in, and keep
holding for 3 seconds (the light flickers fast). The settings are wiped and the setup hotspot
opens.

Open **Serial Monitor at 115200** to watch the station join Wi-Fi, find the hub, and log each
press.

---

## 4. What the button light means

| Light | Meaning |
|---|---|
| Triple blink | Setup hotspot open: join `Buzzer-Setup` from a phone |
| Slow blink (1 per second) | Looking for Wi-Fi |
| Double blink | On Wi-Fi, looking for the hub (hub not running, firewall blocking `node`, or the network blocks mDNS) |
| Fast flicker at power-on | Button held: keep holding 3 s to reset settings |
| Breathing | Armed: press me |
| Strobe, then solid | You buzzed first |
| Off | Locked, or the other station won |
| 6 quick blinks | The host pressed "Blink" to identify this station |

---

## 5. Test checklist

1. `npm start`, then open the bell screen and click once for sound.
2. Open `/sim`, turn on both stations, and press A. The bell rings, "Station A" appears and B
   locks. Press B to see the `+ms` gap. Press `Space` to reset.
3. Power station A. Its light goes slow blink, then double blink, then breathing. The bell
   screen shows "Online · IP · dBm".
4. Press `1` on the bell screen. Station A's light blinks 6 times.
5. Repeat for B, then race the two real buttons.
6. Pull a station's power. Within about 10 seconds it shows **Offline** on the bell screen.

---

## Protocol (for the game developer)

Connect to `ws://<hub>:8090/ws` and send JSON text frames.

**Station → hub**
```json
{"type":"hello","role":"station","station":"A","fw":"1.1","rssi":-52}
{"type":"press","station":"A","seq":12,"t":81234567}   // t = station clock, µs
{"type":"sync","h":5012.4,"s":81230011}                // reply to the hub's sync, immediately
{"type":"status","rssi":-55}
```

**Screen/game → hub**
```json
{"type":"hello","role":"screen","name":"game"}
{"type":"reset"}                         // clear the winner and arm a new round
{"type":"lock"}                          // disarm with no winner
{"type":"identify","station":"B"}        // blink that station's light
```

**Hub → screens/game**
```json
{"type":"buzz","station":"A","round":4}  // fires once, the instant a winner is decided
{"type":"state","armed":false,"winner":"A","round":4,
 "presses":[{"station":"A","deltaMs":0,"counted":true},{"station":"B","deltaMs":23,"counted":false}],
 "stations":{"A":{"online":true,"ip":"…","rssi":-52,"sim":false},"B":{…}},
 "events":[…]}
```

**Hub → station**
```json
{"type":"led","mode":"ready|win|lose|locked|identify"}
{"type":"sync","h":5012.4}               // every 0.5 s: echo back with your clock
```

### How "first" is decided
Wi-Fi delivers packets in bursts, so the order presses *arrive* in is meaningless below about
30 ms. Each station stamps its press with its own clock. Every half second the hub measures
each station's clock offset (NTP-style, keeping the cleanest sample), so it can convert every
press to hub time. The first press opens a 150 ms decision window (`BUZZ_WINDOW_MS`), and when
it closes, the earliest actual press wins. The bell screen shows each station's timing accuracy
(`timing ±N ms`). The simulator and old firmware fall back to arrival order.

**HTTP** (for Bitfocus Companion, a phone or a Stream Deck): `GET /api/state`, `GET /api/reset`,
`GET /api/lock`.

## Integrating with the game
This is built in. The game's board (`src/hooks/useHubLink.js`, used in `App.jsx`) connects to
`ws://<same host>:8090/ws` and:

1. reports reveals, hides, strikes, round changes, the board total and both teams (name,
   total, answering team). The hub shows these on the LED screens and sends them as OSC;
2. on `buzz`, makes the team that buzzed first the **answering team** (Station A = Team 1,
   Station B = Team 2), so the next revealed answers are credited to them.

The hub address defaults to port 8090 on the machine the game page came from. Set
`VITE_HUB_URL=ws://<hub IP>:8090/ws` in the game's `.env.local` to point elsewhere.

The board window has to be open for cues to go out. Changes made on the phone host page reach
the board through the game's own sync, and the board reports them once.

---

## LED screens and team scores (for Resolume)

The hub serves three extra pages. Open the LED pages in a browser window and screen-capture
that window into Resolume.

| Page | What it is |
|---|---|
| `/control` | Operator page: both teams' names and scores (from the game), who buzzed first, who's answering, buzzer reset/lock, links to the LED pages. |
| `/banner` | Long LED banner: both team names and scores. |
| `/small` | Small LED screen: both teams' points and who buzzed first, game-show style. |
| `/small?team=A` | Same, one team only (e.g. a screen on each team's podium). Use `team=B` for the other. |

Add `?bg=black` to any LED page for a pure black background (for keying), e.g. `/small?bg=black`
or `/small?team=A&bg=black`.

### Sizing for the LED wall
Nothing has a fixed size. Every page fills whatever window it's in, and all text is measured and
resized to fit its box, so you can set the browser window (or the capture crop) to the wall's
exact pixel size once you know it.

- **Banner:** 4:1 and wider shows both teams in one row, mirrored around the ICGC mark
  (e.g. 1536×128 on 3.9 mm, 3072×256 on 1.9 mm). Squarer canvases stack the two teams in rows.
- **Small:** landscape puts the teams side by side, portrait stacks them. Single-team mode
  stays readable down to one 128×128 panel.
- Text is bold and thick with no fine lines, so it holds up on a coarse 3.9 mm pitch.

To get an exact canvas size for capture, open the page in its own window and set the window to
the wall's resolution (in Chrome: DevTools → device toolbar → enter width and height), or capture
a larger window and crop in Resolume.

### Small screen states
| State | What shows |
|---|---|
| Buzzers armed | "Buzzers ready" strip gently pulsing, marquee lights chasing slowly |
| A team buzzed first | "<Team> first!" strip flashes; that team's tile turns coral, flashes, lights chase fast; the other team dims |
| Buzzers locked by host | "Buzzers locked", tiles dimmed, lights stop |

The banner also lights up the name of the team that buzzed first.

### Team names and scores
- **The game owns them.** Set team names and fix scores in the game: the phone host page
  (`/?view=host`, **Edit votes & teams** tab) or **Host Edit** on the board. Points are earned by
  revealing answers while a team is the answering team (press **T** on the board to switch, or let
  the buzzers pick it).
- The hub only displays them. The LED screens and `/control` update by themselves.
- Team A is buzzer Station A and the game's Team 1; Team B is Station B and Team 2.
- The hub keeps the last names and scores in `buzzer-hub/teams.json`, so the screens show them
  even before the game reconnects after a restart.
- Score changes count up on the LED screens with a pop.

HTTP shortcuts for Companion or a Stream Deck (GET requests): `/api/reset` arms the buzzers,
`/api/lock` locks them, `/api/state` returns everything as JSON.

Team changes also go out as OSC: `/feud/team/A/score` points, `/feud/team/A/name` name, and
`/feud/answering` when the answering team changes.

---

## OSC output (cues for other apps)

The hub sends OSC to other apps on the network (QLab, Resolume, ProPresenter, Bitfocus
Companion, a lighting desk, TouchDesigner) whenever something happens in the game or on the
buzzers. Use it to fire a light hit on a correct answer, a sting on a strike, and so on.

Browsers can't send OSC themselves, so the game reports every event to the hub and the hub sends
the OSC. **The hub must be running for OSC to work**, even if you aren't using the buzzers.

```
Game (browser) ──ws──► Hub ──OSC/UDP──► QLab / Resolume / Companion / …
Buzzer stations ──ws──┘
```

### Teach your lighting program the cues (easiest)
Open `http://localhost:8090/osc` (or the **OSC cues** button on the bell screen). From the
lighting computer, use the hub's **On network** address.

1. Under **Send to**, add the lighting computer's IP and the port its OSC input listens on.
2. In the lighting program, put the OSC input in **learn** mode for the button or cue you want.
3. On the page, press **Send ▶** next to the moment. The program learns that address.

Every moment has its own fixed address under `/feud/cue/`, and the same message goes out during
the game every time that moment happens:

| Moment | Address |
|---|---|
| Someone buzzed in / Team 1 / Team 2 | `/feud/cue/buzz`, `/feud/cue/buzzA`, `/feud/cue/buzzB` |
| Buzzers reset & armed / locked | `/feud/cue/armed`, `/feud/cue/locked` |
| Correct answer revealed (any) / answer 1–8 | `/feud/cue/reveal`, `/feud/cue/reveal1` … `/feud/cue/reveal8` |
| Answer hidden / reveal all / hide all | `/feud/cue/hide`, `/feud/cue/revealall`, `/feud/cue/hideall` |
| Any strike / 1st / 2nd / 3rd | `/feud/cue/strike`, `/feud/cue/strike1`, `/feud/cue/strike2`, `/feud/cue/strike3` |
| Round changed / round reset / board points changed | `/feud/cue/round`, `/feud/cue/reset`, `/feud/cue/score` |
| Answering team changed / Team 1 / Team 2 | `/feud/cue/answering`, `/feud/cue/answeringA`, `/feud/cue/answeringB` |
| A team score changed | `/feud/cue/teamScore` |

- By default each one is sent as a button press: float `1.0`, then `0.0` 150 ms later. Under
  **Settings** it can be just `1.0`, or no value.
- The page lists the sound-effect moments first (buzz-ins, correct answers, strikes). **All**
  shows the rest.
- **Sent** shows every message as it goes out, and each moment glows when it fires.
- Moment cues never fire just because the game reconnects to the hub; only real moments do.
- Turn off **Built-in cues** under Settings if you only use the moment cues, so nothing else
  arrives while the program is learning.

**Programs that don't learn:** press **+ Type an address** on a moment and type the exact address
and values the program expects. Values: `1` whole number, `1.0` decimal, `true`/`false`,
`'quoted text'`. Placeholders put in the live value: `{slot}`, `{votes}`, `{text}`, `{strikes}`,
`{team}`, `{teamNumber}`, `{teamName}`, `{round}`, `{points}`, `{score}`, for example
`/eos/cue/2/{slot}/fire`. **Test** sends it with sample values.

### Or edit the file
The first time the hub starts, it creates `buzzer-hub/osc.config.json`. Open it and put in the
IP and port of the app that should receive the cues:

```json
{
  "enabled": true,
  "prefix": "/feud",
  "targets": [
    { "name": "QLab",     "host": "192.168.1.60", "port": 53000, "enabled": true },
    { "name": "Resolume", "host": "192.168.1.61", "port": 7000,  "enabled": true }
  ]
}
```

- Add as many targets as you like. Every target gets every message.
- Use `127.0.0.1` when the receiving app is on the same computer.
- Saving the file applies the change right away. No restart needed.
- `"enabled": false` (top level) turns all OSC off; on a target it skips just that one.
- `prefix` changes the start of every address (for example `/ff` instead of `/feud`).
- This file is per venue, so it isn't committed to git.

Common receive ports: QLab 53000, Resolume 7000, Companion 12321, ProPresenter: whatever you set
in its network settings, TouchDesigner: whatever you set on the OSC In node.

### Check it works
Open `http://localhost:8090/api/osc/test` in a browser. The hub sends `/feud/test 1` to every
target, and the page shows which targets it used. `http://localhost:8090/api/osc` shows the
current targets without sending anything.

The game connects to the hub at port 8090 on the same computer. If the hub runs on a different
machine, create `.env.local` in the game folder with
`VITE_HUB_URL=ws://<hub IP>:8090/ws` and restart `npm run dev`.

Cues are live: if the hub isn't connected when something happens, that cue is skipped rather
than sent late. The game reconnects on its own, and when it does it resends the round, score and
strikes so the other apps catch up.

### Addresses
Events that carry a number are sent twice: once with values for apps that read arguments
(TouchDesigner, Resolume, Companion variables), and once with the number in the address and no
values for apps that only match an exact address (QLab OSC triggers, simple Companion triggers).

| When | Address with values | Address only |
|---|---|---|
| Answer revealed (correct) | `/feud/reveal` slot, answer text, votes | `/feud/reveal/3` |
| Answer hidden again | `/feud/hide` slot | `/feud/hide/3` |
| Strike (wrong answer) | `/feud/strike` strike count (1–3) | `/feud/strike/2` |
| All answers revealed | `/feud/revealall` | |
| All answers hidden | `/feud/hideall` | |
| Round reset (hides answers, clears strikes) | `/feud/reset` | |
| Round changed | `/feud/round` round number, question | `/feud/round/4` |
| Points total changed | `/feud/score` points | |
| Strike count (on reconnect and round change) | `/feud/strikes` count | |
| Answering team changed | `/feud/answering` team letter, team number | |
| Team score changed | `/feud/team/A/score` points | |
| Team name changed | `/feud/team/A/name` name | |
| Buzzer: someone buzzed first | `/feud/buzz` station letter, station number | `/feud/buzz/A` |
| Buzzers reset and armed | `/feud/buzzer/armed` | |
| Buzzers locked by host | `/feud/buzzer/locked` | |
| Test message | `/feud/test` 1 | |

Single reveals, hides, strikes, the round, score and teams are sent by the **board window**, so
they go out exactly once whichever device made the change (laptop keys or the phone host page).
**Reveal all**, **hide all** and **reset** are sent by the window where the button was pressed;
reveal all and hide all are also followed by one `reveal`/`hide` per answer.

Values are OSC int32 for numbers and strings for text.
