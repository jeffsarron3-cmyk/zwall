import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useWallet } from '../context/WalletContext.jsx'
import { ChevronLeft, Info, Eye, EyeOff } from '../components/Icons.jsx'
import { validateMnemonic, validateWord } from '../services/crypto.js'

const TOTAL = 24

export default function Restore() {
  const navigate = useNavigate()
  const { createWallet } = useWallet()

  const [step, setStep] = useState('words') // words | password
  const [words, setWords] = useState(Array(TOTAL).fill(''))
  const [showInfo, setShowInfo] = useState(false)
  const [birthday, setBirthday] = useState('')

  // Password step
  const [password, setPassword] = useState('')
  const [confirmPw, setConfirmPw] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [pwError, setPwError] = useState('')
  const [restoring, setRestoring] = useState(false)

  const filled = words.filter(Boolean).length
  const allFilled = filled === TOTAL

  // Per-word validation
  const wordErrors = words.map((w, i) => {
    if (!w) return null
    return validateWord(w) ? null : 'invalid'
  })
  const validCount = words.filter((w, i) => w && !wordErrors[i]).length
  const mnemonicValid = allFilled && wordErrors.every(e => e === null) && validateMnemonic(words)

  const setWord = (i, val) => {
    const next = [...words]
    next[i] = val.trim().toLowerCase()
    setWords(next)
  }

  const handleKeyDown = (e, i) => {
    if (e.key === 'Enter' || e.key === 'Tab') {
      e.preventDefault()
      const next = document.getElementById(`seed-${i + 1}`)
      if (next) next.focus()
    }
  }

  const handlePaste = (e, startIdx) => {
    const text = e.clipboardData.getData('text')
    const pasted = text.trim().split(/\s+/).filter(w => !/^\d+$/.test(w))
    if (pasted.length > 1) {
      e.preventDefault()
      const next = [...words]
      pasted.forEach((w, j) => {
        if (startIdx + j < TOTAL) next[startIdx + j] = w.toLowerCase().trim()
      })
      setWords(next)
    }
  }

  const handleRestore = async () => {
    if (password.length < 8) { setPwError('Password must be at least 8 characters'); return }
    if (password !== confirmPw) { setPwError('Passwords do not match'); return }
    setRestoring(true)
    setPwError('')
    try {
      await createWallet(words, password, 'Restored Wallet')
      navigate('/dashboard', { replace: true })
    } catch (err) {
      setPwError(err.message)
      setRestoring(false)
    }
  }

  // ── Step: password ─────────────────────────────────────────────
  if (step === 'password') {
    return (
      <div className="onboarding">
        <div style={{ maxWidth: 480, margin: '0 auto', padding: '32px 24px 80px', width: '100%' }}>
          <div className="page-header" style={{ marginBottom: 32 }}>
            <button className="btn-icon" onClick={() => setStep('words')}><ChevronLeft /></button>
            <span className="page-title">Set Password</span>
            <div style={{ width: 36 }} />
          </div>

          <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 8 }}>Protect your wallet</h2>
          <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 28, lineHeight: 1.6 }}>
            This password encrypts your recovered wallet locally.
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
                  autoFocus
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

          <button
            className="btn btn-primary"
            onClick={handleRestore}
            disabled={restoring || !password || !confirmPw}
            style={{ marginTop: 28, fontSize: 16, padding: '16px 24px' }}
          >
            {restoring ? 'Restoring wallet…' : 'Restore Wallet'}
          </button>
        </div>
      </div>
    )
  }

  // ── Step: words ────────────────────────────────────────────────
  return (
    <div className="onboarding">
      <div style={{ maxWidth: 760, margin: '0 auto', padding: '32px 24px 80px', width: '100%' }}>
        <div className="page-header" style={{ marginBottom: 32 }}>
          <button className="btn-icon" onClick={() => navigate('/')}><ChevronLeft /></button>
          <span className="page-title">Restore</span>
          <button className="btn-icon" onClick={() => setShowInfo(v => !v)}><Info /></button>
        </div>

        <div style={{ marginBottom: 8 }}>
          <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 8 }}>Secret Recovery Phrase</h2>
          <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
            Type your 24-word phrase in order. Tab or Enter to advance. Invalid words show in red.
          </p>
        </div>

        {showInfo && (
          <div style={{
            background: 'var(--bg-card)', border: '1px solid var(--border)',
            borderRadius: 'var(--radius-lg)', padding: 20, marginTop: 20, marginBottom: 8,
            animation: 'slideUp 0.2s ease',
          }}>
            <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 14 }}>Need to know more?</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {[
                ['Secret Recovery Phrase', 'A unique set of 24 BIP39 words that gives full control of your funds from any device.'],
                ['Wallet Birthday Height', 'The block number at which your wallet was created. Providing it speeds up sync.'],
              ].map(([title, desc]) => (
                <div key={title} style={{ display: 'flex', gap: 10 }}>
                  <span style={{ color: 'var(--accent-light)', flexShrink: 0 }}>ℹ</span>
                  <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                    <strong style={{ color: 'var(--text-primary)' }}>{title}</strong> — {desc}
                  </p>
                </div>
              ))}
            </div>
            <button className="btn btn-primary" style={{ marginTop: 16 }} onClick={() => setShowInfo(false)}>Got it!</button>
          </div>
        )}

        <div className="seed-grid" style={{ marginTop: 24 }}>
          {Array.from({ length: TOTAL }, (_, i) => (
            <div key={i} className={`seed-cell ${words[i] ? (wordErrors[i] ? 'error-cell' : 'filled') : ''}`}>
              <span className="seed-num">{i + 1}</span>
              <input
                id={`seed-${i}`}
                className="seed-input"
                type="text"
                autoComplete="off"
                autoCorrect="off"
                spellCheck={false}
                value={words[i]}
                onChange={e => setWord(i, e.target.value)}
                onKeyDown={e => handleKeyDown(e, i)}
                onPaste={e => handlePaste(e, i)}
                placeholder="—"
                style={wordErrors[i] ? { color: 'var(--error)' } : undefined}
              />
            </div>
          ))}
        </div>

        <div style={{ marginTop: 20 }}>
          <div className="input-group" style={{ marginBottom: 0 }}>
            <label className="input-label">
              Wallet Birthday Height
              <span style={{ color: 'var(--text-muted)', marginLeft: 6, fontWeight: 400 }}>(optional)</span>
            </label>
            <div className="input-wrap">
              <input
                type="number"
                placeholder="e.g. 2500000"
                value={birthday}
                onChange={e => setBirthday(e.target.value)}
                style={{ padding: '13px 14px' }}
              />
            </div>
          </div>
        </div>

        <div style={{
          marginTop: 20, marginBottom: 20,
          padding: '12px 16px', background: 'var(--bg-card)',
          borderRadius: 'var(--radius-md)', border: '1px solid var(--border)',
        }}>
          <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
            <span style={{ color: validCount === TOTAL ? 'var(--success)' : 'var(--text-primary)', fontWeight: 600 }}>
              {validCount}
            </span>
            /{TOTAL} valid words
          </span>
        </div>

        {allFilled && !mnemonicValid && (
          <div style={{ color: 'var(--error)', fontSize: 13, marginBottom: 12 }}>
            ⚠ Invalid phrase — check for typos or incorrect word order.
          </div>
        )}

        <button
          className="btn btn-primary"
          disabled={!mnemonicValid}
          onClick={() => setStep('password')}
          style={{ fontSize: 16, padding: '16px 24px' }}
        >
          Next
        </button>
      </div>
    </div>
  )
}
