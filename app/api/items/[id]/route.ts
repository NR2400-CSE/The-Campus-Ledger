import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabaseClient'

interface Params {
  params: { id: string }
}

// GET /api/items/:id
export async function GET(_req: NextRequest, { params }: Params) {
  const { data, error } = await supabase.from('items').select('*').eq('id', params.id).single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 404 })
  }
  return NextResponse.json({ item: data }, { status: 200 })
}

// PUT /api/items/:id
// body: any subset of { title, description, category, location, contact, status }
export async function PUT(req: NextRequest, { params }: Params) {
  const body = await req.json()
  const allowedFields = ['title', 'description', 'category', 'location', 'contact', 'status']
  const updates: Record<string, unknown> = {}

  for (const field of allowedFields) {
    if (field in body) updates[field] = body[field]
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: 'No valid fields provided to update' }, { status: 400 })
  }
  if (updates.status && updates.status !== 'open' && updates.status !== 'claimed') {
    return NextResponse.json({ error: "status must be 'open' or 'claimed'" }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('items')
    .update(updates)
    .eq('id', params.id)
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  return NextResponse.json({ item: data }, { status: 200 })
}

// DELETE /api/items/:id
export async function DELETE(_req: NextRequest, { params }: Params) {
  const { error } = await supabase.from('items').delete().eq('id', params.id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  return NextResponse.json({ message: 'Item deleted' }, { status: 200 })
}
