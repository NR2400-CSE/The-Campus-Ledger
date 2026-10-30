import * as OTPAuth from 'otpauth'
import QRCode from 'qrcode'

// RFC 6238 TOTP: SHA-1, 6 digits, 30 s step - the profile Google/Microsoft Authenticator expect.
const ISSUER = 'The Campus Ledger'

function build(secretBase32: string, label: string) {
  return new OTPAuth.TOTP({
    issuer: ISSUER,
    label,
    algorithm: 'SHA1',
    digits: 6,
    period: 30,
    secret: OTPAuth.Secret.fromBase32(secretBase32),
  })
}

export function newSecret(): string {
  return new OTPAuth.Secret({ size: 20 }).base32
}

export async function enrolment(secretBase32: string, email: string) {
  const uri = build(secretBase32, email).toString()
  return { otpauthUri: uri, qrDataUrl: await QRCode.toDataURL(uri, { margin: 1, width: 240 }) }
}

/** Accepts the current code and one step either side (clock drift). */
export function verifyCode(secretBase32: string, code: string): boolean {
  if (!/^\d{6}$/.test(code)) return false
  return build(secretBase32, 'verify').validate({ token: code, window: 1 }) !== null
}
