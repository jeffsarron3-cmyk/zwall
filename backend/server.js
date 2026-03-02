import { config } from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
config({ path: join(dirname(fileURLToPath(import.meta.url)), '.env') })
import express from 'express'
import cors from 'cors'
import * as blockbook from './services/blockchair.js'
import { getPrices } from './services/coingecko.js'
import signRouter from './routes/sign.js'

const app = express()
const PORT = process.env.PORT || 3001

app.use(cors())
app.use(express.json())

// ── Blockchain data (proxied — API key stays on server) ───────────────────────

app.get('/api/balance/:address', async (req, res) => {
  try { res.json(await blockbook.getBalance(req.params.address)) }
  catch (err) { res.status(502).json({ error: err.message }) }
})

app.get('/api/transactions/:address', async (req, res) => {
  try { res.json(await blockbook.getTransactions(req.params.address)) }
  catch (err) { res.status(502).json({ error: err.message }) }
})

app.get('/api/utxos/:address', async (req, res) => {
  try { res.json(await blockbook.getUTXOs(req.params.address)) }
  catch (err) { res.status(502).json({ error: err.message }) }
})

app.post('/api/broadcast', async (req, res) => {
  const { hex } = req.body
  if (!hex) return res.status(400).json({ error: 'Missing hex' })
  try { res.json(await blockbook.broadcastTx(hex)) }
  catch (err) { res.status(502).json({ error: err.message }) }
})

// ── Prices ────────────────────────────────────────────────────────────────────

app.get('/api/prices', async (_req, res) => {
  try { res.json(await getPrices()) }
  catch (err) { res.status(502).json({ error: err.message }) }
})

// ── Transaction signing ───────────────────────────────────────────────────────

app.use('/api/sign', signRouter)

// ── Health ────────────────────────────────────────────────────────────────────

app.get('/api/health', (_req, res) => res.json({ ok: true, ts: Date.now() }))

app.listen(PORT, () => {
  console.log(`ZODL backend → http://localhost:${PORT}`)
  console.log(`NOWNodes key: ${process.env.NOWNODES_API_KEY ? '✓ set' : '✗ missing'}`)
})
