# `src` — Source Code Overview

This folder contains all of the code for the ICGC Gathering Edition Family Feud game. It is a small React app with no backend: everything runs in the browser, and saved changes live in the browser's `localStorage`.

## Top-level files

| File | Purpose |
| --- | --- |
| `main.jsx` | Entry point. Mounts the `App` component into the page. |
| `App.jsx` | The game itself. Holds all game state (current round, revealed answers, strikes, host mode, sound), wires up keyboard shortcuts, and lays out the screen. |
| `App.css` | All game-show styling: background lighting, title, board frame, answer-card flip animation, controls, host editor, and overlays. |
| `index.css` | Global styles: fonts, color palette variables, and base resets. |

## `components/`

Each component is one visual piece of the screen. They receive data and callbacks from `App.jsx` and don't store game data themselves.

| Component | What it represents |
| --- | --- |
| `Brand.jsx` | The "ICGC GATHERING EDITION" title with the orange "FAMILY FEUD" ribbon and the rotating light rays behind it. |
| `AnswerCard.jsx` | One answer row on the board. The front shows the number badge and a panel labeled "ICGC: The Gathering". The back shows the answer text and its vote count. Clicking it flips between the two. |
| `HostControls.jsx` | The row of buttons along the bottom (Prev, Reset, Hide All, Reveal All, Strike, Next, Sound, Host Edit, Keys, Fullscreen). |
| `HostEditor.jsx` | The slide-out side panel used in Host Edit mode to change the question, answers, and vote counts for the current round, or restore the defaults. |
| `StrikeOverlay.jsx` | The big red ✕ marks that flash across the screen when the host adds a strike. |
| `HelpOverlay.jsx` | The pop-up list of keyboard shortcuts (opened with `?`). |

## `hooks/`

Small reusable pieces of logic used by `App.jsx`.

| Hook | What it does |
| --- | --- |
| `useLocalStorage.js` | Works like React's `useState`, but also saves the value to the browser's `localStorage` and loads it back on refresh. It can take a validation function so that old or broken saved data is ignored. Used for the questions and votes, the current round, revealed answers and strikes, and the sound setting. |
| `useFullscreen.js` | Reports whether the page is currently fullscreen and provides a function that turns fullscreen on or off. |

## `data/`

| File | What it is |
| --- | --- |
| `rounds.js` | The default questions for all 10 rounds. Each round has a `question` and exactly 6 `answers`, and each answer has `text` and `votes`. Edit this file to change the built-in questions. Leaving an answer's `text` empty (`""`) makes that slot blank and unclickable. |

Changes made in Host Edit mode are saved in the browser and **override** this file. To go back to the contents of `rounds.js`, use **Restore all defaults** in the host editor.

## `lib/`

| File | What it does |
| --- | --- |
| `sounds.js` | Generates the reveal "ding" and the strike buzzer using the browser's Web Audio API, so no audio files are needed. |
