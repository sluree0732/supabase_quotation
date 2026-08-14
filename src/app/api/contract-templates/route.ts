import { NextRequest, NextResponse } from 'next/server'
import { getPool } from '@/lib/db'

export async function GET() {
  const pool = getPool()
  const { rows } = await pool.query(
    'select * from contract_templates order by sort_order asc, created_at asc',
  )
  return NextResponse.json(rows)
}

export async function POST(req: NextRequest) {
  const p = await req.json()
  const pool = getPool()
  const { rows } = await pool.query(
    `insert into contract_templates (name, description, articles, sort_order)
     values ($1,$2,$3,$4) returning *`,
    [p.name, p.description ?? null, p.articles ? JSON.stringify(p.articles) : null, p.sort_order ?? 0],
  )
  return NextResponse.json(rows[0])
}
