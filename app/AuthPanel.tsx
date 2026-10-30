'use client'

import { useState, FormEvent } from 'react'
import type { SessionUser } from '@/lib/types'

type Stage = 'credentials' | 'setup' | 'code'

interface Props {
  onSignedIn: (token: string, user: SessionUser) => void
  onCancel: () => void
}

const field = 'border border-ledger-line/40 bg-white/70 px-3 py-2 w-full'
const primary = 'font-display text-sm uppercase tracking-wide bg-ledger-bg text-ledger-paper px-5 py-2.5 disabled:opacity-50'

export default function AuthPanel({ onSignedIn, onCancel }: Props) {
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [stage, setStage] = useState<Stage>('credentials')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [mfaToken, setMfaToken] = useState('')
  const [qr, setQr] = useState('')
  const [manualKey, setManualKey] = useState('')

  const post = async (url: string, body: unknown, token?: string) => {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      body: JSON.stringify(body),
    })
    const data = await res.json().catch(() => ({}))
    return { ok: res.ok, data }
  }

  const submitCredentials = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError('')
    setNotice('')
    setBusy(true)
    const f = new FormData(e.currentTarget)
    const email = String(f.get('email'))
    const password = String(f.get('password'))

    if (mode === 'register') {
      const r = await post('/api/auth/register', { name: f.get('name'), email, password })
      setBusy(false)
      if (!r.ok) return setError(r.data.error || 'Could not create the account.')
      setMode('login')
      setNotice('Account created. Sign in to set up your authenticator app.')
      return
    }

    const r = await post('/api/auth/login', { email, password })
    if (!r.ok) {
      setBusy(false)
      return setError(r.data.error || 'Could not sign in.')
    }
    setMfaToken(r.data.mfaToken)
    if (r.data.mfaEnabled) {
      setBusy(false)
      setStage('code')
      return
    }
    const s = await post('/api/auth/mfa/setup', {}, r.data.mfaToken)
    setBusy(false)
    if (!s.ok) return setError(s.data.error || 'Could not start authenticator setup.')
    setQr(s.data.qrDataUrl)
    setManualKey(s.data.manualKey)
    setStage('setup')
  }

  const submitCode = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError('')
    setBusy(true)
    const code = String(new FormData(e.currentTarget).get('code'))
    const r = await post('/api/auth/mfa/verify', { code }, mfaToken)
    setBusy(false)
    if (!r.ok) return setError(r.data.error || 'Invalid code.')
    onSignedIn(r.data.token, r.data.user)
  }

  return (
    <div className="paper-card relative mb-12 p-6 sm:p-8 shadow-xl max-w-md">
      {stage === 'credentials' && (
        <form onSubmit={submitCredentials} className="grid gap-4">
          <div className="flex gap-6 font-display text-sm uppercase tracking-wide">
            {(['login', 'register'] as const).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => { setMode(m); setError(''); setNotice('') }}
                className={mode === m ? 'border-b-2 border-ledger-amber' : 'opacity-50'}
              >
                {m === 'login' ? 'Sign in' : 'Create account'}
              </button>
            ))}
          </div>
          {mode === 'register' && <input name="name" required maxLength={80} placeholder="Full name" className={field} />}
          <input name="email" type="email" required placeholder="Email" autoComplete="username" className={field} />
          <input
            name="password"
            type="password"
            required
            minLength={mode === 'register' ? 10 : 1}
            placeholder={mode === 'register' ? 'Password (10+ characters, with a digit)' : 'Password'}
            autoComplete={mode === 'register' ? 'new-password' : 'current-password'}
            className={field}
          />
          {notice && <p className="text-ledger-moss text-sm">{notice}</p>}
          {error && <p className="text-ledger-rust text-sm">{error}</p>}
          <div className="flex gap-3">
            <button type="submit" disabled={busy} className={primary}>
              {busy ? 'Please wait…' : mode === 'login' ? 'Continue' : 'Create account'}
            </button>
            <button type="button" onClick={onCancel} className="text-sm underline opacity-60">Cancel</button>
          </div>
        </form>
      )}

      {stage === 'setup' && (
        <form onSubmit={submitCode} className="grid gap-4">
          <p className="text-sm">
            Scan this code with Google Authenticator or Microsoft Authenticator, then enter the 6-digit code it shows.
          </p>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={qr} alt="Authenticator QR code" width={240} height={240} className="border border-ledger-line/40" />
          <p className="text-xs break-all">Can’t scan? Enter this key manually: <span className="font-display">{manualKey}</span></p>
          <input name="code" inputMode="numeric" pattern="\d{6}" maxLength={6} required placeholder="123456" autoComplete="one-time-code" className={field} />
          {error && <p className="text-ledger-rust text-sm">{error}</p>}
          <button type="submit" disabled={busy} className={primary}>{busy ? 'Checking…' : 'Turn on MFA and sign in'}</button>
        </form>
      )}

      {stage === 'code' && (
        <form onSubmit={submitCode} className="grid gap-4">
          <p className="text-sm">Enter the 6-digit code from your authenticator app.</p>
          <input name="code" inputMode="numeric" pattern="\d{6}" maxLength={6} required autoFocus placeholder="123456" autoComplete="one-time-code" className={field} />
          {error && <p className="text-ledger-rust text-sm">{error}</p>}
          <button type="submit" disabled={busy} className={primary}>{busy ? 'Checking…' : 'Sign in'}</button>
        </form>
      )}
    </div>
  )
}
