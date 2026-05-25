import styles from './TeamLogo.module.css'

interface TeamLogoProps {
  name?: string | null
  logoUrl?: string | null
  size?: number
}

export function TeamLogo({ name, logoUrl, size = 28 }: TeamLogoProps) {
  const label = name?.trim() || '?'
  const initials = label.slice(0, 2).toUpperCase()

  if (logoUrl) {
    return (
      <img
        src={logoUrl}
        alt={label}
        className={styles.logo}
        style={{ width: size, height: size }}
      />
    )
  }

  return (
    <span
      className={styles.fallback}
      style={{ width: size, height: size, fontSize: size * 0.38 }}
      aria-hidden
    >
      {initials}
    </span>
  )
}
