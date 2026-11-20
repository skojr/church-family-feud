// Full-screen "STEAL!" moment, shown on the projector when the host presses Steal.
// Plays once and fades by itself (like the strike overlay).
export default function StealOverlay({ teamName, points }) {
  return (
    <div className="steal-overlay" aria-live="assertive">
      <div className="steal-card">
        <span className="steal-card__shine" aria-hidden="true" />
        <span className="steal-card__word">Steal!</span>
        <span className="steal-card__team">{teamName}</span>
        {points > 0 && <span className="steal-card__points">+{points}</span>}
      </div>
    </div>
  )
}
