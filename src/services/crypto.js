import * as bip39 from 'bip39'
import { HDKey } from '@scure/bip32'

// ─── Mnemonic helpers ──────────────────────────────────────────────────────

export function generateMnemonic() {
  return bip39.generateMnemonic(256) // 24 words
}

export function validateMnemonic(words) {
  const phrase = Array.isArray(words) ? words.join(' ') : words
  return bip39.validateMnemonic(phrase.trim())
}

export function validateWord(word) {
  return bip39.wordlists.english.includes(word.toLowerCase().trim())
}

// ─── Pure-JS SHA-256 ───────────────────────────────────────────────────────

function sha256(data) {
  const K = [
    0x428a2f98,0x71374491,0xb5c0fbcf,0xe9b5dba5,0x3956c25b,0x59f111f1,0x923f82a4,0xab1c5ed5,
    0xd807aa98,0x12835b01,0x243185be,0x550c7dc3,0x72be5d74,0x80deb1fe,0x9bdc06a7,0xc19bf174,
    0xe49b69c1,0xefbe4786,0x0fc19dc6,0x240ca1cc,0x2de92c6f,0x4a7484aa,0x5cb0a9dc,0x76f988da,
    0x983e5152,0xa831c66d,0xb00327c8,0xbf597fc7,0xc6e00bf3,0xd5a79147,0x06ca6351,0x14292967,
    0x27b70a85,0x2e1b2138,0x4d2c6dfc,0x53380d13,0x650a7354,0x766a0abb,0x81c2c92e,0x92722c85,
    0xa2bfe8a1,0xa81a664b,0xc24b8b70,0xc76c51a3,0xd192e819,0xd6990624,0xf40e3585,0x106aa070,
    0x19a4c116,0x1e376c08,0x2748774c,0x34b0bcb5,0x391c0cb3,0x4ed8aa4a,0x5b9cca4f,0x682e6ff3,
    0x748f82ee,0x78a5636f,0x84c87814,0x8cc70208,0x90befffa,0xa4506ceb,0xbef9a3f7,0xc67178f2,
  ]
  let h0=0x6a09e667,h1=0xbb67ae85,h2=0x3c6ef372,h3=0xa54ff53a,h4=0x510e527f,h5=0x9b05688c,h6=0x1f83d9ab,h7=0x5be0cd19
  const bytes = data instanceof Uint8Array ? data : new Uint8Array(data)
  const totalLen = bytes.length + 9 + (63 - (bytes.length + 8) % 64)
  const msg = new Uint8Array(totalLen)
  msg.set(bytes)
  msg[bytes.length] = 0x80
  const bitLen = bytes.length * 8
  const dv = new DataView(msg.buffer)
  dv.setUint32(msg.length - 4, bitLen >>> 0, false)
  dv.setUint32(msg.length - 8, Math.floor(bitLen / 0x100000000), false)
  const w = new Uint32Array(64)
  const ror = (v,n) => ((v>>>n)|(v<<(32-n)))>>>0
  for (let i=0;i<msg.length;i+=64){
    const c=new DataView(msg.buffer,i,64)
    for(let j=0;j<16;j++) w[j]=c.getUint32(j*4,false)
    for(let j=16;j<64;j++){
      const s0=ror(w[j-15],7)^ror(w[j-15],18)^(w[j-15]>>>3)
      const s1=ror(w[j-2],17)^ror(w[j-2],19)^(w[j-2]>>>10)
      w[j]=(w[j-16]+s0+w[j-7]+s1)>>>0
    }
    let a=h0,b=h1,c2=h2,d=h3,e=h4,f=h5,g=h6,hh=h7
    for(let j=0;j<64;j++){
      const S1=ror(e,6)^ror(e,11)^ror(e,25)
      const ch=(e&f)^(~e&g)
      const t1=(hh+S1+ch+K[j]+w[j])>>>0
      const S0=ror(a,2)^ror(a,13)^ror(a,22)
      const maj=(a&b)^(a&c2)^(b&c2)
      const t2=(S0+maj)>>>0
      hh=g;g=f;f=e;e=(d+t1)>>>0;d=c2;c2=b;b=a;a=(t1+t2)>>>0
    }
    h0=(h0+a)>>>0;h1=(h1+b)>>>0;h2=(h2+c2)>>>0;h3=(h3+d)>>>0
    h4=(h4+e)>>>0;h5=(h5+f)>>>0;h6=(h6+g)>>>0;h7=(h7+hh)>>>0
  }
  const out=new Uint8Array(32),ov=new DataView(out.buffer)
  ;[h0,h1,h2,h3,h4,h5,h6,h7].forEach((v,i)=>ov.setUint32(i*4,v,false))
  return out
}

// ─── Pure-JS RIPEMD-160 ────────────────────────────────────────────────────

function ripemd160(data) {
  const bytes = data instanceof Uint8Array ? data : new Uint8Array(data)
  const KL=[0x00000000,0x5A827999,0x6ED9EBA1,0x8F1BBCDC,0xA953FD4E]
  const KR=[0x50A28BE6,0x5C4DD124,0x6D703EF3,0x7A6D76E9,0x00000000]
  const RL=[0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,7,4,13,1,10,6,15,3,12,0,9,5,2,14,11,8,3,10,14,4,9,15,8,1,2,7,0,6,13,11,5,12,1,9,11,10,0,8,12,4,13,3,7,15,14,5,6,2,4,0,5,9,7,12,2,10,14,1,3,8,11,6,15,13]
  const RR=[5,14,7,0,9,2,11,4,13,6,15,8,1,10,3,12,6,11,3,7,0,13,5,10,14,15,8,12,4,9,1,2,15,5,1,3,7,14,6,9,11,8,12,2,10,0,4,13,8,6,4,1,3,11,15,0,5,12,2,13,9,7,10,14,12,15,10,4,1,5,8,7,6,2,13,14,0,3,9,11]
  const SL=[11,14,15,12,5,8,7,9,11,13,14,15,6,7,9,8,7,6,8,13,11,9,7,15,7,12,15,9,11,7,13,12,11,13,6,7,14,9,13,15,14,8,13,6,5,12,7,5,11,12,14,15,14,15,9,8,9,14,5,6,8,6,5,12,9,15,5,11,6,8,13,12,5,12,13,14,11,8,5,6]
  const SR=[8,9,9,11,13,15,15,5,7,7,8,11,14,14,12,6,9,13,15,7,12,8,9,11,7,7,12,7,6,15,13,11,9,7,15,11,8,6,6,14,12,13,5,14,13,13,7,5,15,5,8,11,14,14,6,14,6,9,12,9,12,5,15,8,8,5,12,9,12,5,14,6,8,13,6,5,15,13,11,11]
  const rol=(x,n)=>((x<<n)|(x>>>(32-n)))>>>0
  const fl=(j,x,y,z)=>{
    if(j<16)return(x^y^z)>>>0
    if(j<32)return((x&y)|(~x&z))>>>0
    if(j<48)return((x|~y)^z)>>>0
    if(j<64)return((x&z)|(y&~z))>>>0
    return(x^(y|~z))>>>0
  }
  const msgLen=bytes.length
  const padLen=msgLen%64<56?56-(msgLen%64):120-(msgLen%64)
  const msg=new Uint8Array(msgLen+padLen+8)
  msg.set(bytes);msg[msgLen]=0x80
  const dv=new DataView(msg.buffer)
  dv.setUint32(msg.length-8,(msgLen*8)>>>0,true)
  dv.setUint32(msg.length-4,Math.floor(msgLen*8/0x100000000),true)
  let h0=0x67452301,h1=0xEFCDAB89,h2=0x98BADCFE,h3=0x10325476,h4=0xC3D2E1F0
  for(let i=0;i<msg.length;i+=64){
    const X=new Uint32Array(16)
    const c=new DataView(msg.buffer,i,64)
    for(let j=0;j<16;j++) X[j]=c.getUint32(j*4,true)
    let al=h0,bl=h1,cl=h2,dl=h3,el=h4,ar=h0,br=h1,cr=h2,dr=h3,er=h4
    for(let j=0;j<80;j++){
      const rnd=Math.floor(j/16)
      let T=(al+fl(j,bl,cl,dl)+X[RL[j]]+KL[rnd])>>>0
      T=(rol(T,SL[j])+el)>>>0;al=el;el=dl;dl=rol(cl,10);cl=bl;bl=T
      T=(ar+fl(79-j,br,cr,dr)+X[RR[j]]+KR[rnd])>>>0
      T=(rol(T,SR[j])+er)>>>0;ar=er;er=dr;dr=rol(cr,10);cr=br;br=T
    }
    const T=(h1+cl+dr)>>>0;h1=(h2+dl+er)>>>0;h2=(h3+el+ar)>>>0
    h3=(h4+al+br)>>>0;h4=(h0+bl+cr)>>>0;h0=T
  }
  const out=new Uint8Array(20),ov=new DataView(out.buffer)
  ov.setUint32(0,h0,true);ov.setUint32(4,h1,true);ov.setUint32(8,h2,true)
  ov.setUint32(12,h3,true);ov.setUint32(16,h4,true)
  return out
}

// ─── Address generation ────────────────────────────────────────────────────

const B58 = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz'

function base58Encode(bytes) {
  let n = 0n
  for (const b of bytes) n = n * 256n + BigInt(b)
  let r = ''
  while (n > 0n) { r = B58[Number(n % 58n)] + r; n /= 58n }
  for (const b of bytes) { if (b !== 0) break; r = '1' + r }
  return r
}

function pubkeyToZcashAddress(pubkey) {
  // Zcash mainnet P2PKH version: [0x1C, 0xB8]
  const h160 = ripemd160(sha256(pubkey))
  const payload = new Uint8Array(22)
  payload[0] = 0x1C; payload[1] = 0xB8
  payload.set(h160, 2)
  const check = sha256(sha256(payload)).slice(0, 4)
  const full = new Uint8Array(26)
  full.set(payload); full.set(check, 22)
  return base58Encode(full)
}

// ─── HD Wallet derivation ──────────────────────────────────────────────────
// BIP44 path: m/44'/133'/0'/0/index  (coin type 133 = Zcash)

export function deriveWallet(mnemonic, accountIndex = 0) {
  const phrase = Array.isArray(mnemonic) ? mnemonic.join(' ') : mnemonic
  const seed = bip39.mnemonicToSeedSync(phrase.trim())
  const root = HDKey.fromMasterSeed(seed)
  const child = root.derive(`m/44'/133'/0'/0/${accountIndex}`)
  if (!child.publicKey || !child.privateKey) throw new Error('Key derivation failed')
  const address = pubkeyToZcashAddress(child.publicKey)
  // Encode private key as WIF (Zcash mainnet: version byte 0x80)
  const wifPayload = new Uint8Array(34)
  wifPayload[0] = 0x80
  wifPayload.set(child.privateKey, 1)
  wifPayload[33] = 0x01 // compressed flag
  const wifCheck = sha256(sha256(wifPayload)).slice(0, 4)
  const wifFull = new Uint8Array(38)
  wifFull.set(wifPayload); wifFull.set(wifCheck, 34)
  const privateKeyWIF = base58Encode(wifFull)
  return {
    address,
    privateKeyWIF,
    privateKeyHex: Array.from(child.privateKey).map(b => b.toString(16).padStart(2, '0')).join(''),
    publicKeyHex: Array.from(child.publicKey).map(b => b.toString(16).padStart(2, '0')).join(''),
    path: `m/44'/133'/0'/0/${accountIndex}`,
  }
}
