import { NextRequest, NextResponse } from 'next/server'
import { getPool } from '@/lib/db'

// GET /api/quotations/:id → 견적서 + 회사정보 + 품목 전체
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const pool = getPool()
  const [{ rows: qRows }, { rows: itemRows }] = await Promise.all([
    pool.query(
      `select q.*, to_jsonb(c.*) as companies
       from quotations q
       left join companies c on c.id = q.company_id
       where q.id = $1`,
      [id],
    ),
    pool.query(
      `select * from quotation_items where quotation_id = $1 order by sort_order`,
      [id],
    ),
  ])
  if (!qRows.length) return NextResponse.json(null, { status: 404 })
  return NextResponse.json({ ...qRows[0], items: itemRows })
}

// PUT /api/quotations/:id → 필드 업데이트
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const fields = await req.json()
  const allowed = [
    'total_amount', 'vat_type', 'status', 'recipient', 'quote_date', 'company_id',
    'period', 'project_name', 'sender_company_id', 'sender_info', 'client_info',
  ]
  const keys = Object.keys(fields).filter(k => allowed.includes(k))
  if (!keys.length) return NextResponse.json(null, { status: 400 })

  const setClause = keys.map((k, i) => `${k} = $${i + 2}`).join(', ')
  const values = keys.map(k => {
    const v = fields[k]
    return (k === 'sender_info' || k === 'client_info') && v != null ? JSON.stringify(v) : v
  })
  const pool = getPool()
  const { rows } = await pool.query(
    `update quotations set ${setClause} where id = $1 returning *`,
    [id, ...values],
  )
  return NextResponse.json(rows[0])
}

// DELETE /api/quotations/:id
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const pool = getPool()
  await pool.query('delete from quotations where id = $1', [id])
  return NextResponse.json({ ok: true })
}
