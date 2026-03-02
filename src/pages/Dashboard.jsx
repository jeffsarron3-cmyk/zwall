import { useNavigate } from 'react-router-dom'
import { useWallet } from '../context/WalletContext.jsx'
import {
  ArrowDown, ArrowUp, ArrowRight, RefreshCw, Eye, EyeOff,
} from '../components/Icons.jsx'

function formatZEC(n) {
  return Number(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 8 })
}

function formatUSD(n) {
  return Number(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function formatDate(iso) {
  const d = new Date(iso)
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function SkeletonLine({ width = '100%', height = 14 }) {
  return (
    <div className="skeleton" style={{ width, height, borderRadius: 6 }} />
  )
}

export default function Dashboard() {
  const navigate = useNavigate()
  const {
    wallet, balance, transactions, zecPrice,
    balanceVisible, toggleBalance,
    syncing, loading, lastUpdated, apiError,
    refreshData,
  } = useWallet()

  const balanceUSD = balance * zecPrice

  const actions = [
    { label: 'Receive', icon: ArrowDown, path: '/receive', color: '#3DD68C' },
    { label: 'Send',    icon: ArrowUp,   path: '/send',    color: '#E84040' },
    { label: 'Pay',     icon: ArrowRight, path: '/pay',    color: '#F5A623' },
    { label: 'Swap',    icon: RefreshCw,  path: '/swap',   color: '#5018DB' },
  ]

  return (
    <div className="page-enter" style={{ padding: '32px 32px 80px' }}>
      {/* Balance Card */}
      <div style={{
        background: 'linear-gradient(135deg, #2a2040 0%, #1e1e2e 100%)',
        borderRadius: 'var(--radius-xl)',
        border: '1px solid rgba(107,69,232,0.2)',
        padding: '28px 28px 24px',
        marginBottom: 24,
        position: 'relative',
        overflow: 'hidden',
      }}>
        <div style={{
          position: 'absolute', top: -40, right: -40,
          width: 200, height: 200, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(107,69,232,0.15) 0%, transparent 70%)',
          pointerEvents: 'none',
        }} />

        {/* Header row */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <img
              src="https://zodl.com/wp-content/uploads/2026/01/logo-zodl-white.png"
              alt="ZODL"
              style={{ height: 20 }}
            />
          </div>
          <div style={{ display: 'flex', gap: 4 }}>
            <button
              className="btn-icon"
              onClick={refreshData}
              disabled={syncing}
              title="Refresh balance"
              style={{ opacity: syncing ? 0.5 : 1 }}
            >
              <RefreshCw size={16} style={{ animation: syncing ? 'spin 1s linear infinite' : 'none' }} />
            </button>
            <button className="btn-icon" onClick={toggleBalance} title="Hide/Show balance">
              {balanceVisible ? <Eye size={18} /> : <EyeOff size={18} />}
            </button>
          </div>
        </div>

        {/* Balance */}
        <div style={{ marginBottom: 6 }}>
          {loading ? (
            <div style={{ marginBottom: 8 }}><SkeletonLine width={200} height={44} /></div>
          ) : balanceVisible ? (
            <div className="balance-amount">
              <span className="balance-symbol">Ƶ</span>
              <span>{formatZEC(balance)}</span>
            </div>
          ) : (
            <div style={{ fontSize: 44, fontWeight: 700, letterSpacing: 4, color: 'var(--text-secondary)' }}>
              Ƶ — — — —
            </div>
          )}
          <div className="balance-usd">
            {loading ? <SkeletonLine width={120} height={12} /> :
              balanceVisible
                ? `≈ $${formatUSD(balanceUSD)} USD`
                : '••••••'}
          </div>
          {lastUpdated && !loading && (
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 6 }}>
              Updated {new Date(lastUpdated).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
            </div>
          )}
        </div>

        {/* Action buttons */}
        <div className="action-grid" style={{ marginTop: 28, marginBottom: 0 }}>
          {actions.map(({ label, icon: Icon, path, color }) => (
            <button
              key={label}
              className="action-btn"
              onClick={() => navigate(path)}
              style={{ background: 'rgba(255,255,255,0.06)', borderColor: 'rgba(255,255,255,0.1)' }}
            >
              <div className="action-btn-icon" style={{ background: `${color}18`, color }}>
                <Icon size={18} />
              </div>
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Sync / Error Banner */}
      {syncing && (
        <div className="sync-banner">
          <div className="sync-spinner" />
          <div className="sync-text">
            <div className="sync-title">Syncing with blockchain…</div>
            <div className="sync-subtitle">Fetching latest balance and transactions</div>
          </div>
        </div>
      )}

      {apiError && !syncing && (
        <div style={{
          padding: '12px 16px', marginBottom: 16,
          background: 'var(--error-dim)', border: '1px solid rgba(232,64,64,0.25)',
          borderRadius: 'var(--radius-md)', fontSize: 13, color: 'var(--error)',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12,
        }}>
          <span>⚠ {apiError}</span>
          <button
            onClick={refreshData}
            style={{
              fontSize: 12, color: 'var(--error)', fontWeight: 600,
              padding: '4px 10px', background: 'rgba(232,64,64,0.15)',
              borderRadius: 6, cursor: 'pointer', flexShrink: 0,
            }}
          >
            Retry
          </button>
        </div>
      )}

      {/* Transactions */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
          <h3 style={{ fontSize: 15, fontWeight: 600 }}>Transaction History</h3>
          {!loading && (
            <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
              {transactions.length} transactions
            </span>
          )}
        </div>

        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 8 }}>
            {[1, 2, 3].map(i => (
              <div key={i} className="skeleton" style={{ height: 68, borderRadius: 12 }} />
            ))}
          </div>
        ) : transactions.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📭</div>
            <div className="empty-title">There's nothing here, yet.</div>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 8 }}>
              Receive ZEC to get started
            </p>
          </div>
        ) : (
          <div className="tx-list" style={{ marginTop: 8 }}>
            {transactions.map((tx, idx) => (
              <div key={tx.txid || idx} className="tx-item">
                <div className={`tx-icon ${tx.type}`}>
                  {tx.type === 'received' ? <ArrowDown size={16} /> : <ArrowUp size={16} />}
                </div>
                <div className="tx-info">
                  <div className="tx-address">
                    {tx.address
                      ? `${tx.address.slice(0, 8)}…${tx.address.slice(-6)}`
                      : tx.txid?.slice(0, 12) + '…'}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
                    <span className="tx-date">{formatDate(tx.date)}</span>
                    {!tx.confirmed && (
                      <span className="tx-badge pending">Pending</span>
                    )}
                  </div>
                </div>
                <div className="tx-amount">
                  <div className={`tx-amount-zec ${tx.type}`}>
                    {tx.type === 'received' ? '+' : '-'}{formatZEC(tx.amount)} ZEC
                  </div>
                  <div className="tx-amount-usd">
                    ≈ ${formatUSD(tx.amount * zecPrice)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
