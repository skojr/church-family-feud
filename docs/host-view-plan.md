# Plan: Hidden Host View

**Status:** Replaced. Host Mode was built as a phone page (`/?view=host`) that syncs through the Vite dev server over local Wi-Fi rather than `localStorage` storage events, so it works from a phone and from a second window on the laptop. See "Running the game from your phone (Host Mode)" in the main [README](../README.md) and the `feud-sync` plugin in `vite.config.js`. The notes below are kept for history.

## Goal

Let the host edit vote counts (and optionally control the game) without the audience seeing it. The board stays on the projector the whole time.

## Recommended approach: second window on the same laptop

No database, backend, internet, or new dependencies are needed.

### Setup on the day

1. On the Mac, open **System Settings → Displays** and set the projector to **Extended display** (not mirrored).
2. **Projector:** open the normal board (`http://localhost:5173/`), drag it to the projector, and press **F** for fullscreen.
3. **Laptop screen:** open the host view (`http://localhost:5173/?view=host`). The audience never sees this window.

### How the sync works

Two windows of the same site share the browser's `localStorage`. When one window changes a value, the browser fires a `storage` event in the other windows. All game data already goes through `src/hooks/useLocalStorage.js`, including:

- questions, answers, and vote counts
- the current round
- revealed answers and strikes
- the sound setting

So if that hook listens for changes from other windows, everything syncs automatically.

### Implementation steps

1. **Cross-window sync in `useLocalStorage`.** Add a `storage` event listener that updates state when another window changes the same key:

   ```js
   useEffect(() => {
     const onStorage = (e) => {
       if (e.key === key && e.newValue != null) setValue(JSON.parse(e.newValue))
     }
     window.addEventListener('storage', onStorage)
     return () => window.removeEventListener('storage', onStorage)
   }, [key])
   ```

   The browser only fires the event when the stored value actually changes, so the two windows won't keep updating each other in a loop.

2. **Host view route.** In `App.jsx`, check for `?view=host` in the URL and render a host page instead of the board.

3. **Host page component** (for example `src/components/HostView.jsx`):
   - Every question with its answers and vote counts visible and editable. The existing `HostEditor.jsx` form can be reused.
   - Optional remote controls: Reveal answer 1–6, Reveal All, Hide All, Strike, Reset, Prev/Next round.
   - A clear "HOST VIEW — not for projector" banner, so the windows can't be mixed up.

4. **Test:** open both windows side by side and confirm that edits and reveals in the host window show up on the board immediately.

The estimated size is about 50–100 lines of code.

## Future option: editing from a phone or another device

`localStorage` belongs to one browser on one device, so a second device needs something in the middle to pass changes along.

| Approach | What it involves | Trade-offs |
| --- | --- | --- |
| **Hosted realtime database** (Supabase or Firebase) | Store the rounds in one table or document. The board and the host page both subscribe to changes. | Needs internet at the venue, an account, and an SDK. Also needs a secret in the host URL so random people can't edit. |
| **Small local server on the laptop** (Node plus WebSocket) | The laptop runs a small relay. Start Vite with `npm run dev -- --host`, and the phone opens `http://<laptop-ip>:5173/?view=host`. | No internet needed. But it's another process to run, both devices must be on the same Wi-Fi, and some guest networks block devices from talking to each other. |

The host page built in the recommended approach can be reused for either of these later.
