import { NextResponse } from 'next/server'
import os from 'os'

export const dynamic = 'force-dynamic'

// Used by Docker health checks and to prove which container answered.
export async function GET() {
  const instance = process.env.INSTANCE_ID || os.hostname()
  return NextResponse.json({ status: 'ok', instance }, { headers: { 'X-Instance-Id': instance, 'Cache-Control': 'no-store' } })
}
