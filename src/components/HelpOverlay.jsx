const SHORTCUTS = [
  ['← / →', 'Previous / next round'],
  ['1 – 6', 'Reveal that answer'],
  ['Space', 'Reveal next hidden answer'],
  ['A', 'Reveal all answers (no points)'],
  ['H', 'Hide all answers'],
  ['R', 'Reset round (answers + strikes)'],
  ['X', 'Strike (wrong answer)'],
  ['S', 'Steal: give this round’s points to the other team (again to undo)'],
  ['T', 'Switch which team is answering'],
  ['Q', 'Show / hide the rules screen with the voting QR code'],
  ['F', 'Toggle fullscreen'],
  ['E', 'Toggle host edit mode'],
  ['M', 'Mute / unmute sound'],
  ['?', 'Show / hide this help'],
]

export default function HelpOverlay({ onClose }) {
  return (
    <div className="help" onClick={onClose}>
      <div className="help__card" onClick={(e) => e.stopPropagation()}>
        <h2>Keyboard Shortcuts</h2>
        <dl>
          {SHORTCUTS.map(([key, desc]) => (
            <div key={key}>
              <dt>
                <kbd>{key}</kbd>
              </dt>
              <dd>{desc}</dd>
            </div>
          ))}
        </dl>
        <button type="button" className="editor__btn" onClick={onClose}>
          Got it
        </button>
      </div>
    </div>
  )
}
