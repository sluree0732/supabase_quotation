import { NextRequest, NextResponse } from 'next/server'
import { getPool } from '@/lib/db'

export async function GET() {
  const pool = getPool()
  const { rows } = await pool.query('select name from categories order by sort_order asc')
  return NextResponse.json(rows.map(r => r.name))
}

export async function POST(req: NextRequest) {
  const { name, sortOrder } = await req.json()
  const pool = getPool()
  await pool.query('insert into categories (name, sort_order) values ($1, $2)', [name, sortOrder])
  return NextResponse.json({ ok: true })
}
