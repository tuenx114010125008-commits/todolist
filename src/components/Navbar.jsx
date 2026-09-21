import { NavLink, useNavigate } from 'react-router-dom'

export default function Navbar({ user, t, onLogout }) {
  const navigate = useNavigate()

  const handleLogout = () => {
    onLogout()
    navigate('/login')
  }

  return (
    <header className="topbar">
      <NavLink to="/" className="brand" aria-label={t.brand}>
        <span className="brand-mark" aria-hidden="true">D</span>
        {t.brand}
      </NavLink>
      <nav className="nav-links" aria-label="Main navigation">
        <NavLink to="/">{t.nav.today}</NavLink>
        <NavLink to="/statistics">{t.nav.statistics}</NavLink>
        <NavLink to="/settings">{t.nav.settings}</NavLink>
      </nav>
      <div className="profile-actions">
        <span className="avatar" aria-hidden="true">{user.username?.[0]?.toUpperCase()}</span>
        <button className="icon-button" type="button" aria-label={t.logout} title={t.logout} onClick={handleLogout}>
          <span aria-hidden="true">out</span>
        </button>
      </div>
    </header>
  )
}
