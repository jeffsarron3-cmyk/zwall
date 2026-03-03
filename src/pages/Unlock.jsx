import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useWallet } from '../context/WalletContext.jsx'

export default function Unlock() {
  const navigate = useNavigate()
  const { unlockWallet, isUnlocked } = useWallet()

  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (isUnlocked) { navigate('/dashboard', { replace: true }); return }
    // Auto-unlock with empty password (wallets saved without password)
    unlockWallet('').then(() => {
      navigate('/dashboard', { replace: true })
    }).catch(err => {
      setError(err.message)
      setLoading(false)
    })
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="onboarding" style={{ background: 'var(--bg-primary)' }}>
      <div className="onboarding-center" style={{ gap: 0, maxWidth: 400 }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <p style={{ fontSize: 14, color: 'var(--text-secondary)' }}>
            {loading ? 'Opening wallet…' : 'Unable to open wallet'}
          </p>
          {error && <div style={{ color: 'var(--error)', fontSize: 13, marginTop: 12 }}>⚠ {error}</div>}
        </div>
        {!loading && (
          <button
            className="btn btn-primary"
            onClick={() => navigate('/')}
            style={{ fontSize: 15, padding: '14px 24px' }}
          >
            Restore from seed phrase
          </button>
        )}
      </div>
    </div>
  )
}
