# ICGC Gathering Edition — Family Feud

A Family Feud–style game show board made for the ICGC church gathering. It runs on a laptop and is meant to be shown on a projector or large screen. You don't need the internet once it's set up.

![ICGC Gathering Edition game board](docs/screenshot.png)

---

## How the game works

### What the audience sees

- The **ICGC Gathering Edition** title at the top, with the **round number** on the left.
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

> **Tip:** Host Edit mode is visible on screen, so enter the results before the projector is on, or while the screen is turned away from the audience.

---

## Getting it onto your computer

You only need to do this once per computer.

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

### 4. Install the game's parts (first time only)

Type this and press **Enter**:

```bash
npm install
```

Wait for it to finish. It may take a minute.

### 5. Start the game

Type this and press **Enter**:

```bash
npm run dev
```

You'll see an address like `http://localhost:5173/`. Open that address in **Google Chrome** (recommended), then press **F** for fullscreen.

To stop the game, go back to the terminal window and press **Ctrl + C**.

**Next time**, you only need to repeat **step 3** (open a terminal in the folder) and **step 5** (`npm run dev`).

---

## Before the event: a quick checklist

- [ ] Start the game and open it in Chrome on the laptop you'll actually use.
- [ ] Enter the vote counts in Host Edit mode **in that same browser**.
- [ ] Connect the projector and press **F** for fullscreen.
- [ ] Turn up the laptop volume (or connect speakers) if you want the sounds.
- [ ] Press **R** on any round you tested so it starts out hidden.
- [ ] Enter the team names and click **Reset team scores** in Host Edit mode so both teams start at 0.

### Projector tips

The game always draws a 16:9 board and scales it to fit the screen, so it looks the same on any laptop or projector. On a 4:3 projector you'll see a little extra background above and below the board.

- **Keep the browser zoom at 100%.** Press **Cmd + 0** (Mac) or **Ctrl + 0** (Windows) to reset it. Zooming in or out shrinks or enlarges everything.
- **Use the projector's own resolution.** On a Mac, open **System Settings → Displays**, select the projector, and choose its default resolution (usually 1920 × 1080 or 1280 × 720).
- **Mirror or extend:** mirroring shows the same screen on both. Extending lets you drag the game window onto the projector and keep the laptop screen for yourself. Either works; press **F** after the window is on the projector.
- **If the edges are cut off on the wall,** the projector is cropping the picture ("overscan"). Turn off overscan in the projector's menu, or on a Mac turn on **Underscan** in the display settings.

---

## For developers

- Built with React, Vite, and plain CSS. The icons come from `lucide-react`.
- The default questions are in [`src/data/rounds.js`](src/data/rounds.js).
- [`src/README.md`](src/README.md) describes the code structure.
- `npm run build` creates a production build in `dist/`, and `npm run lint` checks the code.
