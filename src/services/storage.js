// AES-GCM encrypted wallet storage using Web Crypto API
// Password → PBKDF2 → AES-256-GCM key
// Encrypted blob stored in localStorage as base64

const STORAGE_KEY = 'zodl_wallet'
const SALT_KEY = 'zodl_salt'
const ITERATIONS = 200_000

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
  const enc = new TextEncoder()
  const salt = crypto.getRandomValues(new Uint8Array(16))
  const iv = crypto.getRandomValues(new Uint8Array(12))
  const key = await deriveKey(password, salt)
  const plaintext = enc.encode(JSON.stringify(walletData))
  const ciphertext = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, plaintext)

  const payload = {
    salt: bufToB64(salt.buffer),
    iv: bufToB64(iv.buffer),
    data: bufToB64(ciphertext),
    version: 1,
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(payload))
}

export async function loadWallet(password) {
  const raw = localStorage.getItem(STORAGE_KEY)
  if (!raw) throw new Error('No wallet found')

  const { salt, iv, data } = JSON.parse(raw)
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
  localStorage.removeItem(SALT_KEY)
}
