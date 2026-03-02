import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useWallet } from '../context/WalletContext.jsx'
import { ChevronLeft, Eye, EyeOff, Check } from '../components/Icons.jsx'

const VERIFY_COUNT = 3 // number of words to verify

function pickRandomIndices(n, total) {
  const indices = new Set()
  while (indices.size < n) indices.add(Math.floor(Math.random() * total))
  return [...indices].sort((a, b) => a - b)
}

export default function Welcome() {
  const navigate = useNavigate()
  const { newMnemonic, createWallet } = useWallet()

  const [step, setStep] = useState('landing') // landing | showSeed | confirmSeed | setPassword
  const [mnemonic, setMnemonic] = useState('')
  const words = mnemonic ? mnemonic.split(' ') : []

  // Confirm step
  const [verifyIndices, setVerifyIndices] = useState([])
  const [verifyInputs, setVerifyInputs] = useState({})
  const [verifyError, setVerifyError] = useState('')

  // Password step
  const [password, setPassword] = useState('')
  const [confirmPw, setConfirmPw] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [pwError, setPwError] = useState('')
  const [creating, setCreating] = useState(false)

  const handleCreateNew = () => {
    const m = newMnemonic()
    setMnemonic(m)
    setStep('showSeed')
  }

  const handleProceedToConfirm = () => {
    const idx = pickRandomIndices(VERIFY_COUNT, 24)
    setVerifyIndices(idx)
    setVerifyInputs(Object.fromEntries(idx.map(i => [i, ''])))
    setVerifyError('')
    setStep('confirmSeed')
  }

  const handleVerify = () => {
    const allCorrect = verifyIndices.every(i =>
      verifyInputs[i]?.trim().toLowerCase() === words[i]?.toLowerCase()
    )
    if (!allCorrect) {
      setVerifyError('One or more words are incorrect. Check your backup.')
      return
    }
    setStep('setPassword')
  }

  const handleCreate = async () => {
    if (password.length < 8) { setPwError('Password must be at least 8 characters'); return }
    if (password !== confirmPw) { setPwError('Passwords do not match'); return }
    setCreating(true)
    setPwError('')
    try {
      await createWallet(mnemonic, password, 'Zodl')
      navigate('/dashboard', { replace: true })
    } catch (err) {
      setPwError(err.message)
      setCreating(false)
    }
  }

  // ── Step: landing ──────────────────────────────────────────────
  if (step === 'landing') {
    return (
      <div className="onboarding" style={{ background: 'var(--bg-primary)' }}>
        <div className="onboarding-center" style={{ gap: 0 }}>
          <div style={{ marginBottom: 32, textAlign: 'center' }}>
            <div style={{
              width: 80, height: 80, background: 'var(--accent)', borderRadius: 24,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 40, fontWeight: 700, color: 'white',
              margin: '0 auto 20px',
              boxShadow: '0 8px 32px rgba(107, 69, 232, 0.35)',
            }}>Ƶ</div>
            <h1 style={{ fontSize: 36, fontWeight: 800, letterSpacing: -1, marginBottom: 10 }}>ZODL</h1>
            <p style={{ fontSize: 16, color: 'var(--text-secondary)', lineHeight: 1.6, maxWidth: 300, margin: '0 auto' }}>
              Zcash-powered web wallet built for financial sovereignty.
            </p>
          </div>

          <div style={{ display: 'flex', gap: 10, marginBottom: 48, flexWrap: 'wrap', justifyContent: 'center' }}>
            {['🔒 Private', '⚡ Fast', '🛡 Shielded'].map(f => (
              <span key={f} style={{
                padding: '6px 14px', background: 'var(--bg-card)',
                border: '1px solid var(--border)', borderRadius: 999,
                fontSize: 13, color: 'var(--text-secondary)',
              }}>{f}</span>
            ))}
          </div>

          <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 12 }}>
            <button className="btn btn-primary" onClick={handleCreateNew} style={{ fontSize: 16, padding: '16px 24px' }}>
              Create new wallet
            </button>
            <button className="btn btn-secondary" onClick={() => navigate('/restore')} style={{ fontSize: 16, padding: '16px 24px' }}>
              Restore existing wallet
            </button>
          </div>

          <p style={{ marginTop: 32, fontSize: 12, color: 'var(--text-muted)', textAlign: 'center', lineHeight: 1.6 }}>
            By creating a wallet, you agree to the Terms of Service
            <br />and acknowledge our Privacy Policy.
          </p>
        </div>
      </div>
    )
  }

  // ── Step: showSeed ─────────────────────────────────────────────
  if (step === 'showSeed') {
    return (
      <div className="onboarding">
        <div style={{ maxWidth: 760, margin: '0 auto', padding: '32px 24px 80px', width: '100%' }}>
          <div className="page-header" style={{ marginBottom: 32 }}>
            <button className="btn-icon" onClick={() => setStep('landing')}><ChevronLeft /></button>
            <span className="page-title">Secret Recovery Phrase</span>
            <div style={{ width: 36 }} />
          </div>

          <div style={{
            padding: '16px 20px', marginBottom: 24,
            background: 'rgba(245, 166, 35, 0.1)',
            border: '1px solid rgba(245, 166, 35, 0.3)',
            borderRadius: 'var(--radius-md)',
            display: 'flex', gap: 12,
          }}>
            <span style={{ fontSize: 18, flexShrink: 0 }}>⚠️</span>
            <div>
              <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 4, color: 'var(--warning)' }}>
                Write these down!
              </div>
              <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                These 24 words are the only way to recover your wallet. Never share them with anyone.
                Store them offline in a safe place.
              </p>
            </div>
          </div>

          <div className="seed-grid" style={{ marginBottom: 24 }}>
            {words.map((word, i) => (
              <div key={i} className="seed-cell filled">
                <span className="seed-num">{i + 1}</span>
                <span className="seed-word-display">{word}</span>
              </div>
            ))}
          </div>

          <button
            className="btn btn-primary"
            onClick={handleProceedToConfirm}
            style={{ fontSize: 16, padding: '16px 24px' }}
          >
            I've written them down →
          </button>
        </div>
      </div>
    )
  }

  // ── Step: confirmSeed ──────────────────────────────────────────
  if (step === 'confirmSeed') {
    return (
      <div className="onboarding">
        <div style={{ maxWidth: 560, margin: '0 auto', padding: '32px 24px 80px', width: '100%' }}>
          <div className="page-header" style={{ marginBottom: 32 }}>
            <button className="btn-icon" onClick={() => setStep('showSeed')}><ChevronLeft /></button>
            <span className="page-title">Verify Backup</span>
            <div style={{ width: 36 }} />
          </div>

          <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 8 }}>Confirm your phrase</h2>
          <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 28, lineHeight: 1.6 }}>
            Enter the words at the positions below to confirm you saved your phrase.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 28 }}>
            {verifyIndices.map(i => (
              <div key={i} className="input-group" style={{ marginBottom: 0 }}>
                <label className="input-label">Word #{i + 1}</label>
                <div className={`input-wrap ${verifyError && verifyInputs[i]?.trim().toLowerCase() !== words[i] ? 'error' : ''}`}>
                  <input
                    type="text"
                    placeholder={`Enter word #${i + 1}`}
                    value={verifyInputs[i] || ''}
                    onChange={e => {
                      setVerifyInputs(v => ({ ...v, [i]: e.target.value }))
                      setVerifyError('')
                    }}
                    autoComplete="off"
                    spellCheck={false}
                  />
                </div>
              </div>
            ))}
          </div>

          {verifyError && (
            <div style={{ color: 'var(--error)', fontSize: 13, marginBottom: 16 }}>⚠ {verifyError}</div>
          )}

          <button
            className="btn btn-primary"
            onClick={handleVerify}
            disabled={verifyIndices.some(i => !verifyInputs[i]?.trim())}
            style={{ fontSize: 16, padding: '16px 24px' }}
          >
            Confirm
          </button>
        </div>
      </div>
    )
  }

  // ── Step: setPassword ──────────────────────────────────────────
  return (
    <div className="onboarding">
      <div style={{ maxWidth: 480, margin: '0 auto', padding: '32px 24px 80px', width: '100%' }}>
        <div className="page-header" style={{ marginBottom: 32 }}>
          <button className="btn-icon" onClick={() => setStep('confirmSeed')}><ChevronLeft /></button>
          <span className="page-title">Set Password</span>
          <div style={{ width: 36 }} />
        </div>

        <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 8 }}>Protect your wallet</h2>
        <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 28, lineHeight: 1.6 }}>
          This password encrypts your wallet locally. You'll need it every time you open the app.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="input-group" style={{ marginBottom: 0 }}>
            <label className="input-label">Password</label>
            <div className="input-wrap">
              <input
                type={showPw ? 'text' : 'password'}
                placeholder="Min. 8 characters"
                value={password}
                onChange={e => { setPassword(e.target.value); setPwError('') }}
                autoComplete="new-password"
              />
              <div className="input-addon">
                <button type="button" className="input-addon-btn" onClick={() => setShowPw(v => !v)}>
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
          </div>

          <div className="input-group" style={{ marginBottom: 0 }}>
            <label className="input-label">Confirm Password</label>
            <div className={`input-wrap ${pwError ? 'error' : ''}`}>
              <input
                type={showPw ? 'text' : 'password'}
                placeholder="Repeat password"
                value={confirmPw}
                onChange={e => { setConfirmPw(e.target.value); setPwError('') }}
                autoComplete="new-password"
              />
            </div>
            {pwError && <div className="input-error">⚠ {pwError}</div>}
          </div>
        </div>

        {/* Password strength */}
        {password && (
          <div style={{ marginTop: 12 }}>
            <div style={{ display: 'flex', gap: 4, marginBottom: 4 }}>
              {[1, 2, 3, 4].map(n => (
                <div key={n} style={{
                  flex: 1, height: 3, borderRadius: 2,
                  background: password.length >= n * 3
                    ? (password.length >= 12 ? 'var(--success)' : 'var(--warning)')
                    : 'var(--bg-input)',
                  transition: 'background 0.2s',
                }} />
              ))}
            </div>
            <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
              {password.length < 8 ? 'Too short' : password.length < 12 ? 'Good' : 'Strong'}
            </span>
          </div>
        )}

        <button
          className="btn btn-primary"
          onClick={handleCreate}
          disabled={creating || !password || !confirmPw}
          style={{ marginTop: 28, fontSize: 16, padding: '16px 24px' }}
        >
          {creating ? 'Creating wallet…' : 'Create Wallet'}
        </button>
      </div>
    </div>
  )
}
