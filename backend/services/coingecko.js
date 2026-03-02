const COINGECKO_URL =
  'https://api.coingecko.com/api/v3/simple/price?ids=zcash,bitcoin,ethereum,solana,usd-coin,tether&vs_currencies=usd'

let cache = null
let cacheTime = 0
const CACHE_TTL = 60 * 1000 // 60 seconds

export async function getPrices() {
  const now = Date.now()
  if (cache && now - cacheTime < CACHE_TTL) return cache

  const { default: fetch } = await import('node-fetch')
  const res = await fetch(COINGECKO_URL, { signal: AbortSignal.timeout(8000) })
  if (!res.ok) throw new Error(`CoinGecko error ${res.status}`)
  const json = await res.json()

  cache = {
    zec: json.zcash?.usd ?? 0,
    btc: json.bitcoin?.usd ?? 0,
    eth: json.ethereum?.usd ?? 0,
    sol: json.solana?.usd ?? 0,
    usdc: json['usd-coin']?.usd ?? 1,
    usdt: json.tether?.usd ?? 1,
  }
  cacheTime = now
  return cache
}
