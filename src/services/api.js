// All blockchain calls go through the local backend (API key stays server-side)
const BASE = '/api'

async function get(path) {
  const res = await fetch(`${BASE}${path}`)
  const json = await res.json()
  if (!res.ok) throw new Error(json.error || `API error ${res.status}`)
  return json
}

async function post(path, body) {
  const res = await fetch(`${BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  const json = await res.json()
  if (!res.ok) throw new Error(json.error || `API error ${res.status}`)
  return json
}

export const fetchBalance      = (address) => get(`/balance/${address}`)
export const fetchTransactions = (address) => get(`/transactions/${address}`)
export const fetchUTXOs        = (address) => get(`/utxos/${address}`)
export const fetchPrices       = ()        => get('/prices')
export const broadcastTx       = (hex)     => post('/broadcast', { hex })
export const signTransaction   = (data)    => post('/sign', data)
