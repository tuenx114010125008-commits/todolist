import { Link, useNavigate } from 'react-router-dom'
import { useState } from 'react'

export default function ForgotPassword({ accounts, t }) {
  const [email, setEmail] = useState('')
  const [answer, setAnswer] = useState('')
  const [account, setAccount] = useState(null)
  const [error, setError] = useState('')
  const navigate = useNavigate()

  const lookup = (event) => {
    event.preventDefault()
    const found = accounts.find((item) => item.email.toLowerCase() === email.trim().toLowerCase())
    if (!found) return setError(t.formErrors.notFound)
    setError('')
    setAccount(found)
  }

  const verify = (event) => {
    event.preventDefault()
    if (account && account.securityAnswer.trim().toLowerCase() === answer.trim().toLowerCase()) {
      sessionStorage.setItem('resetUserId', account.id)
      navigate('/reset-password')
    } else {
      setError(t.formErrors.answer)
    }
  }

  return (
    <main className="auth-page">
      <div className="auth-panel">
        <span className="brand-mark large" aria-hidden="true">D</span>
        <p className="eyebrow">{t.brand}</p>
        <h1>{t.forgot}</h1>
        <form onSubmit={account ? verify : lookup} className="stack-form">
          <label>{t.email}<input required type="email" value={email} disabled={Boolean(account)} onChange={(event) => setEmail(event.target.value)} /></label>
          {account && (
            <>
              <p className="question">{account.securityQuestion}</p>
              <label>{t.answer}<input required value={answer} onChange={(event) => setAnswer(event.target.value)} /></label>
            </>
          )}
          {error && <p className="error-text">{error}</p>}
          <button className="primary-button full" type="submit">{account ? t.verify : t.continue}</button>
        </form>
        <p className="auth-footer"><Link to="/login">{t.signIn}</Link></p>
      </div>
    </main>
  )
}
