import { SignJWT, jwtVerify } from 'jose'
import { NextRequest, NextResponse } from 'next/server'
import type { Role } from './types'

// Two kinds of signed token, kept apart by the `purpose` claim:
//   'mfa'    - issued after the password check, valid 5 min, only good for the MFA endpoints
//   'access' - issued after the TOTP code is verified, valid 1 h, accepted by the item APIs
export type TokenPurpose = 'mfa' | 'access'

export interface Claims {
  sub: string
  email: string
  role: Role
}

function secret(): Uint8Array {
  const s = process.env.JWT_SECRET
  if (!s || s.length < 32) {
    throw new Error('JWT_SECRET must be set to a random string of at least 32 characters')
  }
  return new TextEncoder().encode(s)
}

export async function signToken(claims: Claims, purpose: TokenPurpose, ttl: string): Promise<string> {
  return new SignJWT({ email: claims.email, role: claims.role, purpose })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(claims.sub)
    .setIssuedAt()
    .setExpirationTime(ttl)
    .sign(secret())
}

export async function verifyToken(token: string, purpose: TokenPurpose): Promise<Claims | null> {
  try {
    const { payload } = await jwtVerify(token, secret(), { algorithms: ['HS256'] })
    if (payload.purpose !== purpose || !payload.sub) return null
    return { sub: payload.sub, email: payload.email as string, role: payload.role as Role }
  } catch {
    return null // bad signature, expired, malformed -> treated as "no valid token"
  }
}

function bearer(req: NextRequest): string | null {
  const h = req.headers.get('authorization') || ''
  const m = /^Bearer\s+(.+)$/i.exec(h)
  return m ? m[1] : null
}

type Guard = { ok: true; claims: Claims } | { ok: false; res: NextResponse }

/**
 * Authentication + authorisation guard.
 *   no/invalid/expired token -> 401
 *   valid token, wrong role  -> 403
 */
export async function requireAuth(
  req: NextRequest,
  opts: { roles?: Role[]; purpose?: TokenPurpose } = {}
): Promise<Guard> {
  const token = bearer(req)
  const claims = token ? await verifyToken(token, opts.purpose ?? 'access') : null
  if (!claims) {
    return { ok: false, res: NextResponse.json({ error: 'Authentication required: missing or invalid token' }, { status: 401 }) }
  }
  if (opts.roles && !opts.roles.includes(claims.role)) {
    return { ok: false, res: NextResponse.json({ error: 'Forbidden: your role is not allowed to do this' }, { status: 403 }) }
  }
  return { ok: true, claims }
}

/** Returns claims if a valid access token is present, otherwise null (never rejects). */
export async function optionalAuth(req: NextRequest): Promise<Claims | null> {
  const token = bearer(req)
  return token ? verifyToken(token, 'access') : null
}

export const STAFF_ROLES: Role[] = ['security_staff', 'admin']
