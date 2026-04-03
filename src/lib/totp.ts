import * as OTPAuth from 'otpauth'

export function generateTOTPSecret(email: string): { secret: string; uri: string } {
  const secret = OTPAuth.Secret.fromBase32(generateRandomBase32())
  
  const totp = new OTPAuth.TOTP({
    issuer: 'SecureVault',
    label: email,
    algorithm: 'SHA1',
    digits: 6,
    period: 30,
    secret: secret,
  })

  return {
    secret: secret.base32,
    uri: totp.toString(),
  }
}

export function verifyTOTP(secret: string, token: string): boolean {
  try {
    const totp = new OTPAuth.TOTP({
      algorithm: 'SHA1',
      digits: 6,
      period: 30,
      secret: OTPAuth.Secret.fromBase32(secret),
    })

    const delta = totp.validate({
      token: token,
      window: 1,
    })

    return delta !== null
  } catch {
    return false
  }
}

export function generateTOTPCode(secret: string): string {
  const totp = new OTPAuth.TOTP({
    algorithm: 'SHA1',
    digits: 6,
    period: 30,
    secret: OTPAuth.Secret.fromBase32(secret),
  })
  return totp.generate()
}

function generateRandomBase32(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567'
  let result = ''
  const randomValues = new Uint32Array(16)
  crypto.getRandomValues(randomValues)
  
  for (let i = 0; i < 16; i++) {
    result += chars[randomValues[i] % chars.length]
  }
  
  return result
}
