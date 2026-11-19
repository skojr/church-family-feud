# Setup Guide

Step-by-step instructions for getting the game running on a laptop, and then controlling it from a phone. For how to play and the keyboard shortcuts, see the main [README](README.md).

- [Part 1: Get the game running on the laptop](#part-1-get-the-game-running-on-the-laptop)
- [Part 2: Expose the game so a phone can reach it](#part-2-expose-the-game-so-a-phone-can-reach-it)
- [Part 3: Control the game from the phone](#part-3-control-the-game-from-the-phone)
- [Part 4: Buzzers, LED screens and cues](#part-4-buzzers-led-screens-and-cues)
- [Troubleshooting](#troubleshooting)

All the addresses (board, host view, buzzer hub, LED screens) are listed in one table in the README: [All the links](README.md#all-the-links).

---

## Part 1: Get the game running on the laptop

Steps 1 to 4 only need to be done once per computer.

### 1. Install Node.js

The game uses a free program called **Node.js** to run.

1. Go to [nodejs.org](https://nodejs.org/).
2. Download the **LTS** version (version 22 or newer) and install it with the default options.

### 2. Download the game from GitHub

Pick **one** of these options.

**Option A — Download a ZIP (easiest)**

1. Open the project's GitHub page in your browser.
2. Click the green **Code** button, then click **Download ZIP**.
3. Find the ZIP in your Downloads folder and double-click it to unzip it.
4. Move the unzipped folder somewhere easy to find, such as your Desktop or Documents.

**Option B — Use Git (if you already have it)**

```bash
git clone https://github.com/<your-username>/<repo-name>.git
```

Replace the address with the one shown under the green **Code** button on the GitHub page.

### 3. Open a terminal in the game folder

- **Mac:** Open the **Terminal** app. Type `cd ` (with a space after it), drag the `church-family-feud` folder into the Terminal window, and press **Enter**.
- **Windows:** Open the `church-family-feud` folder in File Explorer, click the address bar at the top, type `cmd`, and press **Enter**.

> If you downloaded the whole project, the `church-family-feud` folder may be inside another folder. Open the folder that contains the `package.json` file.

### 4. Install the game's parts

Type this and press **Enter**:

```bash
npm install
```

Wait for it to finish. It may take a minute.

### 5. Start the game

If you're only using the laptop (no phone), type this and press **Enter**:

```bash
npm run dev
```

You'll see an address like `http://localhost:5173/`. Open that address in **Google Chrome** (recommended), then press **F** for fullscreen.

If you want to control the game from a phone, use `npm run host` instead and go to [Part 2](#part-2-expose-the-game-so-a-phone-can-reach-it).

To stop the game, go back to the terminal window and press **Ctrl + C**.

**Next time**, you only need to repeat step 3 (open a terminal in the folder) and step 5.

---

## Part 2: Expose the game so a phone can reach it

`npm run dev` only accepts connections from the laptop itself, so a phone can't open it. `npm run host` makes the game reachable from other devices on the same network. No internet or accounts are needed.

### 1. Put the phone and laptop on the same network

Connect both to the same Wi-Fi.

> Many church and guest Wi-Fi networks block devices from talking to each other. If you're not sure, use the phone's hotspot instead: turn on **Personal Hotspot** on the phone (**Settings → Personal Hotspot** on iPhone, **Settings → Network → Hotspot** on Android) and connect the laptop to it. The game itself doesn't use any mobile data.

### 2. Start the game in host mode

In the terminal (in the game folder), stop the game if it's already running (**Ctrl + C**), then type this and press **Enter**:

```bash
npm run host
```

The terminal shows two addresses, for example:

```
➜  Local:   http://localhost:5173/
➜  Network: http://192.168.1.23:5173/
```

Write down or keep the **Network** address visible; the phone needs it. If you see `Network: use --host to expose` instead, you ran `npm run dev` by mistake: stop it and run `npm run host`.

If the Mac asks whether to allow incoming connections for `node`, click **Allow**.

> If you switch networks (for example, from the church Wi-Fi to the hotspot), stop the game and run `npm run host` again. The Network address changes with the network.

### 3. Open the board on the laptop

1. Open the **Local** address (`http://localhost:5173/`) in Chrome.
2. Move the web view window onto the projector if you're using an extended display, then press **F** for fullscreen.
3. Click the page once. Browsers only play sound after you've clicked the page.

---

## Part 3: Control the game from the phone

### 1. Open the host page

On the phone's browser, type the **Network** address from Part 2 with `?view=host` added to the end. For example:

```
http://192.168.1.23:5173/?view=host
```

Type it exactly, starting with `http://` (not `https://`). The banner at the top should say **Connected**.

> Tip: add the page to your home screen or bookmark it so you don't have to retype it. If the network changes, the address will change too.

### 2. Check that it works

Tap an answer on the phone and make sure it flips over on the projector. Tap it again to hide it. Then press **R** on the laptop or **Reset round** on the phone so the round starts hidden.

### 3. Run the game

On the phone you can:

- Tap a team to make it the answering team.
- Tap an answer to reveal it on the projector (its votes go to the answering team). Tap it again to hide it.
- Strike, Switch team, Reveal all, Hide all, Reset round, Sound on/off, and change rounds with the arrows.
- Use **Edit votes & teams** to type in the Mentimeter results, team names, and team totals.

Everything you do on either device shows up on the other straight away. The laptop's keyboard and mouse keep working too, so if the phone has a problem, just carry on from the laptop.

### 4. During the event

- Keep the laptop plugged in and turn off sleep. If the laptop sleeps, the phone disconnects.
- Leave the terminal running `npm run host` open. Closing it stops the game for both devices.
- Don't edit the code files while the game is running: the pages reload when a file changes.

---

## Part 4: Buzzers, LED screens and cues

This part is only needed if you're using the buzzers, the LED wall screens or OSC cues. They run in a second small program, the **buzzer hub**, alongside the game.

### 1. Start the hub

Open a **second** terminal window (leave the game running in the first), go to the game folder, then:

```bash
cd buzzer-hub
npm install
npm start
```

`npm install` is only needed the first time. The hub prints its addresses:

```
  Bell screen   http://localhost:8090
  Simulator     http://localhost:8090/sim
  Control       http://localhost:8090/control   (LED screens and buzzers)
  LED banner    http://localhost:8090/banner
  LED small     http://localhost:8090/small
  On network    http://192.168.1.23:8090   (stations find this automatically)
```

The first time, macOS may ask whether `node` can accept incoming connections. Click **Allow**.

### 2. Check the buzzers

Open http://localhost:8090. Power the two buzzer stations; within about 10 seconds both show **Online**. Press each one: the screen shows who buzzed first, and on the game board that team becomes the **Answering** team. Press **Reset & arm** (or Space) to arm them again.

No buzzers yet? Open http://localhost:8090/sim and press **A** or **B** on the keyboard.

### 3. Open the LED screens

Use the buttons along the bottom of the hub page, or the links in [All the links](README.md#all-the-links). Open each LED page in its own browser window, set the window to the LED canvas size (or crop in Resolume), and screen-capture it into Resolume. Everything resizes to fit, from one 128×128 panel to a long strip.

If Resolume runs on a different computer, open the pages there using the laptop's **On network** address instead of `localhost`.

### 4. Optional: OSC cues

To fire cues in QLab, Resolume, Companion or a lighting desk, put the receiving app's IP and port in `buzzer-hub/osc.config.json` (the hub creates it the first time it starts) and save. Open http://localhost:8090/api/osc/test to send a test message. The full list of cues is in [buzzer-hub/README.md](buzzer-hub/README.md#osc-output-cues-for-other-apps).

### Order on the day

1. Start the game (`npm run host` if the host uses a phone, otherwise `npm run dev`).
2. Start the hub (`npm start` in `buzzer-hub`).
3. Open the board on the projector, the host view on the phone, and the LED pages for Resolume.

The game finds the hub by itself, in any order. If the hub is restarted, the LED screens catch up within a few seconds.

---

## Troubleshooting

**The phone says the connection timed out or the page won't load**

1. Check the terminal shows a **Network** address. If it says `use --host to expose`, stop it and run `npm run host`.
2. Check the address on the phone matches the Network address exactly, including `:5173`, and starts with `http://`.
3. Check the phone and laptop are on the same network. Turn off mobile data on the phone briefly to make sure it's using the Wi-Fi or hotspot.
4. If they're on the same Wi-Fi and it still fails, the network is probably blocking device-to-device traffic. Switch to the phone's Personal Hotspot (Part 2, step 1), restart `npm run host`, and use the new Network address.
5. Turn off any VPN on the laptop or phone.
6. On a Mac, if the firewall is on, open **System Settings → Network → Firewall → Options** and make sure `node` is allowed to receive incoming connections.

**The banner says Reconnecting…**

Wait a few seconds; it catches up automatically. If it doesn't, check the laptop is awake and the terminal is still running, then refresh the phone page.

**The banner says Not synced (run npm run host)**

The game is being served as a production build (for example `npm run preview`) instead of `npm run host`. Phone control only works with `npm run host`.

**The LED screens show 0 or old team names**

The game sends the team names and scores to the hub. Check the board is open in a browser (it's the board page that reports to the hub) and the hub is running. If the hub was started before an update, stop it with Ctrl + C and run `npm start` again.

**A buzzer stays Offline**

Check it has power and is on the same network as the laptop. If the network blocks discovery, type the hub's **On network** address (for example `192.168.1.23:8090`) in the station's setup page. See [buzzer-hub/README.md](buzzer-hub/README.md).

**Starting completely fresh**

The shared game state is saved in a `.feud-sync.json` file in the game folder, so stopping and restarting `npm run host` keeps everything. To start fresh, stop the game, delete that file, start it again, and use **Restore all defaults** and **Reset team scores** in Host Edit mode.
