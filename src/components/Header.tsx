import { Link, NavLink } from 'react-router-dom'
import { useTheme } from '../hooks/useTheme'
import Logo from './Logo'

export default function Header() {
  const { theme, toggle } = useTheme()
  return (
    <header className="header">
      <Link to="/" className="logo" aria-label="World Countries — home"><Logo /></Link>
      <nav className="nav">
        <NavLink to="/" end>Liste</NavLink>
        <NavLink to="/globe">Globe 3D</NavLink>
      </nav>
      <button onClick={toggle} aria-label="Changer de thème">
        {theme === 'light' ? '🌙 Sombre' : '☀️ Clair'}
      </button>
    </header>
  )
}
