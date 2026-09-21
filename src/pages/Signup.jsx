import { Link, useNavigate } from 'react-router-dom'
import { useState } from 'react'

const isEmail = (value) => /\S+@\S+\.\S+/.test(value)

export default function Signup({ onSignup, t }) {
  const [form, setForm] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    securityQuestion: '',
    securityAnswer: '',
  })
  const [error, setError] = useState('')
  const navigate = useNavigate()

  const submit = (event) => {
    event.preventDefault()
    const hasEmpty = Object.values(form).some((value) => !value.trim())
    if (hasEmpty) return setError(t.formErrors.required)
    if (!isEmail(form.email)) return setError(t.formErrors.email)
    if (form.password.length < 6) return setError(t.formErrors.password)
    if (form.password !== form.confirmPassword) return setError(t.formErrors.confirm)
    if (onSignup(form)) navigate('/login')
    else setError(t.formErrors.duplicate)
  }

  return (
    <main className="auth-page">
      <div className="auth-panel auth-panel-wide">
        <span className="brand-mark large" aria-hidden="true">D</span>
        <p className="eyebrow">{t.brand}</p>
        <h1>{t.createYourSpace}</h1>
        <form onSubmit={submit} className="stack-form">
          <label>{t.username}<input required value={form.username} onChange={(event) => setForm({ ...form, username: event.target.value })} /></label>
          <label>{t.email}<input required type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} /></label>
          <label>{t.password}<input required type="password" value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} /></label>
          <label>{t.confirmPassword}<input required type="password" value={form.confirmPassword} onChange={(event) => setForm({ ...form, confirmPassword: event.target.value })} /></label>
          <label>{t.securityQuestion}<input required value={form.securityQuestion} onChange={(event) => setForm({ ...form, securityQuestion: event.target.value })} /></label>
          <label>{t.securityAnswer}<input required value={form.securityAnswer} onChange={(event) => setForm({ ...form, securityAnswer: event.target.value })} /></label>
          {error && <p className="error-text">{error}</p>}
          <button className="primary-button full" type="submit">{t.signUp}</button>
        </form>
        <p className="auth-footer">{t.haveAccount} <Link to="/login">{t.signIn}</Link></p>
      </div>
    </main>
  )
}
