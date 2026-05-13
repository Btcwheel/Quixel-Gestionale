// AES-GCM encryption using Web Crypto API (Node.js native)
// Key is derived from VAULT_SECRET env var via PBKDF2

const SALT = 'quixel-vault-v1'

async function getKey(): Promise<CryptoKey> {
  const secret = process.env.VAULT_SECRET
  if (!secret) throw new Error('VAULT_SECRET non configurato')

  const enc = new TextEncoder()
  const keyMaterial = await crypto.subtle.importKey(
    'raw', enc.encode(secret), 'PBKDF2', false, ['deriveKey']
  )
  return crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt: enc.encode(SALT), iterations: 100_000, hash: 'SHA-256' },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  )
}

export async function encrypt(plaintext: string): Promise<string> {
  const key = await getKey()
  const iv = crypto.getRandomValues(new Uint8Array(12))
  const enc = new TextEncoder()
  const ciphertext = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, enc.encode(plaintext))
  const combined = new Uint8Array(iv.byteLength + ciphertext.byteLength)
  combined.set(iv, 0)
  combined.set(new Uint8Array(ciphertext), iv.byteLength)
  return Buffer.from(combined).toString('base64')
}

export async function decrypt(encoded: string): Promise<string> {
  const key = await getKey()
  const combined = Buffer.from(encoded, 'base64')
  const iv = combined.subarray(0, 12)
  const ciphertext = combined.subarray(12)
  const plaintext = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, ciphertext)
  return new TextDecoder().decode(plaintext)
}
