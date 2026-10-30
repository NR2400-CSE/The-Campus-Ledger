import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { getAdmin } from '@/lib/supabaseAdmin'
import { signToken } from '@/lib/auth'
import { clientIp, hit, reset } from '@/lib/rateLimit'

export const dynamic = 'force-dynamic'

// Hash of a throw-away value, compared against when the email is unknown so that
// "no such user" and "wrong password" take the same time (no user enumeration).
let dummyHash: Promise<string> | null = null
const getDummyHash = () => (dummyHash ??= bcrypt.hash('not-a-real-password', 12))

// POST /api/auth/login  { email, password }
// Step 1 of 2. Success returns a short-lived MFA token, NOT an access token.
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null)
  const email = String(body?.email ?? '').trim().toLowerCase()
  const password = String(body?.password ?? '')
  if (!email || !password) return NextResponse.json({ error: 'Email and password are required' }, { status: 400 })

  const key = `login:${clientIp(req)}:${email}`
  const rl = hit(key, 5, 15 * 60 * 1000)
  if (!rl.allowed) {
    return NextResponse.json({ error: 'Too many failed attempts. Try again later.' }, { status: 429, headers: { 'Retry-After': String(rl.retryAfterSec) } })
  }

  const { data: user } = await getAdmin()
    .from('users')
    .select('id, email, role, password_hash, mfa_enabled')
    .eq('email', email)
    .maybeSingle()

  const stored = user?.password_hash?.startsWith('$2') ? user.password_hash : await getDummyHash()
  const ok = await bcrypt.compare(password, stored)
  if (!user || !ok) return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 })

  reset(key)
  const mfaToken = await signToken({ sub: user.id, email: user.email, role: user.role }, 'mfa', '5m')
  return NextResponse.json({
    mfaToken,
    mfaEnabled: user.mfa_enabled, // false -> client must run /mfa/setup first
  })
}
