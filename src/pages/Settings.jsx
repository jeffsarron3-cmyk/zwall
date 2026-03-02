import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useWallet } from '../context/WalletContext.jsx'
import { loadWallet } from '../services/storage.js'
import Modal from '../components/Modal.jsx'
import { Eye, EyeOff, Shield, AlertCircle, Check, Lock, Download } from '../components/Icons.jsx'

function Tab({ label, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`settings-tab ${active ? 'active' : ''}`}
    >
      {label}
    </button>
  )
}

function Row({ label, desc, children }) {
  return (
    <div className="settings-row">
      <div className="settings-row-left">
        <div className="settings-row-label">{label}</div>
        {desc && <div className="settings-row-desc">{desc}</div>}
      </div>
      <div className="settings-row-right">{children}</div>
    </div>
  )
}

// ── Security Tab ──────────────────────────────────────────────────────────────
function SecurityTab() {
  const { wallet, changePassword, showToast } = useWallet()

  const [showSeedModal, setShowSeedModal] = useState(false)
  const [showPwModal, setShowPwModal] = useState(false)

  // Seed reveal
  const [seedPw, setSeedPw] = useState('')
  const [seedError, setSeedError] = useState('')
  const [seedRevealed, setSeedRevealed] = useState(false)
  const [seedLoading, setSeedLoading] = useState(false)

  // Change password
  const [currentPw, setCurrentPw] = useState('')
  const [newPw, setNewPw] = useState('')
  const [confirmPw, setConfirmPw] = useState('')
  const [pwError, setPwError] = useState('')
  const [pwSuccess, setPwSuccess] = useState(false)
  const [pwLoading, setPwLoading] = useState(false)
  const [showPws, setShowPws] = useState(false)

  const handleRevealSeed = async () => {
    setSeedLoading(true)
    setSeedError('')
    try {
      await loadWallet(seedPw) // verify password
      setSeedRevealed(true)
    } catch (err) {
      setSeedError(err.message === 'Wrong password' ? 'Wrong password' : err.message)
    } finally {
      setSeedLoading(false)
    }
  }

  const handleChangePw = async () => {
    if (newPw.length < 8) { setPwError('New password must be at least 8 characters'); return }
    if (newPw !== confirmPw) { setPwError('Passwords do not match'); return }
    setPwLoading(true)
    setPwError('')
    try {
      await changePassword(currentPw, newPw)
      setPwSuccess(true)
      showToast('Password changed!')
      setTimeout(() => { setShowPwModal(false); setPwSuccess(false); setCurrentPw(''); setNewPw(''); setConfirmPw('') }, 1500)
    } catch (err) {
      setPwError(err.message === 'Wrong password' ? 'Current password is incorrect' : err.message)
    } finally {
      setPwLoading(false)
    }
  }

  const words = wallet?.mnemonic?.split(' ') || []

  return (
    <div>
      <Row
        label="View Seed Phrase"
        desc="Reveal your 24-word recovery phrase. Keep it private."
      >
        <button className="btn btn-secondary" onClick={() => { setShowSeedModal(true); setSeedRevealed(false); setSeedPw(''); setSeedError('') }}>
          <Eye size={15} /> View
        </button>
      </Row>

      <Row
        label="Change Password"
        desc="Update the password used to encrypt your wallet."
      >
        <button className="btn btn-secondary" onClick={() => { setShowPwModal(true); setPwError(''); setPwSuccess(false) }}>
          <Lock size={15} /> Change
        </button>
      </Row>

      {/* Seed phrase modal */}
      {showSeedModal && (
        <Modal
          title="Secret Recovery Phrase"
          onClose={() => setShowSeedModal(false)}
          footer={!seedRevealed ? (
            <button className="btn btn-accent" onClick={handleRevealSeed} disabled={!seedPw || seedLoading}>
              {seedLoading ? 'Verifying…' : 'Reveal Phrase'}
            </button>
          ) : undefined}
        >
          {!seedRevealed ? (
            <div>
              <div style={{
                padding: '12px 14px', marginBottom: 16,
                background: 'var(--error-dim)', border: '1px solid rgba(232,64,64,0.2)',
                borderRadius: 'var(--radius-sm)', fontSize: 13, color: 'var(--error)',
                display: 'flex', gap: 8,
              }}>
                <AlertCircle size={16} style={{ flexShrink: 0, marginTop: 1 }} />
                Never share your recovery phrase. Anyone with access can steal your funds.
              </div>
              <div className="input-group" style={{ marginBottom: 0 }}>
                <label className="input-label">Enter your password to continue</label>
                <div className={`input-wrap ${seedError ? 'error' : ''}`}>
                  <input
                    type="password"
                    placeholder="Password"
                    value={seedPw}
                    onChange={e => { setSeedPw(e.target.value); setSeedError('') }}
                    onKeyDown={e => e.key === 'Enter' && handleRevealSeed()}
                    autoFocus
                  />
                </div>
                {seedError && <div className="input-error">⚠ {seedError}</div>}
              </div>
            </div>
          ) : (
            <div>
              <div style={{
                padding: '10px 14px', marginBottom: 16,
                background: 'rgba(61,214,140,0.08)', border: '1px solid rgba(61,214,140,0.2)',
                borderRadius: 'var(--radius-sm)', fontSize: 13, color: 'var(--success)',
              }}>
                Write these down and store them offline.
              </div>
              <div className="seed-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
                {words.map((word, i) => (
                  <div key={i} className="seed-cell filled" style={{ cursor: 'default' }}>
                    <span className="seed-num">{i + 1}</span>
                    <span className="seed-word-display">{word}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </Modal>
      )}

      {/* Change password modal */}
      {showPwModal && (
        <Modal
          title="Change Password"
          onClose={() => setShowPwModal(false)}
          footer={!pwSuccess ? (
            <>
              <button className="btn btn-accent" onClick={handleChangePw} disabled={!currentPw || !newPw || !confirmPw || pwLoading}>
                {pwLoading ? 'Updating…' : 'Update Password'}
              </button>
              <button className="btn btn-secondary" onClick={() => setShowPwModal(false)}>Cancel</button>
            </>
          ) : undefined}
        >
          {pwSuccess ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, padding: '20px 0' }}>
              <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'var(--success-dim)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--success)' }}>
                <Check size={24} />
              </div>
              <div style={{ fontWeight: 600 }}>Password updated!</div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div className="input-group" style={{ marginBottom: 0 }}>
                <label className="input-label">Current Password</label>
                <div className="input-wrap">
                  <input type={showPws ? 'text' : 'password'} value={currentPw} onChange={e => { setCurrentPw(e.target.value); setPwError('') }} autoFocus />
                  <div className="input-addon">
                    <button type="button" className="input-addon-btn" onClick={() => setShowPws(v => !v)}>
                      {showPws ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                </div>
              </div>
              <div className="input-group" style={{ marginBottom: 0 }}>
                <label className="input-label">New Password</label>
                <div className="input-wrap">
                  <input type={showPws ? 'text' : 'password'} value={newPw} onChange={e => { setNewPw(e.target.value); setPwError('') }} />
                </div>
              </div>
              <div className="input-group" style={{ marginBottom: 0 }}>
                <label className="input-label">Confirm New Password</label>
                <div className={`input-wrap ${pwError ? 'error' : ''}`}>
                  <input type={showPws ? 'text' : 'password'} value={confirmPw} onChange={e => { setConfirmPw(e.target.value); setPwError('') }} />
                </div>
                {pwError && <div className="input-error">⚠ {pwError}</div>}
              </div>
            </div>
          )}
        </Modal>
      )}
    </div>
  )
}

// ── Backup Tab ────────────────────────────────────────────────────────────────
function BackupTab() {
  const { showToast } = useWallet()

  const handleDownload = () => {
    const raw = localStorage.getItem('zodl_wallet')
    if (!raw) return
    const blob = new Blob([raw], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `zodl-backup-${Date.now()}.json`
    a.click()
    URL.revokeObjectURL(url)
    showToast('Backup downloaded')
  }

  return (
    <div>
      <div style={{
        padding: '14px 16px', marginBottom: 24,
        background: 'rgba(245,166,35,0.08)', border: '1px solid rgba(245,166,35,0.2)',
        borderRadius: 'var(--radius-md)', fontSize: 13, color: 'var(--warning)', lineHeight: 1.7,
      }}>
        ⚠️ Your wallet is encrypted and stored locally in your browser. Backups contain your encrypted key — keep them secure. The only true backup is your seed phrase.
      </div>

      <Row
        label="Download Encrypted Backup"
        desc="Save an encrypted copy of your wallet to your device."
      >
        <button className="btn btn-secondary" onClick={handleDownload}>
          <Download size={15} /> Download
        </button>
      </Row>
    </div>
  )
}

// ── Display Tab ───────────────────────────────────────────────────────────────
function DisplayTab() {
  const { balanceVisible, toggleBalance } = useWallet()

  return (
    <div>
      <Row
        label="Hide Balance"
        desc="Mask your balance on the dashboard."
      >
        <button
          onClick={toggleBalance}
          style={{
            width: 44, height: 24, borderRadius: 12, cursor: 'pointer',
            background: balanceVisible ? 'var(--bg-input)' : 'var(--accent)',
            position: 'relative', transition: 'background 0.2s', flexShrink: 0,
          }}
        >
          <div style={{
            position: 'absolute', top: 3,
            left: balanceVisible ? 3 : 23,
            width: 18, height: 18, borderRadius: '50%',
            background: 'white', transition: 'left 0.2s',
          }} />
        </button>
      </Row>
    </div>
  )
}

// ── About Tab ─────────────────────────────────────────────────────────────────
function AboutTab() {
  const { wallet, lastUpdated } = useWallet()
  const [apiStatus, setApiStatus] = useState(null)
  const [checking, setChecking] = useState(false)

  const checkApi = async () => {
    setChecking(true)
    try {
      const res = await fetch('/api/health')
      const json = await res.json()
      setApiStatus(json.ok ? 'online' : 'error')
    } catch {
      setApiStatus('offline')
    } finally {
      setChecking(false)
    }
  }

  return (
    <div>
      <Row label="App Version" desc="ZODL Web Wallet">
        <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>1.0.0</span>
      </Row>
      <Row label="Wallet Address" desc="Your transparent Zcash address">
        <span style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', maxWidth: 160, wordBreak: 'break-all', textAlign: 'right' }}>
          {wallet?.address ? `${wallet.address.slice(0, 10)}…${wallet.address.slice(-8)}` : '—'}
        </span>
      </Row>
      <Row label="Last Synced" desc="Most recent data refresh">
        <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>
          {lastUpdated
            ? new Date(lastUpdated).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
            : 'Never'}
        </span>
      </Row>
      <Row label="Backend API" desc="Blockchair proxy (localhost:3001)">
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {apiStatus && (
            <span style={{
              fontSize: 12, fontWeight: 600,
              color: apiStatus === 'online' ? 'var(--success)' : 'var(--error)',
            }}>
              {apiStatus === 'online' ? '● Online' : '● Offline'}
            </span>
          )}
          <button className="btn btn-secondary" onClick={checkApi} disabled={checking} style={{ fontSize: 12, padding: '6px 12px' }}>
            {checking ? '…' : 'Check'}
          </button>
        </div>
      </Row>
      <Row label="Network" desc="Zcash Mainnet (transparent)">
        <span className="badge badge-purple"><Shield size={10} /> Mainnet</span>
      </Row>
    </div>
  )
}

// ── Danger Tab ────────────────────────────────────────────────────────────────
function DangerTab() {
  const { lockWallet, deleteWallet, showToast } = useWallet()
  const navigate = useNavigate()
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [typedConfirm, setTypedConfirm] = useState('')

  const handleLock = () => {
    lockWallet()
    navigate('/unlock', { replace: true })
  }

  const handleDelete = () => {
    if (typedConfirm !== 'DELETE') return
    deleteWallet()
    navigate('/', { replace: true })
  }

  return (
    <div>
      <Row label="Lock Wallet" desc="Lock now and require password to unlock.">
        <button className="btn btn-secondary" onClick={handleLock}>
          <Lock size={15} /> Lock
        </button>
      </Row>

      <div style={{ marginTop: 32, padding: '20px', background: 'var(--error-dim)', border: '1px solid rgba(232,64,64,0.2)', borderRadius: 'var(--radius-lg)' }}>
        <div style={{ fontWeight: 600, fontSize: 15, color: 'var(--error)', marginBottom: 8 }}>Danger Zone</div>
        <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: 16 }}>
          Permanently remove this wallet from this device. You can only recover it with your seed phrase.
        </p>
        {!confirmDelete ? (
          <button
            className="btn"
            onClick={() => setConfirmDelete(true)}
            style={{ background: 'var(--error)', color: 'white', fontWeight: 600 }}
          >
            Remove Wallet
          </button>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <p style={{ fontSize: 13, color: 'var(--error)' }}>Type <strong>DELETE</strong> to confirm:</p>
            <div className="input-wrap">
              <input
                type="text"
                value={typedConfirm}
                onChange={e => setTypedConfirm(e.target.value)}
                placeholder="DELETE"
                autoFocus
              />
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                className="btn"
                onClick={handleDelete}
                disabled={typedConfirm !== 'DELETE'}
                style={{ background: 'var(--error)', color: 'white', fontWeight: 600, flex: 1 }}
              >
                Confirm Delete
              </button>
              <button className="btn btn-secondary" onClick={() => { setConfirmDelete(false); setTypedConfirm('') }}>
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ── Main Settings Page ─────────────────────────────────────────────────────────
const TABS = ['Security', 'Backup', 'Display', 'About', 'Danger']

export default function Settings() {
  const [activeTab, setActiveTab] = useState('Security')

  return (
    <div className="page page-enter">
      <div className="page-header">
        <span className="page-title">Settings</span>
      </div>

      <div className="settings-tabs">
        {TABS.map(t => (
          <Tab key={t} label={t} active={activeTab === t} onClick={() => setActiveTab(t)} />
        ))}
      </div>

      <div className="settings-body">
        {activeTab === 'Security' && <SecurityTab />}
        {activeTab === 'Backup'   && <BackupTab />}
        {activeTab === 'Display'  && <DisplayTab />}
        {activeTab === 'About'    && <AboutTab />}
        {activeTab === 'Danger'   && <DangerTab />}
      </div>
    </div>
  )
}
