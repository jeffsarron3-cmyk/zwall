import { Router } from 'express'
import * as blockchair from '../services/blockchair.js'

const router = Router()

router.get('/balance/:address', async (req, res) => {
  try {
    const data = await blockchair.getBalance(req.params.address)
    res.json(data)
  } catch (err) {
    res.status(502).json({ error: err.message })
  }
})

router.get('/transactions/:address', async (req, res) => {
  try {
    const data = await blockchair.getTransactions(req.params.address)
    res.json(data)
  } catch (err) {
    res.status(502).json({ error: err.message })
  }
})

router.get('/utxos/:address', async (req, res) => {
  try {
    const data = await blockchair.getUTXOs(req.params.address)
    res.json(data)
  } catch (err) {
    res.status(502).json({ error: err.message })
  }
})

router.post('/broadcast', async (req, res) => {
  const { hex } = req.body
  if (!hex) return res.status(400).json({ error: 'Missing hex' })
  try {
    const data = await blockchair.broadcastTx(hex)
    res.json(data)
  } catch (err) {
    res.status(502).json({ error: err.message })
  }
})

export default router
