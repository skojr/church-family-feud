import { useId } from 'react'

// ICGC mark, drawn in `currentColor` so it takes the text colour of wherever it sits.
// Same artwork as docs/brand/icgc-logo.svg.
export default function IcgcLogo({ className, title }) {
  const id = useId()
  const behindBars = `${id}-behind-bars`
  const aroundDisc = `${id}-around-disc`

  return (
    <svg
      className={className}
      viewBox="48 80 304 232"
      fill="currentColor"
      role={title ? 'img' : undefined}
      aria-label={title}
      aria-hidden={title ? undefined : true}
    >
      <defs>
        <mask id={behindBars} maskUnits="userSpaceOnUse" x="48" y="80" width="304" height="232">
          <rect x="48" y="80" width="304" height="232" fill="#fff" />
          <rect x="113" y="200" width="174" height="62" fill="#000" />
        </mask>
        <mask id={aroundDisc} maskUnits="userSpaceOnUse" x="48" y="80" width="304" height="232">
          <rect x="48" y="80" width="304" height="232" fill="#fff" />
          <circle cx="200" cy="198" r="58" fill="#000" />
        </mask>
      </defs>
      <path
        mask={`url(#${behindBars})`}
        fillRule="evenodd"
        d="M50 262a150 46 0 1 0 300 0a150 46 0 1 0-300 0zM72 262a128 31 0 1 0 256 0a128 31 0 1 0-256 0z"
      />
      <g mask={`url(#${aroundDisc})`}>
        <rect x="113" y="136" width="37" height="134" />
        <rect x="160" y="112" width="36" height="171" />
        <rect x="205" y="86" width="38" height="182" />
        <rect x="250" y="120" width="37" height="165" />
      </g>
      <circle cx="200" cy="198" r="62" fill="none" stroke="currentColor" strokeWidth="8" />
      <circle cx="200" cy="198" r="50" />
    </svg>
  )
}
