import { useNavigate } from 'react-router-dom'

export default function Settings({ user, theme, language, onThemeChange, onLanguageChange, onLogout, t }) {
  const navigate = useNavigate()

  const logout = () => {
    onLogout()
    navigate('/login')
  }

  return (
    <main className="page-shell narrow">
      <div className="simple-heading">
        <h1>{t.settingsTitle}</h1>
      </div>
      <section className="settings-list">
        <div className="setting-row">
          <div>
            <strong>{t.appearance}</strong>
            <span>{t.appearanceHint}</span>
          </div>
          <div className="choice-group">
            {['light', 'dark'].map((value) => (
              <button key={value} type="button" className={theme === value ? 'choice selected' : 'choice'} onClick={() => onThemeChange(value)}>
                {t[value]}
              </button>
            ))}
          </div>
        </div>
        <div className="setting-row">
          <div>
            <strong>{t.language}</strong>
            <span>{t.languageHint}</span>
          </div>
          <div className="choice-group">
            {['vi', 'en'].map((value) => (
              <button key={value} type="button" className={language === value ? 'choice selected' : 'choice'} onClick={() => onLanguageChange(value)}>
                {value.toUpperCase()}
              </button>
            ))}
          </div>
        </div>
        <div className="setting-row account-row">
          <div>
            <strong>{t.account}</strong>
            <span>{user.username} · {user.email}</span>
          </div>
          <button className="text-button" type="button" onClick={logout}>{t.logout}</button>
        </div>
      </section>
    </main>
  )
}
