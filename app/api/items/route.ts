import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabaseClient'

// GET /api/items
// GET /api/items?type=lost|found&status=open|claimed
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const type = searchParams.get('type')
  const status = searchParams.get('status')

  let query = supabase.from('items').select('*').order('created_at', { ascending: false })

  if (type) query = query.eq('type', type)
  if (status) query = query.eq('status', status)

  const { data, error } = await query

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  return NextResponse.json({ items: data }, { status: 200 })
}

// POST /api/items
// body: { type, title, description, category, location, contact }
export async function POST(req: NextRequest) {
  const body = await req.json()
  const { type, title, description, category, location, contact } = body

  if (!type || !title || !description || !category || !location || !contact) {
    return NextResponse.json(
      { error: 'type, title, description, category, location and contact are all required' },
      { status: 400 }
    )
  }
  if (type !== 'lost' && type !== 'found') {
    return NextResponse.json({ error: "type must be 'lost' or 'found'" }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('items')
    .insert([{ type, title, description, category, location, contact }])
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  return NextResponse.json({ item: data }, { status: 201 })
}
