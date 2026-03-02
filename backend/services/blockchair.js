// NOWNodes Zcash Blockbook API — https://zecbook.nownodes.io/api/v2
const BASE = 'https://zecbook.nownodes.io/api/v2'

async function apiFetch(path) {
  const { default: fetch } = await import('node-fetch')
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Api-Key': process.env.NOWNODES_API_KEY || '' },
    signal: AbortSignal.timeout(12000),
  })
  if (!res.ok) throw new Error(`Blockbook error ${res.status}: ${res.statusText}`)
  return res.json()
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
    signal:  AbortSignal.timeout(15000),
  })
  const json = await res.json()
  if (!res.ok || json.error) throw new Error(json.error || `Broadcast failed (${res.status})`)
  return { txid: json.result }
}
