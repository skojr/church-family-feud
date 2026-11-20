# UI Test Plan

A hands-on checklist for walking through the whole game and making sure nothing breaks or behaves unexpectedly. Work top to bottom and tick each box when the **Expected** result matches what you see. If something doesn't match, note the step number and what happened in the [Issues found](#issues-found) table at the end.

Takes about 30–40 minutes. Sections 1–9 need only the laptop; sections 10–12 also need a phone.

> **Heads up:** testing changes the saved game (scores, reveals, edited questions). Run this **before** you enter the real vote counts, or finish with [section 14](#14-clean-up) to put everything back.

---

## 0. Before you start

- [ ] 0.1 Laptop is plugged in, sound is on, and Chrome is installed.
- [ ] 0.2 In the game folder, run `npm install` (first time only), then `npm run host`. **Expected:** the terminal shows a **Local** and a **Network** address with no red errors.
- [ ] 0.3 Open the **Local** address in Chrome. Keep the terminal window visible so you can spot errors.
- [ ] 0.4 Open Chrome DevTools (**Cmd + Option + J** on Mac, **Ctrl + Shift + J** on Windows) and leave the **Console** tab open off to the side. **Expected:** no red errors. Check this again at the end of each section.
- [ ] 0.5 To start from a clean slate: press **E**, click **Restore all defaults** (confirm), click **Reset team scores** (confirm), then press **E** to close.

---

## 1. First load and layout

- [ ] 1.1 **Expected:** the page shows, top to bottom: the **Round 1 of 10** box on the left, the **THE GATHERING ’26** title with the coral **Family Feud** pill (with the ICGC logo) in the middle, the question banner, the board with six numbered slots between **Team 1** and **Team 2**, three empty strike boxes under the board, and the round dots and control buttons along the bottom.
- [ ] 1.2 **Expected:** colours are violet/plum with coral text and points. No blue or orange from the old design anywhere.
- [ ] 1.3 **Expected:** the title uses the tall condensed font, not a fallback like Arial or Times. The hidden slots show **THE GATHERING ’26** in a serif font.
- [ ] 1.4 **Expected:** the six answer rows slide in one after another when the page loads.
- [ ] 1.5 **Expected:** the bottom controls are faded. Moving the mouse over them makes them fully visible.
- [ ] 1.6 **Expected:** the browser tab title reads **The Gathering ’26 – Family Feud** and the tab icon is a violet circle with a coral cross.
- [ ] 1.7 Resize the Chrome window to be narrow, then short, then wide. **Expected:** the whole board scales down to fit and stays 16:9. Nothing is cut off, overlaps, or needs scrolling.
- [ ] 1.8 Zoom with **Cmd/Ctrl + +** and **Cmd/Ctrl + −**, then reset with **Cmd/Ctrl + 0**. **Expected:** at 100% everything fits again.

---

## 2. Choosing the answering team

- [ ] 2.1 **Expected:** Team 1 is highlighted with a glow and an **Answering** tag. Team 2 is dimmer.
- [ ] 2.2 Click the **Team 2** panel. **Expected:** Team 2 becomes highlighted with the **Answering** tag. Team 1 dims.
- [ ] 2.3 Press **T**. **Expected:** the highlight switches back to Team 1.
- [ ] 2.4 Click the **Team** button in the bottom controls. **Expected:** it switches to Team 2. Press **T** again to go back to Team 1.

---

## 3. Revealing answers and scoring

Stay on Round 1 with **Team 1** answering.

- [ ] 3.1 Click slot **1**. **Expected:** it flips over with a chime and shows the answer text and vote count in coral. Its number badge turns coral. A light sweep crosses the bar.
- [ ] 3.2 **Expected:** Team 1's **Total points** and **This round** both increase by that answer's votes. Team 2 stays at 0.
- [ ] 3.3 Press **3** on the keyboard. **Expected:** slot 3 flips over and its votes are added to Team 1.
- [ ] 3.4 Press **T** to make Team 2 answer, then press **Space**. **Expected:** the next hidden answer from the top (slot 2) flips over and its votes go to **Team 2**, not Team 1.
- [ ] 3.5 **Expected:** Team 1 keeps the points from slots 1 and 3. Switching teams doesn't move points that were already given.
- [ ] 3.6 Click slot **1** again. **Expected:** it flips back to hidden and Team 1 loses exactly that answer's votes.
- [ ] 3.7 Press **1** again. **Expected:** slot 1 is revealed again and credited to **Team 2**, which is answering now.
- [ ] 3.8 Press **Space** repeatedly until all answers are shown, then once more. **Expected:** each press reveals the next hidden answer. The extra press does nothing and nothing breaks.
- [ ] 3.9 Press **H** (Hide all). **Expected:** every slot flips back to hidden and both teams' **This round** goes back to 0. Their totals drop by the same amounts.
- [ ] 3.10 With Team 1 answering, reveal slot 2, then press **A** (Reveal all). **Expected:** all remaining answers flip over without adding any points. Slot 2 keeps its original credit, so Team 1's score only includes slot 2.
- [ ] 3.11 Press **R** (Reset round). **Expected:** all answers hide, strikes clear, and this round's points are removed from both teams.

---

## 4. Strikes

- [ ] 4.1 Press **X**. **Expected:** a big red **✕** flashes in the middle of the screen with a buzzer, then fades. The first strike box under the board turns red.
- [ ] 4.2 Press **X** twice more. **Expected:** the flash shows two, then three ✕ marks. All three boxes under the board are red.
- [ ] 4.3 Press **X** a fourth time. **Expected:** the flash and buzzer still play, but the board stays at three red boxes and doesn't add a fourth.
- [ ] 4.4 Click **Strike** in the bottom controls. **Expected:** same flash and buzzer.
- [ ] 4.5 Press **R**. **Expected:** all three strike boxes clear.
- [ ] 4.6 Add one strike, then go to the next round and back. **Expected:** the strike flash doesn't replay when you change rounds, and Round 1 still shows its one strike.

---

## 5. Changing rounds

- [ ] 5.1 Press **→**. **Expected:** **Round 2 of 10** shows in the round box and footer, a new question appears, the board rows slide in again, and all slots are hidden.
- [ ] 5.2 Press **←**. **Expected:** back on Round 1, and any answers revealed there earlier are still revealed.
- [ ] 5.3 On Round 1, check the **Prev** button and press **←**. **Expected:** Prev is greyed out and nothing happens.
- [ ] 5.4 Click round dot **10**. **Expected:** jumps to Round 10. **Next** is greyed out and **→** does nothing.
- [ ] 5.5 Look at the round dots. **Expected:** the current round is coral and slightly larger, earlier rounds are violet, and later rounds are dim.
- [ ] 5.6 Reveal one answer in Round 10, then go back to Round 1. **Expected:** team totals include points from both rounds, and **This round** only shows the current round's points.

---

## 6. Sound

- [ ] 6.1 Press **M**. **Expected:** the sound button changes to **Muted**.
- [ ] 6.2 Reveal an answer and add a strike. **Expected:** no chime or buzzer, but the flip and red ✕ flash still happen.
- [ ] 6.3 Press **M** again. **Expected:** the button shows **Sound**, and reveals and strikes make sounds again.
- [ ] 6.4 Refresh the page and click it once. **Expected:** the sound setting you left is remembered.

---

## 7. Fullscreen, help, and keyboard safety

- [ ] 7.1 Press **F**. **Expected:** the game goes fullscreen and the button reads **Exit**.
- [ ] 7.2 Press **F** again, then go fullscreen once more and press **Esc**. **Expected:** both leave fullscreen.
- [ ] 7.3 Press **?** (Shift + /). **Expected:** the **Keyboard Shortcuts** card appears over a blurred background and lists all the shortcuts.
- [ ] 7.4 Click **Got it**. Open it again with the **Keys** button, then click the dark area outside the card. Open it once more and press **Esc**. **Expected:** each one closes the card.
- [ ] 7.5 Press **Cmd/Ctrl + R**. **Expected:** the browser refreshes normally and the game doesn't treat it as **Reset round**. After the refresh, the round, reveals, scores and answering team are exactly as you left them.

---

## 8. Host Edit mode (laptop)

- [ ] 8.1 Press **E**. **Expected:** the edit panel slides in from the right showing the current round number, the question, six answer rows with vote counts, the total votes, the two teams, and the restore buttons. The **Host Edit** button is highlighted coral.
- [ ] 8.2 Click in the question box and type. **Expected:** the question banner on the board updates as you type. Pressing letters like **R**, **X** or **1** types them and does **not** trigger game shortcuts.
- [ ] 8.3 Press **Esc** while typing. **Expected:** the cursor leaves the box but the panel stays open.
- [ ] 8.4 Change an answer's text and its votes. **Expected:** the board updates, and **Total votes** adds up correctly.
- [ ] 8.5 Give the bottom answer more votes than the top one. **Expected:** the rows **don't** jump around while you're still typing. Click outside the answer list and they re-sort from most to fewest votes, on the board too.
- [ ] 8.6 In a votes box, select all and press **Delete** so it's empty. **Expected:** it stays empty while you type. Click away and it shows **0**. Letters can't be typed into vote boxes.
- [ ] 8.7 Delete all the text from one answer. **Expected:** that slot on the board turns into a dim blank slot with no number and can't be clicked. **Space**, **A** and that slot's number key skip it.
- [ ] 8.8 Rename Team 1. **Expected:** the team panel updates. Clear the name completely. **Expected:** the panel shows **Team 1** as a fallback.
- [ ] 8.9 Type a new **Total pts** for Team 2, for example 150. **Expected:** Team 2's total on the board shows 150. Revealing another answer for Team 2 adds on top of 150.
- [ ] 8.10 Click **Reset team scores** and click **Cancel**. **Expected:** nothing changes. Click it again and click **OK**. **Expected:** both totals go to 0. Answers that were revealed **stay revealed**, but no longer count towards either team.
- [ ] 8.11 Click **Restore this round**. **Expected:** this round's question and answers go back to the originals. Other rounds aren't touched.
- [ ] 8.12 Click **Restore all defaults** and click **Cancel**. **Expected:** nothing changes. Click it again and click **OK**. **Expected:** every round goes back to the original questions and answers, and all reveals and strikes are cleared.
- [ ] 8.13 Close the panel with the **✕** button, open it with **E**, close it with **E**, open it again and close it with **Esc**. **Expected:** all three ways close it.
- [ ] 8.14 Refresh the page. **Expected:** all edits made in this section are still there.

---

## 9. Projector check

Do this with the actual projector or TV if you can.

- [ ] 9.1 Connect the projector, move the game onto it (or mirror), and press **F**. **Expected:** the full board is visible with no edges cut off.
- [ ] 9.2 From the back of the room, check that the question, revealed answers, vote numbers and team totals are easy to read.
- [ ] 9.3 Check that coral text on the violet background has enough contrast on the projector. Projectors often wash out colours.
- [ ] 9.4 **Expected:** sound comes out of the speakers you plan to use.

---

## 10. Phone host page: connecting

- [ ] 10.1 Put the phone on the same Wi-Fi or hotspot as the laptop, and open the **Network** address with `?view=host` on the end, for example `http://192.168.1.23:5173/?view=host`.
- [ ] 10.2 **Expected:** a coral **Host view** banner at the top with a green **Connected** badge, the **Play** / **Edit votes & teams** tabs, the round number and question, both teams, all six answers **with their text and votes visible**, and the action buttons.
- [ ] 10.3 **Expected:** the phone shows exactly the same round, scores, answering team, revealed answers and strikes as the laptop.
- [ ] 10.4 Open `http://localhost:5173/?view=host` in a second Chrome tab on the laptop. **Expected:** it also says **Connected**.

---

## 11. Phone host page: controlling the game

Watch the projector screen while you tap on the phone.

- [ ] 11.1 Tap the non-answering team. **Expected:** it becomes **Answering** on the phone and on the projector.
- [ ] 11.2 Tap a hidden answer. **Expected:** it flips over with a chime **on the projector**, the right team gets the points on both screens, and the phone shows **Shown · Team name** under it.
- [ ] 11.3 Tap the same answer again. **Expected:** it hides on both screens and the points are removed.
- [ ] 11.4 Tap **Strike**. **Expected:** the red ✕ flash and buzzer play on the projector, and the button shows the new count, for example **Strike (1/3)**.
- [ ] 11.5 Tap **Switch team**, **Reveal all**, **Hide all**, **Reset round** and the sound button one at a time. **Expected:** each one does the same thing on the projector as its laptop shortcut.
- [ ] 11.6 Use the phone's arrows to change rounds. **Expected:** the projector changes round too. The left arrow is disabled on Round 1 and the right arrow on Round 10.
- [ ] 11.7 Now use the **laptop** keyboard (reveal, strike, change round). **Expected:** the phone updates within a second each time.
- [ ] 11.8 Tap several buttons quickly on the phone while also pressing keys on the laptop. **Expected:** both screens end up showing the same state.

---

## 12. Phone host page: editing and connection

- [ ] 12.1 Tap **Edit votes & teams**. **Expected:** the edit form shows the question, answers, votes and teams. The phone doesn't zoom in when you tap a box.
- [ ] 12.2 Scroll down the form. **Expected:** the coral **Host view** banner stays fixed at the top and **in front of** the form fields. Fields never show through it.
- [ ] 12.3 Change a vote count and a team name on the phone. **Expected:** the projector updates straight away.
- [ ] 12.4 Tap **Reset team scores** and **Restore all defaults**. **Expected:** the phone asks you to confirm each one, and **Cancel** changes nothing.
- [ ] 12.5 Tap **Play** to go back. **Expected:** the play controls return with the updated names and votes.
- [ ] 12.6 Lock the phone for 30 seconds, then unlock it. **Expected:** the badge may briefly say **Reconnecting…**, then goes back to **Connected** and shows the current state.
- [ ] 12.7 While the phone is locked, reveal an answer on the laptop. Unlock the phone. **Expected:** the phone catches up and shows that answer revealed.
- [ ] 12.8 In the laptop terminal, press **Ctrl + C** to stop the game. **Expected:** the phone badge turns red and says **Reconnecting…**. The laptop page stays on screen.
- [ ] 12.9 Run `npm run host` again and wait a few seconds. **Expected:** both pages reconnect on their own (they may reload by themselves), and scores, reveals and edits are exactly as they were before the restart.

---

## 13. Edge cases

- [ ] 13.1 Rapidly press **1–6**, **Space**, **H** and **A** in random order for about 10 seconds. **Expected:** no freezing, no half-flipped cards stuck mid-way, and the scores always match the answers that are showing.
- [ ] 13.2 Press **X** ten times quickly. **Expected:** the flash and buzzer keep up, the board stays at 3 strikes, and nothing freezes.
- [ ] 13.3 Type a very long question and a very long answer in Host Edit. **Expected:** the question wraps inside the banner, and the answer is cut off with **…** on the board instead of overflowing.
- [ ] 13.4 Type a long team name. **Expected:** it's cut off with **…** and the panel stays the same size.
- [ ] 13.5 Enter a very large vote count, for example 99999. **Expected:** it fits in its box, or is clearly readable, and the totals add up correctly.
- [ ] 13.6 Open the game in a second laptop tab at the plain Local address. **Expected:** both tabs stay in sync and neither one resets the other.
- [ ] 13.7 Run `npm run dev` instead of `npm run host` and open the host page on the laptop. **Expected:** the laptop works, and the phone **cannot** connect because this mode is laptop-only. Switch back to `npm run host` afterwards.

---

## 14. Clean up

- [ ] 14.1 Press **E**, click **Restore all defaults** (or re-enter the real vote counts), then **Reset team scores**, and set the team names.
- [ ] 14.2 Make sure **Team 1** (or whichever team starts) is the answering team, and press **R** on any round you tested.
- [ ] 14.3 Go back to **Round 1** and press **E** to close Host Edit.
- [ ] 14.4 Check the DevTools console one last time for red errors, then close DevTools.

---

## Issues found

| Step | What happened | Device / browser | Fixed? |
| --- | --- | --- | --- |
|  |  |  |  |
|  |  |  |  |
|  |  |  |  |
