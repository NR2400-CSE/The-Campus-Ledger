// Creates the demo accounts (one per role).
//   node --env-file=.env.local scripts/seed-users.mjs --plaintext   # "BEFORE" state for Q2(a)
//   node --env-file=.env.local scripts/seed-users.mjs               # directly bcrypt-hashed
// Needs Node >= 20.6 (for --env-file).
import { createClient } from '@supabase/supabase-js'
import bcrypt from 'bcryptjs'

const plaintext = process.argv.includes('--plaintext')
const db = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } })

const accounts = [
  { name: 'Demo Student',  email: 'student@vitstudent.ac.in', password: 'Student@12345',  role: 'student' },
  { name: 'Demo Security', email: 'security@vit.ac.in',       password: 'Security@12345', role: 'security_staff' },
  { name: 'Demo Admin',    email: 'admin@vit.ac.in',          password: 'Admin@12345',    role: 'admin' },
]

for (const a of accounts) {
  const password_hash = plaintext ? a.password : await bcrypt.hash(a.password, 12)
  const { error } = await db.from('users').upsert(
    { name: a.name, email: a.email, password_hash, role: a.role, mfa_secret: null, mfa_enabled: false },
    { onConflict: 'email' }
  )
  console.log(error ? `FAIL ${a.email}: ${error.message}` : `ok   ${a.role.padEnd(15)} ${a.email}  ${plaintext ? '(PLAINTEXT)' : '(bcrypt)'}`)
}
if (plaintext) console.log('\nNow screenshot Supabase -> Table Editor -> users (password_hash column shows the raw passwords).')
