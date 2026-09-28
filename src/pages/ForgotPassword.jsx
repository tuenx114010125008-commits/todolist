import { Link, useNavigate } from 'react-router-dom'
import { useState } from 'react'

export default function ForgotPassword({ accounts = [], t }) {
  const [email, setEmail] = useState('')
  const [answer, setAnswer] = useState('')
  const [account, setAccount] = useState(null)
  const [error, setError] = useState('')
  const navigate = useNavigate()

  const lookup = (event) => {
    event.preventDefault()
    const normalized = email.trim().toLowerCase()
    let found = accounts.find((item) => item.email && item.email.trim().toLowerCase() === normalized)
    if (!found && normalized === 'demo.daymark@gmail.com') {
      found = {
        id: 'demo',
        username: 'Demo',
        email: 'demo.daymark@gmail.com',
        securityQuestion: t.demoSecurityQuestion || 'Tên thương hiệu của ứng dụng này là gì?',
        securityAnswer: 'daymark',
      }
    }
    if (!found) return setError(t.formErrors.notFound)
    setError('')
    setAccount(found)
  }

  const verify = (event) => {
    event.preventDefault()
    const valid = account && (
      (account.securityAnswer && account.securityAnswer.trim().toLowerCase() === answer.trim().toLowerCase()) ||
      (account.id === 'demo' && answer.trim().toLowerCase() === 'daymark')
    )
    if (valid) {
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
          <label>
            {t.email}
            <input
              required
              type="email"
              value={email}
              disabled={Boolean(account)}
              onChange={(event) => setEmail(event.target.value)}
            />
          </label>
          {account && (
            <>
              <p className="question">
                {account.id === 'demo' ? (t.demoSecurityQuestion || account.securityQuestion) : account.securityQuestion}
              </p>
              <label>
                {t.answer}
                <input
                  required
                  autoFocus
                  value={answer}
                  onChange={(event) => setAnswer(event.target.value)}
                />
              </label>
            </>
          )}
          {error && <p className="error-text">{error}</p>}
          <button className="primary-button full" type="submit">{account ? t.verify : t.continue}</button>
          {account && (
            <button
              type="button"
              className="text-button"
              style={{ marginTop: '4px', opacity: 0.8 }}
              onClick={() => {
                setAccount(null)
                setAnswer('')
                setError('')
              }}
            >
              {t.cancel}
            </button>
          )}
        </form>
        <p className="auth-footer"><Link to="/login">{t.signIn}</Link></p>
      </div>
    </main>
  )
}
