export default function StrikeOverlay({ count }) {
  return (
    <div className="strike-overlay" aria-live="assertive">
      {Array.from({ length: Math.max(1, Math.min(count, 3)) }, (_, i) => (
        <span className="strike-x" key={i} style={{ '--i': i }}>
          ✕
        </span>
      ))}
    </div>
  )
}
