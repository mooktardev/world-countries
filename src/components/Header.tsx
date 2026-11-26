import { Link } from 'react-router-dom'
import { useTheme } from '../hooks/useTheme'

export default function Header() {
  const { theme, toggle } = useTheme()
  return (
    <header className="header">
      <Link to="/" className="logo">🌍 Pays du monde</Link>
      <button onClick={toggle} aria-label="Changer de thème">
        {theme === 'light' ? '🌙 Sombre' : '☀️ Clair'}
      </button>
    </header>
  )
}
