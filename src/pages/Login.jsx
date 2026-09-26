import { Link, useNavigate } from 'react-router-dom'
import { useState } from 'react'

export default function Login({ onLogin, t }) {
  const [form, setForm] = useState({ email: '', password: '', remember: true })
  const [error, setError] = useState('')
  const navigate = useNavigate()

  const submit = (event) => {
    event.preventDefault()
    const result = onLogin(form)
    if (result) navigate('/')
    else setError(t.formErrors.login)
  }

  return (
    <main className="auth-page">
      <div className="auth-panel">
        <span className="brand-mark large" aria-hidden="true">D</span>
        <p className="eyebrow">{t.brand}</p>
        <h1>{t.welcomeBack}</h1>
        <p className="muted">{t.authIntro}</p>
        <form onSubmit={submit} className="stack-form">
          <label>{t.email}<input type="email" required value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} /></label>
          <label>{t.password}<input type="password" required value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} /></label>
          <div className="form-row">
            <label className="check-label"><input type="checkbox" checked={form.remember} onChange={(event) => setForm({ ...form, remember: event.target.checked })} /> {t.remember}</label>
            <Link to="/forgot-password">{t.forgot}</Link>
          </div>
          {error && <p className="error-text">{error}</p>}
          <button className="primary-button full" type="submit">{t.signIn}</button>
        </form>
        <button className="text-button demo-button" type="button" onClick={() => {
          const result = onLogin({ email: 'demo@daymark.app', password: 'daymark', remember: true })
          if (result) navigate('/')
        }}>
          {t.demoLogin}
        </button>
        <p className="auth-footer">{t.newHere} <Link to="/signup">{t.signUp}</Link></p>
      </div>
    </main>
  )
}
