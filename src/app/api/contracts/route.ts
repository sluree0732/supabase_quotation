import { NextRequest, NextResponse } from 'next/server'
import { getPool } from '@/lib/db'

export async function GET() {
  const pool = getPool()
  const { rows } = await pool.query(
    `select ct.*, jsonb_build_object('name', c.name) as companies
     from contracts ct
     left join companies c on c.id = ct.company_id
     order by ct.created_at desc`,
  )
  return NextResponse.json(rows)
}

export async function POST(req: NextRequest) {
  const p = await req.json()
  const pool = getPool()
  const { rows } = await pool.query(
    `insert into contracts (quotation_id, company_id, sender_company_id, contract_date, recipient)
     values ($1,$2,$3,$4,$5) returning *`,
    [p.quotation_id ?? null, p.company_id ?? null, p.sender_company_id ?? null, p.contract_date, p.recipient],
  )
  return NextResponse.json(rows[0])
}
