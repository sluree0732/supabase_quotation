import { NextRequest, NextResponse } from 'next/server'
import { getPool } from '@/lib/db'

// GET /api/quotations           → 전체 목록
// GET /api/quotations?status=draft → 임시저장만
export async function GET(req: NextRequest) {
  const status = req.nextUrl.searchParams.get('status')
  const pool = getPool()
  const where = status ? 'where q.status = $1' : ''
  const params = status ? [status] : []
  const { rows } = await pool.query(
    `select q.*, jsonb_build_object('name', c.name) as companies
     from quotations q
     left join companies c on c.id = q.company_id
     ${where}
     order by q.created_at desc`,
    params,
  )
  return NextResponse.json(rows)
}

// POST /api/quotations → 새 견적서 생성 (임시저장)
export async function POST(req: NextRequest) {
  const body = await req.json()
  const { companyId, quoteDate, recipient = '' } = body
  const pool = getPool()
  const { rows } = await pool.query(
    `insert into quotations (company_id, quote_date, recipient, status)
     values ($1, $2, $3, 'draft') returning *`,
    [companyId ?? null, quoteDate, recipient],
  )
  return NextResponse.json(rows[0])
}
