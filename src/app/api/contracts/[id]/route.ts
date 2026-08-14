import { NextRequest, NextResponse } from 'next/server'
import { getPool } from '@/lib/db'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const pool = getPool()
  const [{ rows: cRows }, { rows: itemRows }] = await Promise.all([
    pool.query(
      `select ct.*, to_jsonb(c.*) as companies
       from contracts ct
       left join companies c on c.id = ct.company_id
       where ct.id = $1`,
      [id],
    ),
    pool.query('select * from contract_items where contract_id = $1 order by sort_order', [id]),
  ])
  if (!cRows.length) return NextResponse.json(null, { status: 404 })
  return NextResponse.json({ ...cRows[0], items: itemRows })
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const fields = await req.json()
  const allowed = [
    'quotation_id', 'company_id', 'sender_company_id', 'contract_date', 'start_date', 'end_date',
    'recipient', 'total_amount', 'vat_type', 'status', 'special_terms', 'articles',
  ]
  const keys = Object.keys(fields).filter(k => allowed.includes(k))
  if (!keys.length) return NextResponse.json(null, { status: 400 })
  const setClause = keys.map((k, i) => `${k} = $${i + 2}`).join(', ')
  const values = keys.map(k => (k === 'articles' && fields[k] != null ? JSON.stringify(fields[k]) : fields[k]))
  const pool = getPool()
  await pool.query(`update contracts set ${setClause} where id = $1`, [id, ...values])
  return NextResponse.json({ ok: true })
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const pool = getPool()
  await pool.query('delete from contracts where id = $1', [id])
  return NextResponse.json({ ok: true })
}
