import { RotateCcw, X } from 'lucide-react'

export default function HostEditor({
  round,
  roundIndex,
  totalRounds,
  onChangeQuestion,
  onChangeAnswer,
  onRestoreRound,
  onRestoreAll,
  onClose,
}) {
  const total = round.answers.reduce((sum, a) => sum + (Number(a.votes) || 0), 0)

  return (
    <aside className="editor" aria-label="Host editor">
      <header className="editor__head">
        <div>
          <p className="editor__kicker">Host Edit Mode</p>
          <h2>
            Round {roundIndex + 1} <span>of {totalRounds}</span>
          </h2>
        </div>
        <button type="button" className="editor__close" onClick={onClose} title="Close (E)">
          <X size={20} />
        </button>
      </header>

      <label className="editor__field">
        <span>Question</span>
        <textarea
          rows={2}
          value={round.question}
          onChange={(e) => onChangeQuestion(e.target.value)}
        />
      </label>

      <div className="editor__answers">
        <div className="editor__row editor__row--head">
          <span>#</span>
          <span>Answer</span>
          <span>Votes</span>
        </div>
        {round.answers.map((a, i) => (
          <div className="editor__row" key={a.id}>
            <span className="editor__num">{i + 1}</span>
            <input
              type="text"
              value={a.text}
              placeholder="(blank slot)"
              onChange={(e) => onChangeAnswer(a.id, { text: e.target.value })}
            />
            <input
              type="number"
              min="0"
              inputMode="numeric"
              value={a.votes}
              onChange={(e) =>
                onChangeAnswer(a.id, { votes: Math.max(0, parseInt(e.target.value, 10) || 0) })
              }
            />
          </div>
        ))}
        <div className="editor__total">
          Total votes <strong>{total}</strong>
        </div>
      </div>

      <p className="editor__note">Changes save automatically to this browser.</p>

      <div className="editor__actions">
        <button type="button" className="editor__btn" onClick={onRestoreRound}>
          <RotateCcw size={16} /> Restore this round
        </button>
        <button type="button" className="editor__btn editor__btn--danger" onClick={onRestoreAll}>
          <RotateCcw size={16} /> Restore all defaults
        </button>
      </div>
    </aside>
  )
}
