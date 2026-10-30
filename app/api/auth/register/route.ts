import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { getAdmin } from '@/lib/supabaseAdmin'
import { clientIp, hit } from '@/lib/rateLimit'

export const dynamic = 'force-dynamic'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const BCRYPT_COST = 12 // each +1 doubles the work; 12 is a sensible 2026 default

// POST /api/auth/register  { name, email, password }
// Self-registration always creates a 'student'. Staff/admin accounts are created
// out-of-band (scripts/seed-users.mjs) so nobody can grant themselves a role.
export async function POST(req: NextRequest) {
  const rl = hit(`register:${clientIp(req)}`, 10, 60 * 60 * 1000)
  if (!rl.allowed) {
    return NextResponse.json({ error: 'Too many sign-ups from this address. Try again later.' }, { status: 429, headers: { 'Retry-After': String(rl.retryAfterSec) } })
  }

  const body = await req.json().catch(() => null)
  const name = String(body?.name ?? '').trim()
  const email = String(body?.email ?? '').trim().toLowerCase()
  const password = String(body?.password ?? '')

  if (!name || name.length > 80) return NextResponse.json({ error: 'Name is required (max 80 characters)' }, { status: 400 })
  if (!EMAIL_RE.test(email) || email.length > 120) return NextResponse.json({ error: 'A valid email is required' }, { status: 400 })
  if (password.length < 10 || password.length > 72 || !/[A-Za-z]/.test(password) || !/\d/.test(password)) {
    // bcrypt only uses the first 72 bytes, so longer passwords are rejected rather than silently truncated
    return NextResponse.json({ error: 'Password must be 10-72 characters and include a letter and a digit' }, { status: 400 })
  }

  const password_hash = await bcrypt.hash(password, BCRYPT_COST) // salt is generated and embedded in the hash
  const { error } = await getAdmin().from('users').insert({ name, email, password_hash, role: 'student' })

  if (error) {
    if (error.code === '23505') return NextResponse.json({ error: 'An account with this email already exists' }, { status: 409 })
    return NextResponse.json({ error: 'Could not create the account' }, { status: 500 })
  }
  return NextResponse.json({ message: 'Account created. Sign in to set up your authenticator app.' }, { status: 201 })
}
