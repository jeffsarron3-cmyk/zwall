import Sidebar from './Sidebar.jsx'
import { useWallet } from '../context/WalletContext.jsx'

export default function AppLayout({ children }) {
  const { toast } = useWallet()

  return (
    <div className="app-shell">
      <Sidebar />
      <main className="main-content">
        {children}
      </main>

      {/* Toast notifications */}
      {toast && (
        <div className={`toast ${toast.type}`}>
          {toast.type === 'success' && <span>✓</span>}
          {toast.message}
        </div>
      )}
    </div>
  )
}
