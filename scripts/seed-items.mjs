// Fills the ledger with sample entries so the load test has realistic payloads.
//   node --env-file=.env.local scripts/seed-items.mjs 1000     # add 1000 entries
//   node --env-file=.env.local scripts/seed-items.mjs --clean  # remove them again
import { createClient } from '@supabase/supabase-js'

const db = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } })

if (process.argv.includes('--clean')) {
  const { error } = await db.from('items').delete().like('title', 'LOADTEST %')
  console.log(error ? error.message : 'Removed all LOADTEST entries.')
  process.exit(0)
}

const n = parseInt(process.argv[2] || '1000', 10)
const things = ['Black wallet', 'Water bottle', 'Blue umbrella', 'ID card', 'AirPods case', 'Calculator', 'Keys with red tag', 'Laptop charger']
const places = ['Library', 'Anna Auditorium', 'Food court', 'Gym', 'Block C', 'Main gate', 'Hostel B lobby', 'Fest ground']
const cats = ['ID Card', 'Electronics', 'Bag / Bottle', 'Books & Stationery', 'Apparel', 'Keys', 'Other']

const rows = Array.from({ length: n }, (_, i) => ({
  type: i % 2 ? 'lost' : 'found',
  title: `LOADTEST ${things[i % things.length]} #${i}`,
  description: 'Sample entry used for load testing the ledger. Distinguishing marks: scratch on the left corner, sticker on the back.',
  category: cats[i % cats.length],
  location: places[i % places.length],
  contact: `loadtest${i}@vitstudent.ac.in`,
  status: 'open',
}))

for (let i = 0; i < rows.length; i += 500) {
  const { error } = await db.from('items').insert(rows.slice(i, i + 500))
  if (error) { console.error(error.message); process.exit(1) }
}
console.log(`Inserted ${n} LOADTEST entries.`)
