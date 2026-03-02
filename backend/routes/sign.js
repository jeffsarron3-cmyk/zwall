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

    if (!networks) {
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

    // createTransactionBuilderForNetwork produces ZcashTransactionBuilder with
    // overwintered=1 and versionGroupId=0x892F2085 (Sapling) — required by the node.
    // new TransactionBuilder(network) produces plain Bitcoin format and gets rejected.
    const createTxBuilder = utxolib.bitgo?.createTransactionBuilderForNetwork
      ?? utxolib.default?.bitgo?.createTransactionBuilderForNetwork
    if (!createTxBuilder) throw new Error('createTransactionBuilderForNetwork not found in @bitgo/utxo-lib')
    const txb = createTxBuilder(network)
    // Current Zcash mainnet consensusBranchId.
    // The node reports the expected value in "old-consensus-branch-id" errors:
    //   NU5 (May 2022):  0x37519621
    //   NU6 (Nov 2024):  0xC8E71055
    //   Current:         0x4DEC4DF0  ← node said "Expected 4dec4df0"
    // Update this constant whenever a new network upgrade activates.
    if (txb.setConsensusBranchId) txb.setConsensusBranchId(0x4DEC4DF0)
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
    // ECPair.fromWIF validates network.pubKeyHash as UInt8, but Zcash uses 2-byte
    // version 7352. Zcash WIF byte (0x80) matches Bitcoin mainnet, so we create
    // the key pair against the bitcoin network to bypass the typeforce check.
    const ECPair = utxolib.ECPair ?? utxolib.default?.ECPair
    if (!ECPair) throw new Error('Could not find ECPair in @bitgo/utxo-lib')
    const keyPair = ECPair.fromWIF(privateKeyWIF, networks.bitcoin)

    const SIGHASH_ALL = utxolib.Transaction?.SIGHASH_ALL ?? 1
    // TxbSignArg (new API) fails for Zcash P2PKH because bitcoinjs-lib rejects the
    // 2-byte version prefix (0x1CB8). Positional args are the only working path.
    // Suppress the deprecation warning for this known incompatibility.
    const _warn = console.warn
    console.warn = () => {}
    for (let i = 0; i < selected.length; i++) {
      txb.sign(i, keyPair, null, SIGHASH_ALL, selected[i].value)
    }
    console.warn = _warn

    const tx = txb.build()
    const hex = tx.toHex()
    res.json({ hex })
  } catch (err) {
    console.error('Sign error:', err)
    res.status(500).json({ error: err.message })
  }
})

export default router
