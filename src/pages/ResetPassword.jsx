import { Link, useNavigate } from 'react-router-dom'
import { useState } from 'react'

export default function ResetPassword({ onReset, t }) {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const navigate = useNavigate()
  const resetUserId = sessionStorage.getItem('resetUserId')

  const submit = (event) => {
    event.preventDefault()
    if (!resetUserId) return setError(t.formErrors.reset)
    if (password.length < 6) return setError(t.formErrors.password)
    if (password !== confirmPassword) return setError(t.formErrors.confirm)
    onReset(resetUserId, password)
    sessionStorage.removeItem('resetUserId')
    navigate('/login')
  }

  return (
    <main className="auth-page">
      <div className="auth-panel">
        <span className="brand-mark large" aria-hidden="true">D</span>
        <p className="eyebrow">{t.brand}</p>
        <h1>{t.resetPassword}</h1>
        <form onSubmit={submit} className="stack-form">
          <label>{t.password}<input required type="password" value={password} onChange={(event) => setPassword(event.target.value)} /></label>
          <label>{t.confirmPassword}<input required type="password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} /></label>
          {error && <p className="error-text">{error}</p>}
          <button className="primary-button full" type="submit">{t.savePassword}</button>
        </form>
        <p className="auth-footer"><Link to="/login">{t.signIn}</Link></p>
      </div>
    </main>
  )
}
