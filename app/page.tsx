'use client'

import { useEffect, useState, FormEvent } from 'react'
import type { LostFoundItem, ItemType } from '@/lib/supabaseClient'

const CATEGORIES = ['ID Card', 'Electronics', 'Bag / Bottle', 'Books & Stationery', 'Apparel', 'Keys', 'Other']

type Filter = 'all' | ItemType

export default function Home() {
  const [items, setItems] = useState<LostFoundItem[]>([])
  const [filter, setFilter] = useState<Filter>('all')
  const [loading, setLoading] = useState(true)
  const [formOpen, setFormOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  const fetchItems = async (f: Filter) => {
    setLoading(true)
    const qs = f === 'all' ? '' : `?type=${f}`
    const res = await fetch(`/api/items${qs}`, { cache: 'no-store' })
    const data = await res.json()
    if (res.ok) setItems(data.items)
    setLoading(false)
  }

  useEffect(() => {
    fetchItems(filter)
  }, [filter])

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setErrorMsg('')
    setSubmitting(true)
    const formEl = e.currentTarget
    const formData = new FormData(formEl)
    const payload = {
      type: formData.get('type'),
      title: formData.get('title'),
      description: formData.get('description'),
      category: formData.get('category'),
      location: formData.get('location'),
      contact: formData.get('contact'),
    }
    const res = await fetch('/api/items', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    const data = await res.json()
    setSubmitting(false)
    if (!res.ok) {
      setErrorMsg(data.error || 'Could not file the entry.')
      return
    }
    formEl.reset()
    setFormOpen(false)
    fetchItems(filter)
  }

  const markClaimed = async (id: string) => {
    await fetch(`/api/items/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'claimed' }),
    })
    fetchItems(filter)
  }

  const deleteItem = async (id: string) => {
    await fetch(`/api/items/${id}`, { method: 'DELETE' })
    fetchItems(filter)
  }

  return (
    <main className="max-w-5xl mx-auto px-6 py-14">
      <header className="mb-10 border-b border-ledger-line pb-6 flex items-end justify-between gap-6 flex-wrap">
        <div>
          {/* <p className="font-display text-xs tracking-[0.3em] text-ledger-amber uppercase mb-2">
            Entry Registry · Est. Sem 3
          </p> */}
          <h1 className="font-display text-3xl sm:text-4xl leading-tight">
            The Campus Ledger
          </h1>
          {/* <p className="text-ledger-paper/60 mt-2 max-w-md text-sm">
            Every lost item and every found item, logged in one place, until it's claimed.
          </p> */}
        </div>
        <button
          onClick={() => setFormOpen((v) => !v)}
          className="font-display text-sm uppercase tracking-wide bg-ledger-amber text-ledger-bg px-5 py-3 hover:bg-ledger-paper transition-colors"
        >
          {formOpen ? 'Close form' : 'File an entry'}
        </button>
      </header>

      {formOpen && (
        <form
          onSubmit={handleSubmit}
          className="paper-card relative mb-12 p-6 sm:p-8 grid gap-4 sm:grid-cols-2 shadow-xl"
        >
          <div className="sm:col-span-2 flex gap-6 font-display text-sm uppercase tracking-wide">
            <label className="flex items-center gap-2">
              <input type="radio" name="type" value="lost" defaultChecked required /> Lost
            </label>
            <label className="flex items-center gap-2">
              <input type="radio" name="type" value="found" required /> Found
            </label>
          </div>

          <input name="title" required placeholder="Item title (e.g. Black wallet)" className="border border-ledger-line/40 bg-white/70 px-3 py-2 sm:col-span-2" />
          <textarea name="description" required placeholder="Description — colour, marks, brand..." rows={3} className="border border-ledger-line/40 bg-white/70 px-3 py-2 sm:col-span-2" />

          <select name="category" required className="border border-ledger-line/40 bg-white/70 px-3 py-2">
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
          <input name="location" required placeholder="Location (e.g. Library, Block C)" className="border border-ledger-line/40 bg-white/70 px-3 py-2" />
          <input name="contact" required placeholder="Contact (email or phone)" className="border border-ledger-line/40 bg-white/70 px-3 py-2 sm:col-span-2" />

          {errorMsg && <p className="text-ledger-rust text-sm sm:col-span-2">{errorMsg}</p>}

          <button
            type="submit"
            disabled={submitting}
            className="sm:col-span-2 justify-self-start font-display text-sm uppercase tracking-wide bg-ledger-bg text-ledger-paper px-5 py-2.5 disabled:opacity-50"
          >
            {submitting ? 'Filing…' : 'Submit to ledger'}
          </button>
        </form>
      )}

      <div className="flex gap-2 mb-8 font-display text-xs uppercase tracking-wide">
        {(['all', 'lost', 'found'] as Filter[]).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 border ${
              filter === f
                ? 'bg-ledger-amber text-ledger-bg border-ledger-amber'
                : 'border-ledger-line text-ledger-paper/70'
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="text-ledger-paper/50">Retrieving the ledger…</p>
      ) : items.length === 0 ? (
        <p className="text-ledger-paper/50">No entries yet. Be the first to file one.</p>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2">
          {items.map((item) => (
            <li
              key={item.id}
              className="relative border border-ledger-line bg-ledger-panel p-5"
            >
              <div className="flex items-start justify-between gap-3 mb-2">
                <span
                  className={`font-display text-[11px] uppercase tracking-wider px-2 py-1 ${
                    item.type === 'lost' ? 'bg-ledger-rust/20 text-ledger-rust' : 'bg-ledger-moss/20 text-ledger-moss'
                  }`}
                >
                  {item.type}
                </span>
                <span className="font-display text-[11px] uppercase tracking-wider text-ledger-paper/40">
                  {item.status}
                </span>
              </div>
              <h3 className="font-display text-lg mb-1">{item.title}</h3>
              <p className="text-sm text-ledger-paper/70 mb-3">{item.description}</p>
              <dl className="text-xs text-ledger-paper/50 grid grid-cols-2 gap-y-1 mb-4">
                <dt>Category</dt><dd className="text-right">{item.category}</dd>
                <dt>Location</dt><dd className="text-right">{item.location}</dd>
                <dt>Contact</dt><dd className="text-right">{item.contact}</dd>
              </dl>
              <div className="flex gap-2">
                {item.status === 'open' && (
                  <button
                    onClick={() => markClaimed(item.id)}
                    className="font-display text-xs uppercase tracking-wide border border-ledger-amber text-ledger-amber px-3 py-1.5 hover:bg-ledger-amber hover:text-ledger-bg transition-colors"
                  >
                    Mark claimed
                  </button>
                )}
                <button
                  onClick={() => deleteItem(item.id)}
                  className="font-display text-xs uppercase tracking-wide border border-ledger-line text-ledger-paper/50 px-3 py-1.5 hover:border-ledger-rust hover:text-ledger-rust transition-colors"
                >
                  Delete
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </main>
  )
}
