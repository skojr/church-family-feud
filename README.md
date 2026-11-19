# ICGC Gathering Edition — Family Feud

> **New here? Start with the [Setup Guide](setup.md).** It walks you through installing, starting the game on a laptop, and controlling it from a phone.

A Family Feud–style game show board made for the ICGC church gathering. It runs on a laptop and is meant to be shown on a projector or large screen. You don't need the internet once it's set up.

![The Gathering ’26 Family Feud game board](docs/screenshot.png)

---

## How the game works

### What the audience sees

- **The Gathering ’26** title at the top, with the **round number** on the left.
- The **question** for the round in a banner across the screen.
- A board with **six numbered answer slots**. Answers stay hidden until the host reveals them.
- When the host reveals an answer, the slot **flips over** with a chime and shows the answer and how many people voted for it. Those votes are added to the score of the team that is answering.
- A **team card** on each side of the board shows that team's **total points**, with a smaller **This round** card underneath showing what the team has earned in the current round. The team that is currently answering glows and has an **Answering** tag.

There are **10 rounds**, each with its own question.

### What the host does

The host runs the game from the laptop, using the mouse or the keyboard.

- **Choose which team is answering:** click that team's panel, press **T**, or click **Team** to switch.
- **Reveal an answer:** click its slot, or press its number (**1–6**). Answers can be revealed in any order. The answer's votes go to the team that is answering. Clicking a revealed answer hides it again and takes those points back.
- **Reveal the next hidden answer:** press **Space**.
- **Wrong answer:** press **X** (or click **Strike**) to flash a big red ✕ with a buzzer. Each round keeps track of up to 3 strikes, shown under the board.
- **Change rounds:** use the **← / →** arrow keys, the **Prev / Next** buttons, or click a numbered dot at the bottom left.
- **Fullscreen:** press **F** or click **Fullscreen**. Press **F** or **Esc** to leave fullscreen.

The buttons along the bottom stay faded so they don't distract the audience. Move the mouse over them to make them easier to see.

### All keyboard shortcuts

| Key | What it does |
| --- | --- |
| **← / →** | Previous / next round |
| **1 – 6** | Reveal that answer |
| **Space** | Reveal the next hidden answer |
| **A** | Reveal all answers |
| **H** | Hide all answers |
| **R** | Reset the round (hides answers and clears strikes) |
| **X** | Add a strike |
| **T** | Switch which team is answering |
| **F** | Fullscreen on/off |
| **E** | Open/close Host Edit mode |
| **M** | Sound on/off |
| **?** | Show the shortcut list on screen |

### Entering the real vote counts (Host Edit mode)

Votes are collected separately (for example with Mentimeter). To enter the results:

1. Go to the round you want to update.
2. Press **E** or click the **pencil (Host Edit)** button. A panel slides in from the right.
3. Type in the question, the answers, and the number of votes for each one.
4. Press **E** again or click the **✕** to close the panel.

Your changes **save automatically**. Refreshing the page or closing the browser won't lose them, as long as you use the **same browser on the same computer**.

- **Restore this round** puts the current round back to its original questions and votes.
- **Restore all defaults** does the same for all 10 rounds.

The **Teams** section of the panel lets you rename each team and type in a team's total points if you need to correct it. **Reset team scores** sets both teams back to 0 for a new game.

> **Tip:** Host Edit mode is visible on screen, so enter the results before the projector is on, or while the screen is turned away from the audience. Or use the phone host page below, which the audience never sees.

### Running the game from your phone (Host Mode)

The host can control the game from a phone while the laptop shows the board on the projector. The phone shows every answer and vote count, so you can see what's coming without the audience seeing it. You can reveal answers, add strikes, switch teams, change rounds, and enter the vote counts from the phone. Everything you do on either device shows up on the other straight away.

No internet or accounts are needed, but **the phone and laptop must be on the same network**, and the game must be started with `npm run host` instead of `npm run dev`.

See the **[Setup Guide](setup.md)** for step-by-step instructions on starting host mode, connecting the phone, and fixing connection problems.

---

## Getting it onto your computer

Follow the **[Setup Guide](setup.md)**. It covers installing Node.js, downloading the game, starting it on the laptop, and (optionally) exposing it so a phone can control it.

The short version, once Node.js is installed, from the game folder:

```bash
npm install     # first time only
npm run dev     # laptop only
npm run host    # laptop + phone control
```

---

## Before the event: a quick checklist

- [ ] Start the game and open it in Chrome on the laptop you'll actually use.
- [ ] Enter the vote counts in Host Edit mode **in that same browser**.
- [ ] Connect the projector and press **F** for fullscreen.
- [ ] Turn up the laptop volume (or connect speakers) if you want the sounds.
- [ ] Press **R** on any round you tested so it starts out hidden.
- [ ] Enter the team names and click **Reset team scores** in Host Edit mode so both teams start at 0.
- [ ] If you're hosting from a phone: at the venue, run `npm run host`, open the host page on the phone, and check that revealing an answer on the phone shows up on the projector (see the [Setup Guide](setup.md#part-3-control-the-game-from-the-phone)).
- [ ] If you're using the buzzers or LED screens: start the hub (`npm start` in `buzzer-hub`), check both buzzers show **Online** on the hub page, and press each one once to test (see the [Setup Guide](setup.md#part-4-buzzers-led-screens-and-cues)).
- [ ] Open the LED pages in the browser Resolume captures and size each window to its LED canvas. Check that the team names on the banner match the board.
- [ ] Turn off laptop sleep and keep the laptop plugged in.
- [ ] For a full run-through of every screen and control, work through the [UI test plan](docs/test-plan.md).

### Projector tips

The game always draws a 16:9 board and scales it to fit the screen, so it looks the same on any laptop or projector. On a 4:3 projector you'll see a little extra background above and below the board.

- **Keep the browser zoom at 100%.** Press **Cmd + 0** (Mac) or **Ctrl + 0** (Windows) to reset it. Zooming in or out shrinks or enlarges everything.
- **Use the projector's own resolution.** On a Mac, open **System Settings → Displays**, select the projector, and choose its default resolution (usually 1920 × 1080 or 1280 × 720).
- **Mirror or extend:** mirroring shows the same screen on both. Extending lets you drag the game window onto the projector and keep the laptop screen for yourself. Either works; press **F** after the window is on the projector.
- **If the edges are cut off on the wall,** the projector is cropping the picture ("overscan"). Turn off overscan in the projector's menu, or on a Mac turn on **Underscan** in the display settings.

---

## All the links

Two programs run on the show laptop: **the game** (port 5173) and **the buzzer hub** (port 8090). Start both (see [Part 4 of the Setup Guide](setup.md#part-4-buzzers-led-screens-and-cues)).

On the laptop itself, use `localhost`. From any other device on the same network (a phone, the Resolume computer), replace `localhost` with the laptop's network address, shown as **Network** when the game starts and **On network** when the hub starts (for example `192.168.0.21`).

| Screen | On the laptop | From another device | Used for |
| --- | --- | --- | --- |
| **Game board** | http://localhost:5173 | `http://<laptop-ip>:5173` | The projector. Press **F** for fullscreen. |
| **Host view** | http://localhost:5173/?view=host | `http://<laptop-ip>:5173/?view=host` | The host's phone: answers, votes, team names, strikes. From a phone, the game must be started with `npm run host`. |
| **Buzzer hub** | http://localhost:8090 | `http://<laptop-ip>:8090` | Buzzer status, reset/lock, links to everything below. |
| **LED control** | http://localhost:8090/control | `http://<laptop-ip>:8090/control` | Team scores and buzzer state at a glance, buzzer reset/lock, LED links. |
| **LED banner** | http://localhost:8090/banner | `http://<laptop-ip>:8090/banner` | Long LED banner: team names and total points. |
| **LED small** | http://localhost:8090/small | `http://<laptop-ip>:8090/small` | Small LED screen: both teams' points and who buzzed first. |
| **LED small, Team 1 only** | http://localhost:8090/small?team=A | `http://<laptop-ip>:8090/small?team=A` | One team's podium screen. |
| **LED small, Team 2 only** | http://localhost:8090/small?team=B | `http://<laptop-ip>:8090/small?team=B` | One team's podium screen. |
| **Buzzer simulator** | http://localhost:8090/sim | `http://<laptop-ip>:8090/sim` | Test without the real buzzers. |

- Add `?bg=black` to any LED link (or `&bg=black` when it already has a `?`, like `/small?team=A&bg=black`) for a pure black background to key in Resolume.
- Team names and scores always come from the game. Change them in **Host Edit** on the board (press **E**) or the host view's **Edit votes & teams** tab; the LED screens follow by themselves.
- Buzzer A is Team 1 and buzzer B is Team 2. Whoever buzzes first becomes the answering team on the board.

---

## Buzzers, LED screens and OSC cues

The `buzzer-hub` folder is a separate small program for the extras. Run it alongside the game:

```bash
cd buzzer-hub
npm install
npm start
```

- **Buzzers:** two ESP32 buzzer stations. The first team to buzz becomes the answering team on the board automatically.
- **LED screens for Resolume:** a long banner with team names and scores, and a small "who buzzed first" screen. See [All the links](#all-the-links).
- **OSC cues** to QLab, Resolume, Companion and similar apps on every reveal, strike, round change and buzz.

Setup, wiring and the full OSC list are in [buzzer-hub/README.md](buzzer-hub/README.md).

---

## For developers

- Built with React, Vite, and plain CSS. The icons come from `lucide-react`.
- The default questions are in [`src/data/rounds.js`](src/data/rounds.js).
- [`src/README.md`](src/README.md) describes the code structure.
- `npm run build` creates a production build in `dist/`, and `npm run lint` checks the code.
