import { NextRequest, NextResponse } from 'next/server'
import { getAdmin } from '@/lib/supabaseAdmin'
import { requireAuth, signToken } from '@/lib/auth'
import { verifyCode } from '@/lib/totp'
import { hit, reset } from '@/lib/rateLimit'

export const dynamic = 'force-dynamic'

// POST /api/auth/mfa/verify  { code }   (Authorization: Bearer <mfaToken>)
// Step 2 of 2. Valid code -> access token. Also completes first-time enrolment.
export async function POST(req: NextRequest) {
  const guard = await requireAuth(req, { purpose: 'mfa' })
  if (!guard.ok) return guard.res

  const key = `mfa:${guard.claims.sub}`
  const rl = hit(key, 5, 15 * 60 * 1000) // a 6-digit code must not be brute-forceable
  if (!rl.allowed) {
    return NextResponse.json({ error: 'Too many attempts. Sign in again later.' }, { status: 429, headers: { 'Retry-After': String(rl.retryAfterSec) } })
  }

  const body = await req.json().catch(() => null)
  const code = String(body?.code ?? '').trim()

  const db = getAdmin()
  const { data: user } = await db
    .from('users')
    .select('id, name, email, role, mfa_secret, mfa_enabled')
    .eq('id', guard.claims.sub)
    .single()
  if (!user || !user.mfa_secret) {
    return NextResponse.json({ error: 'Run MFA setup first' }, { status: 400 })
  }
  if (!verifyCode(user.mfa_secret, code)) {
    return NextResponse.json({ error: 'Invalid authenticator code' }, { status: 401 })
  }

  if (!user.mfa_enabled) await db.from('users').update({ mfa_enabled: true }).eq('id', user.id)

  reset(key)
  const token = await signToken({ sub: user.id, email: user.email, role: user.role }, 'access', '1h')
  return NextResponse.json({ token, user: { name: user.name, email: user.email, role: user.role } })
}
