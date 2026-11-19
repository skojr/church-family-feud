import IcgcLogo from './IcgcLogo'

export default function AnswerCard({ number, answer, revealed, onToggle }) {
  const empty = !answer.text.trim()
  const classes = ['answer', revealed && !empty && 'is-revealed', empty && 'is-empty']
    .filter(Boolean)
    .join(' ')

  return (
    <button
      type="button"
      className={classes}
      onClick={onToggle}
      disabled={empty}
      aria-pressed={revealed}
      aria-label={revealed ? `${answer.text}, ${answer.votes} votes` : `Reveal answer ${number}`}
      style={{ '--delay': `${(number - 1) * 60}ms` }}
    >
      <span className="answer__inner">
        <span className="answer__face answer__front">
          <span className="answer__badge-panel">
            {!empty && <span className="badge">{number}</span>}
          </span>
          <span className="answer__panel answer__panel--hidden">
            {!empty && <IcgcLogo className="answer__watermark" />}
          </span>
        </span>

        <span className="answer__face answer__back" aria-hidden={!revealed}>
          <span className="answer__badge-panel">
            <span className="badge badge--lit">{number}</span>
          </span>
          <span className="answer__panel answer__panel--revealed">
            <span className="answer__text">{answer.text}</span>
            <span className="answer__votes">
              <span className="answer__votes-num">{answer.votes}</span>
              <span className="answer__votes-label">votes</span>
            </span>
          </span>
        </span>
      </span>
    </button>
  )
}
