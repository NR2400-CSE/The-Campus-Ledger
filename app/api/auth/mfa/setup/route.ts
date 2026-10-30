import { NextRequest, NextResponse } from 'next/server'
import { getAdmin } from '@/lib/supabaseAdmin'
import { requireAuth } from '@/lib/auth'
import { enrolment, newSecret } from '@/lib/totp'

export const dynamic = 'force-dynamic'

// POST /api/auth/mfa/setup   (Authorization: Bearer <mfaToken>)
// First-time enrolment: creates a TOTP secret and returns the QR code to scan.
export async function POST(req: NextRequest) {
  const guard = await requireAuth(req, { purpose: 'mfa' })
  if (!guard.ok) return guard.res

  const db = getAdmin()
  const { data: user } = await db.from('users').select('mfa_enabled').eq('id', guard.claims.sub).single()
  if (!user) return NextResponse.json({ error: 'Account not found' }, { status: 404 })
  if (user.mfa_enabled) {
    // Re-enrolling would let someone who only knows the password replace the authenticator.
    return NextResponse.json({ error: 'MFA is already enabled for this account' }, { status: 409 })
  }

  const secret = newSecret()
  const { error } = await db.from('users').update({ mfa_secret: secret }).eq('id', guard.claims.sub)
  if (error) return NextResponse.json({ error: 'Could not start MFA setup' }, { status: 500 })

  const { otpauthUri, qrDataUrl } = await enrolment(secret, guard.claims.email)
  return NextResponse.json({ qrDataUrl, otpauthUri, manualKey: secret })
}
