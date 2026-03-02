import { useState, useMemo } from 'react'
import { useWallet } from '../context/WalletContext.jsx'
import Modal from '../components/Modal.jsx'
import { ArrowUpDown, User, QrCode, ChevronDown, Search, Info, Settings, Check } from '../components/Icons.jsx'
import { ASSETS } from '../data/assets.js'

export default function Swap() {
  const { zecPrice, showToast } = useWallet()
  const [fromAsset, setFromAsset] = useState(ASSETS[0]) // BTC
  const [fromAmount, setFromAmount] = useState('')
  const [refundAddress, setRefundAddress] = useState('')
  const [assetModalOpen, setAssetModalOpen] = useState(false)
  const [infoOpen, setInfoOpen] = useState(false)
  const [quoteLoading, setQuoteLoading] = useState(false)
  const [quoteReady, setQuoteReady] = useState(false)
  const [query, setQuery] = useState('')

  const filteredAssets = useMemo(() =>
    ASSETS.filter(a =>
      a.symbol.toLowerCase().includes(query.toLowerCase()) ||
      a.name.toLowerCase().includes(query.toLowerCase())
    ), [query])

  // ZEC = fromAsset.price / zecPrice * fromAmount
  const toAmount = useMemo(() => {
    const n = parseFloat(fromAmount)
    if (isNaN(n) || n <= 0) return ''
    const rate = fromAsset.price / (zecPrice || 0.12)
    return (n * rate).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  }, [fromAmount, fromAsset.price, zecPrice])

  const fromUSD = useMemo(() => {
    const n = parseFloat(fromAmount)
    if (isNaN(n) || n <= 0) return ''
    return (n * fromAsset.price).toLocaleString('en-US', { minimumFractionDigits: 2 })
  }, [fromAmount, fromAsset.price])

  const rate = useMemo(() => {
    const r = fromAsset.price / (zecPrice || 0.12)
    return `1 ZEC = ${(1 / r).toFixed(8)} ${fromAsset.symbol}`
  }, [fromAsset, zecPrice])

  const isValid = fromAmount && parseFloat(fromAmount) > 0

  const handleGetQuote = () => {
    if (!isValid) return
    setQuoteLoading(true)
    setTimeout(() => {
      setQuoteLoading(false)
      setQuoteReady(true)
    }, 1200)
  }

  return (
    <div className="page page-enter">
      <div className="page-header">
        <span className="page-title">Swap</span>
        <button className="btn-icon" onClick={() => setInfoOpen(true)}>
          <Info size={18} />
        </button>
      </div>

      {/* FROM section */}
      <div className="card" style={{ marginBottom: 8, padding: '20px' }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: 12 }}>
          From
        </div>

        <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start', marginBottom: 8 }}>
          {/* Asset selector */}
          <button
            className="asset-pill"
            onClick={() => setAssetModalOpen(true)}
            style={{ flexShrink: 0 }}
          >
            <div className="asset-dot" style={{ background: fromAsset.color }}>
              {fromAsset.emoji}
            </div>
            <span>{fromAsset.symbol}</span>
            <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>{fromAsset.network}</span>
            <ChevronDown size={13} />
          </button>

          {/* Amount input */}
          <div className="input-wrap" style={{ flex: 1 }}>
            <input
              type="number"
              placeholder="0"
              value={fromAmount}
              onChange={e => { setFromAmount(e.target.value); setQuoteReady(false) }}
              style={{ padding: '10px 14px', fontSize: 22, fontWeight: 700 }}
            />
          </div>
        </div>

        {fromUSD && (
          <div style={{ fontSize: 13, color: 'var(--text-secondary)', textAlign: 'right' }}>
            ≈ ${fromUSD} US$
            <button
              style={{
                marginLeft: 8,
                fontSize: 11,
                color: 'var(--text-muted)',
                background: 'var(--bg-input)',
                padding: '3px 8px',
                borderRadius: 4,
                cursor: 'pointer',
              }}
              onClick={() => {}}
            >
              ↕
            </button>
          </div>
        )}

        {/* Refund address */}
        <div style={{ marginTop: 16 }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            fontSize: 12,
            color: 'var(--text-secondary)',
            marginBottom: 6,
          }}>
            Refund Address
            <span title="If the swap fails, funds are returned here">ⓘ</span>
          </div>
          <div className="input-wrap">
            <input
              type="text"
              placeholder={`${fromAsset.symbol} address...`}
              value={refundAddress}
              onChange={e => setRefundAddress(e.target.value)}
              style={{ fontSize: 13 }}
            />
            <div className="input-addon">
              <button className="input-addon-btn"><User size={15} /></button>
              <button
                className="input-addon-btn"
                onClick={() => setRefundAddress('bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh')}
              >
                <QrCode size={15} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Swap direction button */}
      <div style={{ display: 'flex', justifyContent: 'center', margin: '-4px 0', position: 'relative', zIndex: 1 }}>
        <button
          style={{
            width: 40,
            height: 40,
            borderRadius: 12,
            background: 'var(--bg-card)',
            border: '1px solid var(--border)',
            color: 'var(--text-secondary)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all var(--transition)',
            boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
          }}
          onMouseEnter={e => {
            e.currentTarget.style.background = 'var(--bg-hover)'
            e.currentTarget.style.color = 'var(--text-primary)'
          }}
          onMouseLeave={e => {
            e.currentTarget.style.background = 'var(--bg-card)'
            e.currentTarget.style.color = 'var(--text-secondary)'
          }}
        >
          <ArrowUpDown size={18} />
        </button>
      </div>

      {/* TO section */}
      <div className="card" style={{ marginTop: 8, marginBottom: 20, padding: '20px' }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: 12 }}>
          To
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{
              width: 36, height: 36, borderRadius: '50%',
              background: '#F4B728',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 16, fontWeight: 700, color: 'white', flexShrink: 0,
            }}>Ƶ</div>
            <span style={{ fontWeight: 600, fontSize: 15 }}>ZEC</span>
          </div>
          <div style={{ flex: 1, textAlign: 'right' }}>
            <div style={{ fontSize: 24, fontWeight: 700 }}>
              {toAmount || <span style={{ color: 'var(--text-muted)', fontSize: 18 }}>—</span>}
            </div>
            {fromUSD && (
              <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>
                ≈ ${fromUSD} US$
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Rate info */}
      <div style={{ marginBottom: 20 }}>
        <div className="rate-row">
          <span className="rate-row-label">Slippage tolerance</span>
          <button className="slippage-pill">
            1% <Settings size={13} />
          </button>
        </div>
        {fromAmount && parseFloat(fromAmount) > 0 && (
          <div className="rate-row">
            <span className="rate-row-label">Rate</span>
            <span className="rate-row-value" style={{ fontSize: 13 }}>{rate}</span>
          </div>
        )}
        {quoteReady && (
          <div className="rate-row" style={{ animation: 'fadeIn 0.3s ease' }}>
            <span className="rate-row-label">Estimated time</span>
            <span className="rate-row-value" style={{ color: 'var(--success)' }}>~10 minutes</span>
          </div>
        )}
      </div>

      {/* Get a quote button */}
      {!quoteReady ? (
        <button
          className="btn btn-primary"
          disabled={!isValid || quoteLoading}
          onClick={handleGetQuote}
          style={{ fontSize: 16, padding: '16px 24px' }}
        >
          {quoteLoading ? (
            <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{
                width: 16, height: 16,
                border: '2px solid rgba(0,0,0,0.2)',
                borderTopColor: '#111',
                borderRadius: '50%',
                animation: 'spin 0.7s linear infinite',
              }} />
              Getting quote...
            </span>
          ) : 'Get a quote'}
        </button>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{
            padding: '14px 16px',
            background: 'var(--success-dim)',
            border: '1px solid rgba(61,214,140,0.2)',
            borderRadius: 'var(--radius-md)',
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            color: 'var(--success)',
            fontSize: 14,
            fontWeight: 500,
          }}>
            <Check size={16} />
            Quote ready — valid for 30 seconds
          </div>
          <button
            className="btn btn-accent"
            onClick={() => {
              showToast('Swap initiated!')
              setQuoteReady(false)
              setFromAmount('')
              setRefundAddress('')
            }}
            style={{ fontSize: 16, padding: '16px 24px' }}
          >
            Confirm Swap
          </button>
          <button
            className="btn btn-secondary"
            onClick={() => setQuoteReady(false)}
            style={{ fontSize: 15 }}
          >
            Cancel
          </button>
        </div>
      )}

      {/* Asset Modal */}
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
                placeholder="Search..."
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
                  setFromAsset(asset)
                  setAssetModalOpen(false)
                  setQuery('')
                  setFromAmount('')
                  setQuoteReady(false)
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: '12px 4px',
                  background: fromAsset.id === asset.id ? 'var(--accent-dim)' : 'transparent',
                  border: 'none',
                  borderRadius: 'var(--radius-md)',
                  cursor: 'pointer',
                  color: 'var(--text-primary)',
                  textAlign: 'left',
                  transition: 'background var(--transition)',
                }}
                onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'}
                onMouseLeave={e => {
                  e.currentTarget.style.background = fromAsset.id === asset.id ? 'var(--accent-dim)' : 'transparent'
                }}
              >
                <div className="asset-dot" style={{ background: asset.color, width: 36, height: 36, fontSize: 15 }}>
                  {asset.emoji}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: 14 }}>{asset.symbol}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{asset.name} · {asset.network}</div>
                </div>
                {fromAsset.id === asset.id && <Check size={16} style={{ color: 'var(--accent-light)' }} />}
              </button>
            ))}
          </div>
        </Modal>
      )}

      {/* Info Modal */}
      {infoOpen && (
        <Modal title="About Swap" onClose={() => setInfoOpen(false)}>
          <div style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.7 }}>
            <p style={{ marginBottom: 12 }}>
              <strong style={{ color: 'var(--text-primary)' }}>Swap</strong> lets you exchange another cryptocurrency into ZEC directly in your wallet.
            </p>
            <p style={{ marginBottom: 12 }}>
              Provide a refund address in case the swap cannot be completed. Funds will be returned there automatically.
            </p>
            <p>
              Rates are fetched in real time and may change. Slippage tolerance protects you from unfavorable price movements.
            </p>
          </div>
        </Modal>
      )}
    </div>
  )
}
