// NOWNodes Zcash Blockbook API — https://zecbook.nownodes.io/api/v2
const BASE = 'https://zecbook.nownodes.io/api/v2'

// In-flight deduplication: if the same path is already being fetched, reuse the promise
const inflight = new Map()

// Short-lived cache: avoids re-fetching the same data within 10 seconds
const cache = new Map()
const CACHE_TTL = 10_000

const TIMEOUT_MS  = 30_000  // 30s per attempt  (like curl --max-time 30)
const RETRIES     = 3       // (like curl --retry 3)
const RETRY_DELAY = 2_000   // 2s between retries (like curl --retry-delay 2)

function sleep(ms) { return new Promise(r => setTimeout(r, ms)) }

async function fetchWithRetry(url, options) {
  const { default: fetch } = await import('node-fetch')
  let lastErr
  for (let attempt = 0; attempt <= RETRIES; attempt++) {
    try {
      const res = await fetch(url, { ...options, signal: AbortSignal.timeout(TIMEOUT_MS) })
      if (!res.ok) throw new Error(`Blockbook ${res.status}: ${res.statusText}`)
      return await res.json()
    } catch (err) {
      lastErr = err
      if (attempt < RETRIES) await sleep(RETRY_DELAY)
    }
  }
  throw lastErr
}

async function apiFetch(path) {
  const now = Date.now()
  const cached = cache.get(path)
  if (cached && now - cached.ts < CACHE_TTL) return cached.data

  if (inflight.has(path)) return inflight.get(path)

  const headers = { 'Api-Key': process.env.NOWNODES_API_KEY || '' }
  const promise = fetchWithRetry(`${BASE}${path}`, { headers })
    .then(data => {
      inflight.delete(path)
      cache.set(path, { ts: Date.now(), data })
      return data
    })
    .catch(err => {
      inflight.delete(path)
      throw err
    })

  inflight.set(path, promise)
  return promise
}

export async function getBalance(address) {
  const data = await apiFetch(`/address/${encodeURIComponent(address)}`)
  return {
    balance:  Number(data.balance)       / 1e8,
    received: Number(data.totalReceived) / 1e8,
    spent:    Number(data.totalSent)     / 1e8,
    txCount:  data.txs,
  }
}

export async function getTransactions(address) {
  const data = await apiFetch(`/address/${encodeURIComponent(address)}?details=txs&pageSize=50`)
  return (data.transactions || []).map(tx => {
    const sentFromUs = tx.vin?.some(i => i.addresses?.includes(address))
    const amount = sentFromUs
      ? (tx.vout || []).filter(o => !o.addresses?.includes(address)).reduce((s, o) => s + Number(o.value), 0) / 1e8
      : (tx.vout || []).filter(o =>  o.addresses?.includes(address)).reduce((s, o) => s + Number(o.value), 0) / 1e8
    return {
      txid:      tx.txid,
      type:      sentFromUs ? 'sent' : 'received',
      amount:    Math.abs(amount),
      date:      new Date((tx.blockTime || Date.now() / 1000) * 1000).toISOString(),
      confirmed: (tx.confirmations || 0) > 0,
      address:   sentFromUs
        ? tx.vout?.find(o => !o.addresses?.includes(address))?.addresses?.[0] || ''
        : tx.vin?.[0]?.addresses?.[0] || '',
    }
  })
}

export async function getUTXOs(address) {
  const data = await apiFetch(`/utxo/${encodeURIComponent(address)}`)
  return (data || []).map(u => ({
    txid:          u.txid,
    vout:          u.vout,
    value:         Number(u.value),
    valueZEC:      Number(u.value) / 1e8,
    confirmations: u.confirmations || 0,
  }))
}

export async function broadcastTx(hexTx) {
  const { default: fetch } = await import('node-fetch')
  const res = await fetch(`${BASE}/sendtx/`, {
    method:  'POST',
    headers: { 'Content-Type': 'text/plain', 'Api-Key': process.env.NOWNODES_API_KEY || '' },
    body:    hexTx,
    signal:  AbortSignal.timeout(TIMEOUT_MS),
  })
  const json = await res.json()
  if (!res.ok || json.error) throw new Error(json.error || `Broadcast failed (${res.status})`)
  return { txid: json.result }
}
