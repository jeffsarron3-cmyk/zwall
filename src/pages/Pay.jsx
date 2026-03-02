import { useState, useMemo } from 'react'
import { useWallet } from '../context/WalletContext.jsx'
import Modal from '../components/Modal.jsx'
import { Eye, EyeOff, User, QrCode, ChevronDown, Search, Info, Settings } from '../components/Icons.jsx'
import { ASSETS } from '../data/assets.js'

export default function Pay() {
  const { wallet, balanceVisible, toggleBalance, showToast } = useWallet()
  const [selectedAsset, setSelectedAsset] = useState(ASSETS[0]) // BTC
  const [address, setAddress] = useState('')
  const [amountAsset, setAmountAsset] = useState('')
  const [amountUSD, setAmountUSD] = useState('')
  const [assetModalOpen, setAssetModalOpen] = useState(false)
  const [infoOpen, setInfoOpen] = useState(false)
  const [query, setQuery] = useState('')

  const filteredAssets = useMemo(() =>
    ASSETS.filter(a =>
      a.symbol.toLowerCase().includes(query.toLowerCase()) ||
      a.name.toLowerCase().includes(query.toLowerCase()) ||
      a.network.toLowerCase().includes(query.toLowerCase())
    ), [query])

  const handleAmountAsset = (val) => {
    setAmountAsset(val)
    const n = parseFloat(val)
    if (!isNaN(n) && selectedAsset.price) {
      setAmountUSD((n * selectedAsset.price).toFixed(2))
    } else {
      setAmountUSD('')
    }
  }

  const handleAmountUSD = (val) => {
    setAmountUSD(val)
    const n = parseFloat(val)
    if (!isNaN(n) && selectedAsset.price) {
      setAmountAsset((n / selectedAsset.price).toFixed(8))
    } else {
      setAmountAsset('')
    }
  }

  const zecSpend = amountUSD
    ? (parseFloat(amountUSD) / (wallet.zecPrice || 0.12)).toFixed(2)
    : '0'

  const isValid = address && amountAsset && parseFloat(amountAsset) > 0

  return (
    <div className="page page-enter">
      <div className="page-header">
        <span className="page-title">CrossPay</span>
        <div style={{ display: 'flex', gap: 2 }}>
          <button className="btn-icon" onClick={toggleBalance}>
            {balanceVisible ? <Eye size={18} /> : <EyeOff size={18} />}
          </button>
          <button className="btn-icon" onClick={() => setInfoOpen(true)}>
            <Info size={18} />
          </button>
        </div>
      </div>

      {/* Balance */}
      <div style={{ textAlign: 'center', marginBottom: 32 }}>
        {balanceVisible ? (
          <div className="balance-amount" style={{ justifyContent: 'center', fontSize: 44 }}>
            <span className="balance-symbol" style={{ fontSize: 30 }}>Ƶ</span>
            <span>{wallet.balance.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
          </div>
        ) : (
          <div style={{ fontSize: 36, fontWeight: 700, letterSpacing: 8, color: 'var(--text-secondary)' }}>
            Ƶ — — — —
          </div>
        )}
      </div>

      {/* Send to */}
      <div className="input-group">
        <label className="input-label">Send to</label>

        {/* Asset selector */}
        <div style={{ marginBottom: 8 }}>
          <button
            className="asset-pill"
            onClick={() => setAssetModalOpen(true)}
            style={{ marginBottom: 8 }}
          >
            <div className="asset-dot" style={{ background: selectedAsset.color }}>
              {selectedAsset.emoji}
            </div>
            <span>{selectedAsset.symbol} on {selectedAsset.network}</span>
            <ChevronDown size={14} />
          </button>
        </div>

        <div className="input-wrap">
          <input
            type="text"
            placeholder={`${selectedAsset.symbol} address...`}
            value={address}
            onChange={e => setAddress(e.target.value)}
          />
          <div className="input-addon">
            <button className="input-addon-btn"><User size={16} /></button>
            <button
              className="input-addon-btn"
              onClick={() => setAddress('bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh')}
            >
              <QrCode size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Amount */}
      <div className="input-group">
        <label className="input-label">Amount</label>
        <div style={{ display: 'flex', gap: 8, alignItems: 'stretch' }}>
          <div className="input-wrap" style={{ flex: 1 }}>
            <input
              type="number"
              placeholder={selectedAsset.symbol}
              value={amountAsset}
              min={0}
              onChange={e => handleAmountAsset(e.target.value)}
              style={{ padding: '13px 14px' }}
            />
          </div>

          <button
            style={{
              width: 36,
              flexShrink: 0,
              background: 'var(--bg-input)',
              border: '1.5px solid transparent',
              borderRadius: 'var(--radius-md)',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 16,
              transition: 'all var(--transition)',
            }}
            onClick={() => {
              const t = amountAsset
              setAmountAsset(amountUSD)
              setAmountUSD(t)
            }}
          >
            ⇄
          </button>

          <div className="input-wrap" style={{ flex: 1 }}>
            <div style={{ padding: '0 0 0 14px', color: 'var(--text-muted)', flexShrink: 0 }}>$</div>
            <input
              type="number"
              placeholder="USD"
              value={amountUSD}
              min={0}
              onChange={e => handleAmountUSD(e.target.value)}
              style={{ padding: '13px 8px' }}
            />
          </div>
        </div>
      </div>

      {/* ZEC spend estimate */}
      <div className="card" style={{ marginBottom: 20, padding: '14px 16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 28, height: 28, borderRadius: '50%',
              background: '#F4B728',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 13, fontWeight: 700, color: 'white',
            }}>
              Ƶ
            </div>
            <span style={{ fontSize: 14, fontWeight: 500 }}>ZEC</span>
          </div>
          <span style={{ fontWeight: 600, fontSize: 15 }}>{zecSpend} ZEC</span>
        </div>
      </div>

      {/* Slippage */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 24,
      }}>
        <span style={{ fontSize: 14, color: 'var(--text-secondary)' }}>Slippage tolerance</span>
        <button className="slippage-pill">
          1% <Settings size={13} />
        </button>
      </div>

      <button
        className="btn btn-primary"
        disabled={!isValid}
        onClick={() => showToast('Transaction submitted!')}
        style={{ fontSize: 16, padding: '16px 24px' }}
      >
        Review
      </button>

      {/* Asset Select Modal */}
      {assetModalOpen && (
        <Modal
          title="Select Asset"
          onClose={() => { setAssetModalOpen(false); setQuery('') }}
          maxWidth={420}
        >
          <div style={{ marginBottom: 16 }}>
            <div className="input-wrap">
              <div style={{ padding: '0 0 0 12px', color: 'var(--text-muted)' }}>
                <Search size={16} />
              </div>
              <input
                type="text"
                placeholder="Search by name or ticker..."
                value={query}
                onChange={e => setQuery(e.target.value)}
                autoFocus
              />
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 2, maxHeight: 360, overflowY: 'auto' }}>
            {filteredAssets.map(asset => (
              <button
                key={asset.id}
                onClick={() => {
                  setSelectedAsset(asset)
                  setAssetModalOpen(false)
                  setQuery('')
                  setAddress('')
                  setAmountAsset('')
                  setAmountUSD('')
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: '12px 4px',
                  background: 'transparent',
                  border: 'none',
                  borderRadius: 'var(--radius-md)',
                  cursor: 'pointer',
                  color: 'var(--text-primary)',
                  transition: 'background var(--transition)',
                  textAlign: 'left',
                }}
                onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                <div className="asset-dot" style={{ background: asset.color, width: 36, height: 36, fontSize: 15 }}>
                  {asset.emoji}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: 14 }}>{asset.symbol}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                    {asset.name} · {asset.network}
                  </div>
                </div>
                <span style={{ color: 'var(--text-muted)', fontSize: 18 }}>›</span>
              </button>
            ))}
          </div>
        </Modal>
      )}

      {/* Info Modal */}
      {infoOpen && (
        <Modal title="About CrossPay" onClose={() => setInfoOpen(false)}>
          <div style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.7 }}>
            <p style={{ marginBottom: 12 }}>
              <strong style={{ color: 'var(--text-primary)' }}>CrossPay</strong> lets you send ZEC and have the recipient receive a different cryptocurrency — like BTC, ETH, or stablecoins.
            </p>
            <p style={{ marginBottom: 12 }}>
              Your ZEC is automatically swapped via a decentralized protocol. The recipient gets exactly what you specified.
            </p>
            <p>
              <strong style={{ color: 'var(--text-primary)' }}>Slippage tolerance</strong> defines the maximum price movement you'll accept during the swap.
            </p>
          </div>
        </Modal>
      )}
    </div>
  )
}
