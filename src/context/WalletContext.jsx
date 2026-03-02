import { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react'
import { walletExists as storageWalletExists, saveWallet, loadWallet, clearWallet } from '../services/storage.js'
import { generateMnemonic, deriveWallet } from '../services/crypto.js'
import { fetchBalance, fetchTransactions, fetchPrices } from '../services/api.js'

const WalletContext = createContext(null)

export function WalletProvider({ children }) {
  // ── Auth & wallet state ──────────────────────────────────────
  const [walletExists, setWalletExists] = useState(false)
  const [isUnlocked, setIsUnlocked] = useState(false)

  // wallet = { name, address, privateKeyWIF, mnemonic (in-memory only) }
  const [wallet, setWallet] = useState(null)

  // ── On-chain data ────────────────────────────────────────────
  const [balance, setBalance] = useState(0)
  const [transactions, setTransactions] = useState([])

  // ── Prices ───────────────────────────────────────────────────
  const [zecPrice, setZecPrice] = useState(0)
  const [assetPrices, setAssetPrices] = useState({ btc: 0, eth: 0, sol: 0, usdc: 1, usdt: 1 })

  // ── Loading / sync ───────────────────────────────────────────
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)
  const [lastUpdated, setLastUpdated] = useState(null)
  const [apiError, setApiError] = useState(null)

  // ── UI ───────────────────────────────────────────────────────
  const [balanceVisible, setBalanceVisible] = useState(true)
  const [toast, setToast] = useState(null)

  const pollRef = useRef(null)
  const pricePollRef = useRef(null)

  // ── On mount: check if wallet exists ────────────────────────
  useEffect(() => {
    const devAddress = import.meta.env.VITE_DEV_ADDRESS
    if (devAddress) {
      // Dev mode: skip auth, use hardcoded address
      setWallet({ name: 'Dev', address: devAddress })
      setWalletExists(true)
      setIsUnlocked(true)
      setLoading(false)
      refreshPrices()
      refreshData(devAddress)
      return
    }
    setWalletExists(storageWalletExists())
    setLoading(false)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Helpers ─────────────────────────────────────────────────
  const showToast = useCallback((message, type = 'success') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 2500)
  }, [])

  const copyToClipboard = useCallback((text, label = 'Address') => {
    navigator.clipboard.writeText(text).catch(() => {})
    showToast(`${label} copied!`)
  }, [showToast])

  const toggleBalance = useCallback(() => setBalanceVisible(v => !v), [])

  // ── Data refresh ─────────────────────────────────────────────
  const refreshData = useCallback(async (address) => {
    if (!address) return
    setSyncing(true)
    setApiError(null)
    try {
      const [balData, txData] = await Promise.all([
        fetchBalance(address),
        fetchTransactions(address),
      ])
      setBalance(balData.balance)
      setTransactions(txData)
      setLastUpdated(Date.now())
    } catch (err) {
      setApiError(err.message)
      // Keep stale data — don't clear
    } finally {
      setSyncing(false)
    }
  }, [])

  const refreshPrices = useCallback(async () => {
    try {
      const p = await fetchPrices()
      setZecPrice(p.zec || 0)
      setAssetPrices({ btc: p.btc, eth: p.eth, sol: p.sol, usdc: p.usdc, usdt: p.usdt })
    } catch {
      // Silently fail on price errors
    }
  }, [])

  // ── Create a new wallet from a mnemonic ──────────────────────
  const createWallet = useCallback(async (mnemonic, password, name = 'Zodl') => {
    const derived = deriveWallet(mnemonic)
    const walletData = {
      name,
      address: derived.address,
      mnemonic,
      createdAt: new Date().toISOString(),
    }
    await saveWallet(walletData, password)
    setWalletExists(true)

    // Keep private key only in memory
    setWallet({ ...walletData, privateKeyWIF: derived.privateKeyWIF })
    setIsUnlocked(true)
    setBalance(0)
    setTransactions([])

    await refreshPrices()
    await refreshData(derived.address)
  }, [refreshData, refreshPrices])

  // ── Unlock an existing wallet ─────────────────────────────────
  const unlockWallet = useCallback(async (password) => {
    const walletData = await loadWallet(password) // throws if wrong password
    const derived = deriveWallet(walletData.mnemonic)
    setWallet({ ...walletData, privateKeyWIF: derived.privateKeyWIF })
    setIsUnlocked(true)

    await refreshPrices()
    await refreshData(walletData.address)
  }, [refreshData, refreshPrices])

  // ── Lock wallet ───────────────────────────────────────────────
  const lockWallet = useCallback(() => {
    setWallet(null)
    setIsUnlocked(false)
    setBalance(0)
    setTransactions([])
    if (pollRef.current) clearInterval(pollRef.current)
    if (pricePollRef.current) clearInterval(pricePollRef.current)
  }, [])

  // ── Delete wallet entirely ────────────────────────────────────
  const deleteWallet = useCallback(() => {
    clearWallet()
    lockWallet()
    setWalletExists(false)
  }, [lockWallet])

  // ── Change password ───────────────────────────────────────────
  const changePassword = useCallback(async (currentPassword, newPassword) => {
    const walletData = await loadWallet(currentPassword) // throws if wrong
    await saveWallet(walletData, newPassword)
  }, [])

  // ── Generate a new mnemonic (for create flow) ─────────────────
  const newMnemonic = useCallback(() => generateMnemonic(), [])

  // ── Poll for data once unlocked ───────────────────────────────
  useEffect(() => {
    if (!isUnlocked || !wallet?.address) return

    // Poll balance/txs every 60s
    pollRef.current = setInterval(() => refreshData(wallet.address), 60_000)
    // Poll prices every 5min
    pricePollRef.current = setInterval(refreshPrices, 300_000)

    return () => {
      clearInterval(pollRef.current)
      clearInterval(pricePollRef.current)
    }
  }, [isUnlocked, wallet?.address, refreshData, refreshPrices])

  return (
    <WalletContext.Provider value={{
      // Auth
      walletExists,
      isUnlocked,

      // Wallet info
      wallet,

      // On-chain
      balance,
      transactions,

      // Prices
      zecPrice,
      assetPrices,

      // Loading
      loading,
      syncing,
      lastUpdated,
      apiError,

      // UI
      balanceVisible,
      toast,

      // Methods
      createWallet,
      unlockWallet,
      lockWallet,
      deleteWallet,
      changePassword,
      newMnemonic,
      refreshData: () => refreshData(wallet?.address),
      refreshPrices,
      toggleBalance,
      showToast,
      copyToClipboard,
    }}>
      {children}
    </WalletContext.Provider>
  )
}

export const useWallet = () => {
  const ctx = useContext(WalletContext)
  if (!ctx) throw new Error('useWallet must be used inside WalletProvider')
  return ctx
}
