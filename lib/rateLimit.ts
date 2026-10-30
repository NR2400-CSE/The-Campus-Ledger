// Fixed-window in-memory limiter. Good enough for one process; with several
// containers each keeps its own counters (a shared store such as Redis would be
// the production answer).
const buckets = new Map<string, { count: number; resetAt: number }>()

export function hit(key: string, max: number, windowMs: number): { allowed: boolean; retryAfterSec: number } {
  const now = Date.now()
  const b = buckets.get(key)
  if (!b || b.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs })
    if (buckets.size > 5000) {
      buckets.forEach((v, k) => { if (v.resetAt <= now) buckets.delete(k) })
    }
    return { allowed: true, retryAfterSec: 0 }
  }
  b.count += 1
  return { allowed: b.count <= max, retryAfterSec: Math.ceil((b.resetAt - now) / 1000) }
}

export function reset(key: string) {
  buckets.delete(key)
}

export function clientIp(req: Request): string {
  // nginx overwrites X-Forwarded-For with the real peer address (see nginx/*.conf)
  const xff = req.headers.get('x-forwarded-for')
  return (xff ? xff.split(',')[0] : req.headers.get('x-real-ip') || 'unknown').trim()
}
