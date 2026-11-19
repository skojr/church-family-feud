import IcgcLogo from './IcgcLogo'

export default function Brand() {
  return (
    <div className="brand">
      <div className="brand__rays" aria-hidden="true" />
      <h1 className="brand__title">
        <span className="brand__the">The</span>
        <span className="brand__name">Gathering</span>
        <span className="brand__year">’26</span>
      </h1>
      <div className="brand__ribbon">
        <IcgcLogo className="brand__logo" />
        <span>Family Feud</span>
      </div>
    </div>
  )
}
