import { useState } from 'react'
import { RotateCcw, X } from 'lucide-react'
import { sortByVotes } from '../data/rounds'

// Keeps its own text so the field can be cleared while typing; an empty field counts as 0.
function NumberInput({ value, onChange, className = 'editor__votes', label }) {
  const [draft, setDraft] = useState(String(value))
  const [lastValue, setLastValue] = useState(value)

  if (value !== lastValue) {
    setLastValue(value)
    if (Number(draft || 0) !== value) setDraft(String(value))
  }

  return (
    <input
      type="text"
      inputMode="numeric"
      pattern="[0-9]*"
      className={className}
      aria-label={label}
      value={draft}
      placeholder="0"
      onChange={(e) => {
        const digits = e.target.value.replace(/\D/g, '').replace(/^0+(?=\d)/, '')
        setDraft(digits)
        onChange(Number(digits || 0))
      }}
      onBlur={() => {
        if (!draft) setDraft('0')
      }}
    />
  )
}

export default function HostEditor({
  round,
  roundIndex,
  totalRounds,
  onChangeQuestion,
  onChangeAnswer,
  teams,
  teamTotals,
  onChangeTeamName,
  onChangeTeamTotal,
  onResetScores,
  onRestoreRound,
  onRestoreAll,
  onClose,
}) {
  const total = round.answers.reduce((sum, a) => sum + (Number(a.votes) || 0), 0)

  // Rows would jump mid-keystroke if re-sorted live, so the order is frozen while focus is in the list.
  const [frozenOrder, setFrozenOrder] = useState(null)
  const answers = frozenOrder
    ? frozenOrder.map((id) => round.answers.find((a) => a.id === id)).filter(Boolean)
    : sortByVotes(round.answers)

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

      <div
        className="editor__answers"
        onFocus={() => setFrozenOrder((prev) => prev ?? answers.map((a) => a.id))}
        onBlur={(e) => {
          if (!e.currentTarget.contains(e.relatedTarget)) setFrozenOrder(null)
        }}
      >
        <div className="editor__row editor__row--head">
          <span>#</span>
          <span>Answer</span>
          <span>Votes</span>
        </div>
        {answers.map((a, i) => (
          <div className="editor__row" key={a.id}>
            <span className="editor__num">{i + 1}</span>
            <input
              type="text"
              value={a.text}
              placeholder="(blank slot)"
              onChange={(e) => onChangeAnswer(a.id, { text: e.target.value })}
            />
            <NumberInput value={a.votes} onChange={(votes) => onChangeAnswer(a.id, { votes })} />
          </div>
        ))}
        <div className="editor__total">
          Total votes <strong>{total}</strong>
        </div>
      </div>

      <div className="editor__answers">
        <div className="editor__row editor__row--head">
          <span />
          <span>Team</span>
          <span>Total pts</span>
        </div>
        {teams.map((team, i) => (
          <div className="editor__row" key={i}>
            <span className="editor__num">{i + 1}</span>
            <input
              type="text"
              value={team.name}
              placeholder={`Team ${i + 1}`}
              onChange={(e) => onChangeTeamName(i, e.target.value)}
            />
            <NumberInput
              value={teamTotals[i]}
              label={`${team.name} total points`}
              onChange={(total) => onChangeTeamTotal(i, total)}
            />
          </div>
        ))}
        <button type="button" className="editor__btn editor__btn--small" onClick={onResetScores}>
          <RotateCcw size={14} /> Reset team scores
        </button>
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
