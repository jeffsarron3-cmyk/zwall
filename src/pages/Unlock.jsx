import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useWallet } from '../context/WalletContext.jsx'
import { Eye, EyeOff } from '../components/Icons.jsx'

export default function Unlock() {
  const navigate = useNavigate()
  const { unlockWallet, isUnlocked } = useWallet()

  const [password, setPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  if (isUnlocked) {
    navigate('/dashboard', { replace: true })
    return null
  }

  const handleUnlock = async (e) => {
    e.preventDefault()
    if (!password) { setError('Enter your password'); return }
    setLoading(true)
    setError('')
    try {
      await unlockWallet(password)
      navigate('/dashboard', { replace: true })
    } catch (err) {
      setError(err.message === 'Wrong password' ? 'Wrong password — try again' : err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="onboarding" style={{ background: 'var(--bg-primary)' }}>
      <div className="onboarding-center" style={{ gap: 0, maxWidth: 400 }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <div style={{
            width: 72,
            height: 72,
            background: 'var(--accent)',
            borderRadius: 20,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 36,
            fontWeight: 700,
            color: 'white',
            margin: '0 auto 16px',
            boxShadow: '0 8px 32px rgba(107, 69, 232, 0.35)',
          }}>
            Ƶ
          </div>
          <h1 style={{ fontSize: 26, fontWeight: 800, letterSpacing: -0.5, marginBottom: 8 }}>
            Welcome back
          </h1>
          <p style={{ fontSize: 14, color: 'var(--text-secondary)' }}>
            Enter your password to unlock your wallet
          </p>
        </div>

        <form onSubmit={handleUnlock} style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="input-group" style={{ marginBottom: 0 }}>
            <label className="input-label">Password</label>
            <div className={`input-wrap ${error ? 'error' : ''}`}>
              <input
                type={showPw ? 'text' : 'password'}
                placeholder="Enter password"
                value={password}
                onChange={e => { setPassword(e.target.value); setError('') }}
                autoFocus
                autoComplete="current-password"
              />
              <div className="input-addon">
                <button
                  type="button"
                  className="input-addon-btn"
                  onClick={() => setShowPw(v => !v)}
                >
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
            {error && <div className="input-error">⚠ {error}</div>}
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            disabled={loading || !password}
            style={{ fontSize: 16, padding: '15px 24px' }}
          >
            {loading ? 'Unlocking…' : 'Unlock Wallet'}
          </button>
        </form>

        <div style={{ marginTop: 28, textAlign: 'center' }}>
          <button
            onClick={() => navigate('/')}
            style={{
              fontSize: 13,
              color: 'var(--text-muted)',
              cursor: 'pointer',
              transition: 'color var(--transition)',
            }}
            onMouseEnter={e => e.currentTarget.style.color = 'var(--accent-light)'}
            onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}
          >
            Forgot password? Restore from seed phrase
          </button>
        </div>
      </div>
    </div>
  )
}
