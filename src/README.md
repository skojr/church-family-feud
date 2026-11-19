# `src` — Source Code Overview

This folder contains all of the code for the ICGC Gathering Edition Family Feud game. It is a small React app with no backend: everything runs in the browser, and saved changes live in the browser's `localStorage`. When run with `npm run dev` or `npm run host`, a small plugin in `vite.config.js` also relays the game state between every open window (for example the projector laptop and the host's phone) and keeps a copy in `.feud-sync.json`.

## Top-level files

| File | Purpose |
| --- | --- |
| `main.jsx` | Entry point. Shows the phone host page (`HostView`) when the URL has `?view=host`, otherwise the projector display (`App`). |
| `App.jsx` | The projector display. Lays out the board, wires up keyboard shortcuts, and plays sounds and the strike overlay whenever the shared state changes (whichever device made the change). Game state and actions come from `useGame`. |
| `App.css` | All game-show styling: background lighting, title, board frame, answer-card flip animation, controls, host editor, and overlays. |
| `index.css` | Global styles: fonts, color palette variables, and base resets. |

## `components/`

Each component is one visual piece of the screen. They receive data and callbacks from `App.jsx` (or use `useGame` directly) and don't store game data themselves.

| Component | What it represents |
| --- | --- |
| `Brand.jsx` | The "ICGC GATHERING EDITION" title with the orange "FAMILY FEUD" ribbon and the rotating light rays behind it. |
| `AnswerCard.jsx` | One answer row on the board. The front shows the number badge and a panel labeled "ICGC: The Gathering". The back shows the answer text and its vote count. Clicking it flips between the two. |
| `TeamPanel.jsx` | One team's column beside the board: a card with the name, total points, and "Answering" tag (clicking it makes that team the one answering), plus a "This round" card underneath with the points earned in the current round. |
| `HostControls.jsx` | The row of buttons along the bottom (Prev, Reset, Hide All, Reveal All, Strike, Team, Next, Sound, Host Edit, Keys, Fullscreen). |
| `HostEditor.jsx` | The form for changing the question, answers, and vote counts for the current round, renaming teams, correcting team totals, or restoring the defaults. Shown as a slide-out panel in Host Edit mode on the laptop, or inline (`inline` prop) on the phone host page. |
| `HostView.jsx` / `HostView.css` | The phone host page (`/?view=host`): a connection badge, round navigation, team selector, tap-to-reveal answer list with votes, strike and other controls, and an "Edit votes & teams" tab. |
| `StrikeOverlay.jsx` | The big red ✕ marks that flash across the screen when the host adds a strike. |
| `HelpOverlay.jsx` | The pop-up list of keyboard shortcuts (opened with `?`). |

## `hooks/`

Small reusable pieces of logic.

| Hook | What it does |
| --- | --- |
| `useGame.js` | All shared game state and actions (reveal, hide, strike, switch team, change round, edit answers, set team totals, reset/restore), plus derived values such as sorted answers and team scores. Used by both `App.jsx` and `HostView.jsx`, so the display and the phone run the same logic. Each revealed answer records which team was answering; team totals are calculated from that plus any manual adjustment. |
| `useLocalStorage.js` | Works like React's `useState`, but also saves the value to the browser's `localStorage`, loads it back on refresh, and syncs it with other windows through `lib/sync.js`. It can take a validation function so that old or broken saved data (local or from another device) is ignored. |
| `useFullscreen.js` | Reports whether the page is currently fullscreen and provides a function that turns fullscreen on or off. |

## `data/`

| File | What it is |
| --- | --- |
| `rounds.js` | The default questions for all 10 rounds. Each round has a `question` and exactly 6 `answers`, and each answer has `text` and `votes`. Edit this file to change the built-in questions. Leaving an answer's `text` empty (`""`) makes that slot blank and unclickable. Also exports `sortByVotes`, which the board and host editor use to list answers from most to fewest votes (blank slots last). |

Changes made in Host Edit mode are saved in the browser and **override** this file. To go back to the contents of `rounds.js`, use **Restore all defaults** in the host editor.

## `lib/`

| File | What it does |
| --- | --- |
| `sounds.js` | Generates the reveal "ding" and the strike buzzer using the browser's Web Audio API, so no audio files are needed. |
| `sync.js` | Talks to the `feud-sync` plugin in `vite.config.js` over the dev server's WebSocket: sends local changes, receives changes from other windows, and reports whether the connection is up. Does nothing in a production build. |
