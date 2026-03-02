import { NavLink, useNavigate } from 'react-router-dom'
import { useWallet } from '../context/WalletContext.jsx'
import {
  ArrowDown, ArrowUp, ArrowRight, RefreshCw,
  Settings, Wallet, ChevronDown,
} from './Icons.jsx'

const NAV = [
  { path: '/dashboard', label: 'Dashboard', icon: Wallet },
  { path: '/receive', label: 'Receive', icon: ArrowDown },
  { path: '/send', label: 'Send', icon: ArrowUp },
  { path: '/pay', label: 'CrossPay', icon: ArrowRight },
  { path: '/swap', label: 'Swap', icon: RefreshCw },
]

export default function Sidebar() {
  const { wallet } = useWallet()
  const navigate = useNavigate()

  return (
    <aside style={{
      width: 'var(--sidebar-width)',
      minHeight: '100vh',
      background: 'var(--bg-secondary)',
      borderRight: '1px solid var(--border)',
      display: 'flex',
      flexDirection: 'column',
      position: 'fixed',
      top: 0,
      left: 0,
      bottom: 0,
      zIndex: 100,
    }}>
      {/* Logo */}
      <div style={{
        padding: '24px 20px 20px',
        borderBottom: '1px solid var(--border)',
      }}>
        <button
          onClick={() => navigate('/dashboard')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            cursor: 'pointer',
            width: '100%',
            padding: '8px 10px',
            borderRadius: 'var(--radius-md)',
            transition: 'background var(--transition)',
            background: 'transparent',
          }}
          onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'}
          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
        >
          <div style={{
            width: 34,
            height: 34,
            borderRadius: 10,
            background: 'var(--accent)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 700,
            fontSize: 16,
            color: 'white',
            flexShrink: 0,
          }}>
            Ƶ
          </div>
          <div style={{ flex: 1, textAlign: 'left' }}>
            <div style={{ fontWeight: 600, fontSize: 14 }}>{wallet.name}</div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
              {wallet.shieldedAddressShort}
            </div>
          </div>
          <ChevronDown size={14} />
        </button>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: '12px 12px 0' }}>
        {NAV.map(({ path, label, icon: Icon }) => (
          <NavLink
            key={path}
            to={path}
            style={({ isActive }) => ({
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              padding: '10px 12px',
              borderRadius: 'var(--radius-md)',
              marginBottom: 2,
              fontSize: 14,
              fontWeight: isActive ? 600 : 400,
              color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
              background: isActive ? 'var(--bg-hover)' : 'transparent',
              transition: 'all var(--transition)',
              textDecoration: 'none',
            })}
            onMouseEnter={e => {
              if (!e.currentTarget.dataset.active) {
                e.currentTarget.style.background = 'var(--bg-hover)'
                e.currentTarget.style.color = 'var(--text-primary)'
              }
            }}
            onMouseLeave={e => {
              if (!e.currentTarget.dataset.active) {
                e.currentTarget.style.background = 'transparent'
                e.currentTarget.style.color = 'var(--text-secondary)'
              }
            }}
          >
            {({ isActive }) => (
              <>
                <div style={{
                  width: 32,
                  height: 32,
                  borderRadius: 8,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: isActive ? 'var(--accent-dim)' : 'transparent',
                  color: isActive ? 'var(--accent-light)' : 'inherit',
                  transition: 'all var(--transition)',
                }}>
                  <Icon size={17} />
                </div>
                {label}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Bottom */}
      <div style={{ padding: '12px', borderTop: '1px solid var(--border)' }}>
        <NavLink
          to="/settings"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            padding: '10px 12px',
            borderRadius: 'var(--radius-md)',
            fontSize: 14,
            color: 'var(--text-secondary)',
            transition: 'all var(--transition)',
            textDecoration: 'none',
          }}
          onMouseEnter={e => {
            e.currentTarget.style.background = 'var(--bg-hover)'
            e.currentTarget.style.color = 'var(--text-primary)'
          }}
          onMouseLeave={e => {
            e.currentTarget.style.background = 'transparent'
            e.currentTarget.style.color = 'var(--text-secondary)'
          }}
        >
          <div style={{
            width: 32, height: 32, borderRadius: 8,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Settings size={17} />
          </div>
          Settings
        </NavLink>
      </div>
    </aside>
  )
}
