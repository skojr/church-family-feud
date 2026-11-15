function CrossMark({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 32" aria-hidden="true">
      <path d="M9.5 0h5v9h9.5v5h-9.5v18h-5V14H0V9h9.5z" />
    </svg>
  )
}

export default function Brand() {
  return (
    <div className="brand">
      <div className="brand__rays" aria-hidden="true" />
      <h1 className="brand__title">
        <span className="brand__igc">IGC</span>
        <span className="brand__edition">
          <span>Gathering</span>
          <span>Edition</span>
        </span>
      </h1>
      <div className="brand__ribbon">
        <CrossMark className="brand__cross" />
        <span>Family Feud</span>
        <CrossMark className="brand__cross" />
      </div>
    </div>
  )
}
