import { HashRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { WalletProvider, useWallet } from './context/WalletContext.jsx'
import AppLayout from './components/AppLayout.jsx'

import Welcome from './pages/Welcome.jsx'
import Restore from './pages/Restore.jsx'
import Unlock from './pages/Unlock.jsx'
import Dashboard from './pages/Dashboard.jsx'
import Receive from './pages/Receive.jsx'
import Send from './pages/Send.jsx'
import Pay from './pages/Pay.jsx'
import Swap from './pages/Swap.jsx'
import Settings from './pages/Settings.jsx'

const APP_PATHS = ['/dashboard', '/receive', '/send', '/pay', '/swap', '/settings']

function GlobalToast() {
  const { toast } = useWallet()
  const { pathname } = useLocation()
  if (!toast) return null
  const hasSidebar = APP_PATHS.includes(pathname)
  return (
    <div style={{
      position: 'fixed', bottom: 32,
      left: hasSidebar ? 'var(--sidebar-width)' : 0,
      right: 0,
      display: 'flex', justifyContent: 'center',
      zIndex: 2000, pointerEvents: 'none',
    }}>
      <div className={`toast ${toast.type}`} style={{ position: 'static', transform: 'none' }}>
        {toast.type === 'success' && <span>✓</span>}
        {toast.message}
      </div>
    </div>
  )
}

// Auth guard — wraps protected routes
function AuthGuard({ children }) {
  const { walletExists, isUnlocked, loading } = useWallet()
  if (loading) return null
  if (!walletExists) return <Navigate to="/" replace />
  if (!isUnlocked) return <Navigate to="/unlock" replace />
  return children
}

// Welcome guard — if wallet exists redirect to unlock/dashboard
function WelcomeGuard({ children }) {
  const { walletExists, isUnlocked, loading } = useWallet()
  if (loading) return null
  if (walletExists && isUnlocked) return <Navigate to="/dashboard" replace />
  if (walletExists && !isUnlocked) return <Navigate to="/unlock" replace />
  return children
}

export default function App() {
  return (
    <WalletProvider>
      <HashRouter>
        <Routes>
          {/* Onboarding — full screen, no sidebar */}
          <Route path="/" element={<WelcomeGuard><Welcome /></WelcomeGuard>} />
          <Route path="/restore" element={<WelcomeGuard><Restore /></WelcomeGuard>} />
          <Route path="/unlock" element={<Unlock />} />

          {/* Main app — with sidebar, requires auth */}
          <Route path="/dashboard" element={<AuthGuard><AppLayout><Dashboard /></AppLayout></AuthGuard>} />
          <Route path="/receive"   element={<AuthGuard><AppLayout><Receive /></AppLayout></AuthGuard>} />
          <Route path="/send"      element={<AuthGuard><AppLayout><Send /></AppLayout></AuthGuard>} />
          <Route path="/pay"       element={<AuthGuard><AppLayout><Pay /></AppLayout></AuthGuard>} />
          <Route path="/swap"      element={<AuthGuard><AppLayout><Swap /></AppLayout></AuthGuard>} />
          <Route path="/settings"  element={<AuthGuard><AppLayout><Settings /></AppLayout></AuthGuard>} />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        <GlobalToast />
      </HashRouter>
    </WalletProvider>
  )
}
