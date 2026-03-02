import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useWallet } from '../context/WalletContext.jsx'
import Modal from '../components/Modal.jsx'
import { Eye, EyeOff, User, QrCode, Shield, Check, AlertCircle } from '../components/Icons.jsx'
import { fetchUTXOs, signTransaction, broadcastTx } from '../services/api.js'

const FEE = 0.0001

function isValidAddress(addr) {
  return /^t1[a-zA-Z0-9]{33}$/.test(addr) || addr.startsWith('u1')
}

export default function Send() {
  const navigate = useNavigate()
  const { wallet, balance, zecPrice, balanceVisible, toggleBalance, showToast, refreshData } = useWallet()

  const [address, setAddress] = useState('')
  const [amount, setAmount] = useState('')
  const [message, setMessage] = useState('')
  const [touched, setTouched] = useState({ address: false, amount: false })
  const [reviewOpen, setReviewOpen] = useState(false)

  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)
  const [sendError, setSendError] = useState('')

  const addressError = touched.address && address && !isValidAddress(address)
    ? 'Invalid Zcash address'
    : null

  const amountNum = parseFloat(amount) || 0
  const maxSend = Math.max(0, balance - FEE)
  const amountError = touched.amount && amount && amountNum > maxSend
    ? `Insufficient funds (max ${maxSend.toFixed(8)} ZEC after fee)`
    : null

  const isValid = address && isValidAddress(address) && amountNum > 0 && amountNum <= maxSend

  const handleReview = () => {
    setTouched({ address: true, amount: true })
    if (isValid) { setSendError(''); setReviewOpen(true) }
  }

  const handleSend = async () => {
    if (!wallet?.address || !wallet?.privateKeyWIF) {
      setSendError('Wallet not unlocked')
      return
    }
    setSending(true)
    setSendError('')
    try {
      // 1. Fetch UTXOs
      const utxos = await fetchUTXOs(wallet.address)
      if (!utxos || utxos.length === 0) {
        throw new Error('No spendable UTXOs found. Balance may be unconfirmed.')
      }

      // 2. Build + sign via backend
      const { hex } = await signTransaction({
        utxos,
        to: address,
        amount: amountNum,
        fee: FEE,
        changeAddress: wallet.address,
        privateKeyWIF: wallet.privateKeyWIF,
      })

      // 3. Broadcast
      const { txid } = await broadcastTx(hex)

      // 4. Success
      setSent(true)
      setTimeout(async () => {
        setReviewOpen(false)
        setSent(false)
        setAddress('')
        setAmount('')
        setMessage('')
        setTouched({ address: false, amount: false })
        showToast(`Sent! TX: ${txid?.slice(0, 12)}…`, 'success')
        await refreshData()
        navigate('/dashboard')
      }, 1800)
    } catch (err) {
      setSendError(err.message)
      setSending(false)
    }
  }

  const usdAmount = (amountNum * zecPrice).toFixed(2)

  return (
    <div className="page page-enter">
      <div className="page-header">
        <span className="page-title">Send</span>
        <button className="btn-icon" onClick={toggleBalance}>
          {balanceVisible ? <Eye size={18} /> : <EyeOff size={18} />}
        </button>
      </div>

      {/* Balance display */}
      <div style={{ textAlign: 'center', marginBottom: 36 }}>
        {balanceVisible ? (
          <>
            <div className="balance-amount" style={{ justifyContent: 'center', fontSize: 48 }}>
              <span className="balance-symbol" style={{ fontSize: 32 }}>Ƶ</span>
              <span>{balance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 8 })}</span>
            </div>
            <div className="balance-usd">Available balance</div>
          </>
        ) : (
          <div style={{ fontSize: 36, fontWeight: 700, letterSpacing: 8, color: 'var(--text-secondary)', textAlign: 'center' }}>
            Ƶ — — — — —
          </div>
        )}
      </div>

      {/* Send to */}
      <div className="input-group">
        <label className="input-label">Send to</label>
        <div className={`input-wrap ${addressError ? 'error' : ''}`}>
          <input
            type="text"
            placeholder="Zcash Address (t1…)"
            value={address}
            onChange={e => setAddress(e.target.value.trim())}
            onBlur={() => setTouched(t => ({ ...t, address: true }))}
          />
          <div className="input-addon">
            <button
              className="input-addon-btn"
              title="Paste"
              onClick={async () => {
                try {
                  const text = await navigator.clipboard.readText()
                  setAddress(text.trim())
                  setTouched(t => ({ ...t, address: true }))
                } catch {}
              }}
            >
              <QrCode size={16} />
            </button>
          </div>
        </div>
        {addressError && <div className="input-error">⚠ {addressError}</div>}
      </div>

      {/* Amount */}
      <div className="input-group">
        <label className="input-label">Amount</label>
        <div className={`input-wrap ${amountError ? 'error' : ''}`}>
          <div style={{ padding: '0 0 0 14px', color: 'var(--text-muted)', fontSize: 16, fontWeight: 600, flexShrink: 0 }}>
            Ƶ
          </div>
          <input
            type="number"
            placeholder="0.00"
            value={amount}
            min={0}
            step={0.0001}
            onChange={e => setAmount(e.target.value)}
            onBlur={() => setTouched(t => ({ ...t, amount: true }))}
            style={{ paddingLeft: 8 }}
          />
          <div className="input-addon" style={{ gap: 8, paddingRight: 10 }}>
            {amount && (
              <span style={{ fontSize: 12, color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                ≈ ${usdAmount}
              </span>
            )}
            <button
              style={{
                fontSize: 11, fontWeight: 700, color: 'var(--accent-light)',
                background: 'var(--accent-dim)', padding: '4px 8px',
                borderRadius: 6, cursor: 'pointer', flexShrink: 0,
                transition: 'background var(--transition)',
              }}
              onClick={() => {
                setAmount(String(maxSend))
                setTouched(t => ({ ...t, amount: true }))
              }}
            >
              MAX
            </button>
          </div>
        </div>
        {amountError && <div className="input-error">⚠ {amountError}</div>}
      </div>

      {/* Message */}
      <div className="input-group">
        <label className="input-label">
          Message
          <span style={{ color: 'var(--text-muted)', fontWeight: 400, marginLeft: 6 }}>(optional)</span>
        </label>
        <div className="input-wrap">
          <textarea
            placeholder="Add a note..."
            value={message}
            maxLength={512}
            onChange={e => setMessage(e.target.value)}
            style={{ paddingTop: 12, paddingBottom: 8 }}
          />
        </div>
        <div style={{ fontSize: 11, color: 'var(--text-muted)', textAlign: 'right', marginTop: 4 }}>
          {message.length}/512
        </div>
      </div>

      <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 16 }}>
        Network fee: {FEE} ZEC
      </div>

      <button
        className="btn btn-primary"
        disabled={!isValid}
        onClick={handleReview}
        style={{ marginTop: 4, fontSize: 16, padding: '16px 24px' }}
      >
        Review
      </button>

      {/* Review Modal */}
      {reviewOpen && (
        <Modal
          title="Review Transaction"
          onClose={() => !sending && setReviewOpen(false)}
          footer={sent ? null : (
            <>
              <button className="btn btn-accent" onClick={handleSend} disabled={sending}>
                {sending ? 'Sending…' : 'Confirm & Send'}
              </button>
              <button className="btn btn-secondary" onClick={() => setReviewOpen(false)} disabled={sending}>
                Cancel
              </button>
            </>
          )}
        >
          {sent ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, padding: '20px 0' }}>
              <div style={{
                width: 64, height: 64, borderRadius: '50%',
                background: 'var(--success-dim)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: 'var(--success)',
              }}>
                <Check size={28} />
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 6 }}>Broadcast!</div>
                <div style={{ color: 'var(--text-secondary)', fontSize: 14 }}>
                  Your transaction has been submitted to the network
                </div>
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
              <div className="rate-row">
                <span className="rate-row-label">To</span>
                <span className="rate-row-value" style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}>
                  {address.slice(0, 12)}…{address.slice(-6)}
                </span>
              </div>
              <div className="rate-row">
                <span className="rate-row-label">Amount</span>
                <span className="rate-row-value">Ƶ {amountNum.toFixed(8)} ZEC</span>
              </div>
              <div className="rate-row">
                <span className="rate-row-label">USD value</span>
                <span className="rate-row-value">≈ ${usdAmount}</span>
              </div>
              <div className="rate-row">
                <span className="rate-row-label">Network fee</span>
                <span className="rate-row-value" style={{ color: 'var(--text-secondary)' }}>{FEE} ZEC</span>
              </div>
              {message && (
                <div className="rate-row">
                  <span className="rate-row-label">Note</span>
                  <span className="rate-row-value" style={{ fontSize: 13 }}>{message}</span>
                </div>
              )}

              {sendError && (
                <div style={{
                  marginTop: 12, padding: '12px 14px',
                  background: 'var(--error-dim)', border: '1px solid rgba(232,64,64,0.2)',
                  borderRadius: 'var(--radius-sm)', color: 'var(--error)', fontSize: 13,
                  display: 'flex', gap: 8, alignItems: 'flex-start',
                }}>
                  <AlertCircle size={16} style={{ flexShrink: 0, marginTop: 1 }} />
                  {sendError}
                </div>
              )}
            </div>
          )}
        </Modal>
      )}
    </div>
  )
}
