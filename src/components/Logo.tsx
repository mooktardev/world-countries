// Logo : globe filaire (méridiens + parallèles vus légèrement du dessus)
// avec un repère de localisation ambre. Les traits suivent --accent, le
// détour du repère suit --surface pour rester propre en thème clair et sombre.
export function LogoMark({ size = 32 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      stroke="var(--accent)"
      strokeWidth="2.5"
      strokeLinecap="round"
      aria-hidden="true"
    >
      <circle cx="24" cy="24" r="18" />
      <ellipse cx="24" cy="24" rx="8" ry="18" />
      <path d="M6 24c10 4.5 26 4.5 36 0" />
      <path d="M8.5 15.5c9 4 22 4 31 0" />
      <path d="M8.5 32.5c9 4 22 4 31 0" />
      <circle cx="35" cy="13" r="5.5" fill="#f59e0b" stroke="var(--surface)" strokeWidth="2.5" />
      <circle cx="35" cy="13" r="1.8" fill="var(--surface)" stroke="none" />
    </svg>
  )
}

export default function Logo() {
  return (
    <span className="logo-lockup">
      <LogoMark />
      <span className="logo-text">
        <span className="logo-light">World</span> Countries
      </span>
    </span>
  )
}
