import { NextRequest, NextResponse } from 'next/server'
import { getPool } from '@/lib/db'

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ name: string }> }) {
  const { name } = await params
  const pool = getPool()
  await pool.query('delete from categories where name = $1', [decodeURIComponent(name)])
  return NextResponse.json({ ok: true })
}
