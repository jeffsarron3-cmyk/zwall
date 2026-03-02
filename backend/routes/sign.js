import { Router } from 'express'

const router = Router()

// POST /api/sign
// Body: { utxos, to, amount, fee, changeAddress, privateKeyWIF }
// Returns: { hex } — signed raw transaction hex
router.post('/', async (req, res) => {
  const { utxos, to, amount, fee = 0.0001, changeAddress, privateKeyWIF } = req.body
  if (!utxos || !to || !amount || !changeAddress || !privateKeyWIF) {
    return res.status(400).json({ error: 'Missing required fields' })
  }
  try {
    const utxolib = await import('@bitgo/utxo-lib')
    const networks = utxolib.networks || utxolib.default?.networks
    const TransactionBuilder = utxolib.TransactionBuilder || utxolib.default?.TransactionBuilder

    if (!networks || !TransactionBuilder) {
      throw new Error('@bitgo/utxo-lib API not found — check version')
    }

    const network = networks.zcash
    const amountSat = Math.round(amount * 1e8)
    const feeSat = Math.round(fee * 1e8)

    // Select UTXOs
    let total = 0
    const selected = []
    for (const u of utxos) {
      if (total >= amountSat + feeSat) break
      selected.push(u)
      total += u.value
    }
    if (total < amountSat + feeSat) {
      return res.status(400).json({ error: 'Insufficient funds' })
    }
    const change = total - amountSat - feeSat

    const txb = new TransactionBuilder(network)
    txb.setVersion(4)
    // NU5 / Sapling: versionGroupId for v4 = 0x892F2085
    if (txb.setVersionGroupId) txb.setVersionGroupId(0x892F2085)
    if (txb.setExpiryHeight) txb.setExpiryHeight(0)

    // Add inputs
    for (const u of selected) {
      txb.addInput(u.txid, u.vout)
    }

    // Outputs
    txb.addOutput(to, amountSat)
    if (change > 546) { // dust threshold
      txb.addOutput(changeAddress, change)
    }

    // Sign each input
    const keyPair = utxolib.ECPair
      ? utxolib.ECPair.fromWIF(privateKeyWIF, network)
      : utxolib.default?.ECPair?.fromWIF(privateKeyWIF, network)

    if (!keyPair) throw new Error('Could not create key pair from WIF')

    for (let i = 0; i < selected.length; i++) {
      txb.sign(i, keyPair, null, utxolib.Transaction?.SIGHASH_ALL ?? 1, selected[i].value)
    }

    const tx = txb.build()
    const hex = tx.toHex()
    res.json({ hex })
  } catch (err) {
    console.error('Sign error:', err)
    res.status(500).json({ error: err.message })
  }
})

export default router
