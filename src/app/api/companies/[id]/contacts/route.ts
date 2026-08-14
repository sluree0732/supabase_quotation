import { NextRequest, NextResponse } from 'next/server'
import { getPool } from '@/lib/db'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const pool = getPool()
  const { rows } = await pool.query(
    'select * from company_contacts where company_id = $1 order by created_at asc',
    [id],
  )
  return NextResponse.json(rows)
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { name, phone } = await req.json()
  const pool = getPool()
  const { rows } = await pool.query(
    'insert into company_contacts (company_id, name, phone) values ($1,$2,$3) returning *',
    [id, name, phone],
  )
  return NextResponse.json(rows[0])
}
