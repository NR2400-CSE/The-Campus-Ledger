// One-off migration: replaces every plain-text password with a salted bcrypt hash.
//   node --env-file=.env.local scripts/hash-passwords.mjs
import { createClient } from '@supabase/supabase-js'
import bcrypt from 'bcryptjs'

const db = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } })
const { data: users, error } = await db.from('users').select('id, email, password_hash')
if (error) throw error

let migrated = 0
for (const u of users) {
  if (/^\$2[aby]\$/.test(u.password_hash)) continue // already a bcrypt hash
  const hash = await bcrypt.hash(u.password_hash, 12)
  const { error: e } = await db.from('users').update({ password_hash: hash }).eq('id', u.id)
  if (e) throw e
  migrated++
  console.log(`hashed ${u.email}`)
}
console.log(`\n${migrated} password(s) migrated, ${users.length - migrated} already hashed.`)
console.log('Now screenshot the users table again (AFTER).')
