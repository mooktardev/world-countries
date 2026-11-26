import { useLocation } from 'react-router-dom'

export default function Footer() {
  const { pathname } = useLocation()
  // La page du globe occupe toute la hauteur de l'écran : pas de pied de page.
  if (pathname === '/globe') return null
  return (
    <footer className="footer">© {new Date().getFullYear()} Mooktar. Tous droits réservés.</footer>
  )
}
