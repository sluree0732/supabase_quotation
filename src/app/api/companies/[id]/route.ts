import { NextRequest, NextResponse } from 'next/server'
import { getPool } from '@/lib/db'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const pool = getPool()
  const { rows } = await pool.query(
    `select c.*, coalesce(
       (select jsonb_agg(cc.* order by cc.created_at)
        from company_contacts cc where cc.company_id = c.id), '[]'
     ) as company_contacts
     from companies c where c.id = $1`,
    [id],
  )
  if (!rows.length) return NextResponse.json(null, { status: 404 })
  return NextResponse.json({ ...rows[0], contacts: rows[0].company_contacts ?? [] })
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const p = await req.json()
  const pool = getPool()
  const { rows } = await pool.query(
    `update companies set
       company_type=$1, name=$2, address=$3, phone=$4, business_no=$5, business_type=$6,
       business_item=$7, email=$8, fax=$9, ceo=$10, bank=$11, stamp_url=$12
     where id=$13 returning *`,
    [p.company_type, p.name, p.address, p.phone, p.business_no, p.business_type, p.business_item,
     p.email, p.fax, p.ceo ?? null, p.bank ?? null, p.stamp_url ?? null, id],
  )
  return NextResponse.json(rows[0])
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const pool = getPool()
  await pool.query('delete from companies where id = $1', [id])
  return NextResponse.json({ ok: true })
}
