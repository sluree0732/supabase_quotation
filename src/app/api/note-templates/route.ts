import { NextRequest, NextResponse } from 'next/server'
import { getPool } from '@/lib/db'

export async function GET(req: NextRequest) {
  const category = req.nextUrl.searchParams.get('category')
  const pool = getPool()
  const { rows } = await pool.query(
    category
      ? 'select * from note_templates where category = $1 order by sort_order asc, created_at asc'
      : 'select * from note_templates order by sort_order asc, created_at asc',
    category ? [category] : [],
  )
  return NextResponse.json(rows)
}

export async function POST(req: NextRequest) {
  const p = await req.json()
  const pool = getPool()
  const { rows } = await pool.query(
    `insert into note_templates (category, title, content, sort_order)
     values ($1,$2,$3,$4) returning *`,
    [p.category, p.title, p.content, p.sort_order ?? 0],
  )
  return NextResponse.json(rows[0])
}
