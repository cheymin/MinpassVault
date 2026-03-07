import CryptoJS from 'crypto-js'

const PBKDF2_ITERATIONS = 100000
const KEY_SIZE = 256 / 32
const SALT_SIZE = 128 / 8
const IV_SIZE = 128 / 8

export function generateSalt(): string {
  const salt = CryptoJS.lib.WordArray.random(SALT_SIZE)
  return salt.toString(CryptoJS.enc.Base64)
}

export function deriveKey(password: string, salt: string): CryptoJS.lib.WordArray {
  const saltWordArray = CryptoJS.enc.Base64.parse(salt)
  const key = CryptoJS.PBKDF2(password, saltWordArray, {
    keySize: KEY_SIZE,
    iterations: PBKDF2_ITERATIONS,
    hasher: CryptoJS.algo.SHA256,
  })
  return key
}

export function encrypt(data: string, key: CryptoJS.lib.WordArray): string {
  const iv = CryptoJS.lib.WordArray.random(IV_SIZE)
  const encrypted = CryptoJS.AES.encrypt(data, key, {
    iv: iv,
    mode: CryptoJS.mode.CBC,
    padding: CryptoJS.pad.Pkcs7,
  })
  const combined = iv.concat(encrypted.ciphertext)
  return combined.toString(CryptoJS.enc.Base64)
}

export function decrypt(encryptedData: string, key: CryptoJS.lib.WordArray): string {
  try {
    const combined = CryptoJS.enc.Base64.parse(encryptedData)
    const iv = CryptoJS.lib.WordArray.create(combined.words.slice(0, IV_SIZE / 4), IV_SIZE)
    const ciphertext = CryptoJS.lib.WordArray.create(
      combined.words.slice(IV_SIZE / 4),
      combined.sigBytes - IV_SIZE
    )
    const decrypted = CryptoJS.AES.decrypt(
      { ciphertext: ciphertext } as CryptoJS.lib.CipherParams,
      key,
      {
        iv: iv,
        mode: CryptoJS.mode.CBC,
        padding: CryptoJS.pad.Pkcs7,
      }
    )
    return decrypted.toString(CryptoJS.enc.Utf8)
  } catch {
    throw new Error('Decryption failed')
  }
}

export function hashPassword(password: string): string {
  return CryptoJS.SHA256(password).toString(CryptoJS.enc.Base64)
}

export function generateMasterKey(): string {
  const key = CryptoJS.lib.WordArray.random(32)
  return key.toString(CryptoJS.enc.Base64)
}

export function encryptMasterKey(masterKey: string, derivedKey: CryptoJS.lib.WordArray): string {
  return encrypt(masterKey, derivedKey)
}

export function decryptMasterKey(
  encryptedMasterKey: string,
  derivedKey: CryptoJS.lib.WordArray
): string {
  return decrypt(encryptedMasterKey, derivedKey)
}

export function encryptVaultData(data: object, masterKey: string): string {
  const key = CryptoJS.enc.Base64.parse(masterKey)
  return encrypt(JSON.stringify(data), key)
}

export function decryptVaultData<T>(encryptedData: string, masterKey: string): T {
  const key = CryptoJS.enc.Base64.parse(masterKey)
  const decrypted = decrypt(encryptedData, key)
  return JSON.parse(decrypted) as T
}

export function generateRandomPassword(
  length: number = 16,
  options: {
    uppercase?: boolean
    lowercase?: boolean
    numbers?: boolean
    symbols?: boolean
  } = {}
): string {
  const {
    uppercase = true,
    lowercase = true,
    numbers = true,
    symbols = true,
  } = options

  let chars = ''
  if (uppercase) chars += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
  if (lowercase) chars += 'abcdefghijklmnopqrstuvwxyz'
  if (numbers) chars += '0123456789'
  if (symbols) chars += '!@#$%^&*()_+-=[]{}|;:,.<>?'

  if (chars.length === 0) {
    chars = 'abcdefghijklmnopqrstuvwxyz'
  }

  let password = ''
  const randomValues = new Uint32Array(length)
  crypto.getRandomValues(randomValues)
  
  for (let i = 0; i < length; i++) {
    password += chars[randomValues[i] % chars.length]
  }

  return password
}

export function calculatePasswordStrength(password: string): {
  score: number
  label: string
  color: string
} {
  let score = 0
  
  if (password.length >= 8) score += 1
  if (password.length >= 12) score += 1
  if (password.length >= 16) score += 1
  if (/[a-z]/.test(password)) score += 1
  if (/[A-Z]/.test(password)) score += 1
  if (/[0-9]/.test(password)) score += 1
  if (/[^a-zA-Z0-9]/.test(password)) score += 1

  if (score <= 2) {
    return { score, label: '弱', color: 'text-danger' }
  } else if (score <= 4) {
    return { score, label: '一般', color: 'text-warning' }
  } else if (score <= 5) {
    return { score, label: '良好', color: 'text-primaryLight' }
  } else {
    return { score, label: '强', color: 'text-success' }
  }
}
