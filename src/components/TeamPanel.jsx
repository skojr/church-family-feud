export default function TeamPanel({ name, side, total, roundPoints, active, onSelect }) {
  return (
    <div className={`team-slot team-slot--${side} ${active ? 'is-active' : ''}`}>
      <button
        type="button"
        className="team"
        onClick={onSelect}
        aria-pressed={active}
        title={`Set ${name} as the answering team (T to switch)`}
      >
        <span className="team__flag">Answering</span>
        <span className="team__name">{name}</span>
        <span className="team__total" key={total}>
          {total}
        </span>
        <span className="team__label">Total points</span>
      </button>

      <div className="team-round" aria-label={`${name} this round: ${roundPoints} points`}>
        <span className="team-round__label">This round</span>
        <span className="team-round__value" key={roundPoints}>
          {roundPoints}
        </span>
      </div>
    </div>
  )
}
