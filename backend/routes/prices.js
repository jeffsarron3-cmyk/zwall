import { Router } from 'express'
import { getPrices } from '../services/coingecko.js'

const router = Router()

router.get('/', async (_req, res) => {
  try {
    const data = await getPrices()
    res.json(data)
  } catch (err) {
    res.status(502).json({ error: err.message })
  }
})

export default router
