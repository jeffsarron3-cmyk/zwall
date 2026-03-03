// Wallet storage with two modes:
// - Secure context (HTTPS/localhost): AES-GCM encryption via Web Crypto API
// - Insecure context (HTTP): plain JSON (crypto.subtle unavailable in browsers over HTTP)

const STORAGE_KEY = 'zodl_wallet'
const ITERATIONS = 200_000

const hasCrypto = () => typeof crypto !== 'undefined' && !!crypto.subtle

function bufToB64(buf) {
  return btoa(String.fromCharCode(...new Uint8Array(buf)))
}

function b64ToBuf(b64) {
  const bin = atob(b64)
  const buf = new Uint8Array(bin.length)
  for (let i = 0; i < bin.length; i++) buf[i] = bin.charCodeAt(i)
  return buf.buffer
}

async function deriveKey(password, salt) {
  const enc = new TextEncoder()
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    enc.encode(password),
    'PBKDF2',
    false,
    ['deriveKey']
  )
  return crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt, iterations: ITERATIONS, hash: 'SHA-256' },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  )
}

export function walletExists() {
  return !!localStorage.getItem(STORAGE_KEY)
}

export async function saveWallet(walletData, password) {
  if (!hasCrypto()) {
    // HTTP fallback: store as plain JSON
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ plain: true, data: walletData }))
    return
  }

  const enc = new TextEncoder()
  const salt = crypto.getRandomValues(new Uint8Array(16))
  const iv = crypto.getRandomValues(new Uint8Array(12))
  const key = await deriveKey(password, salt)
  const plaintext = enc.encode(JSON.stringify(walletData))
  const ciphertext = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, plaintext)

  localStorage.setItem(STORAGE_KEY, JSON.stringify({
    salt: bufToB64(salt.buffer),
    iv: bufToB64(iv.buffer),
    data: bufToB64(ciphertext),
    version: 1,
  }))
}

export async function loadWallet(password) {
  const raw = localStorage.getItem(STORAGE_KEY)
  if (!raw) throw new Error('No wallet found')

  const parsed = JSON.parse(raw)

  // Plain JSON fallback (HTTP or saved without encryption)
  if (parsed.plain) return parsed.data

  if (!hasCrypto()) throw new Error('Encryption not available — open the app over HTTPS')

  const { salt, iv, data } = parsed
  const key = await deriveKey(password, b64ToBuf(salt))

  let plaintext
  try {
    plaintext = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: b64ToBuf(iv) },
      key,
      b64ToBuf(data)
    )
  } catch {
    throw new Error('Wrong password')
  }

  return JSON.parse(new TextDecoder().decode(plaintext))
}

export function clearWallet() {
  localStorage.removeItem(STORAGE_KEY)
}
