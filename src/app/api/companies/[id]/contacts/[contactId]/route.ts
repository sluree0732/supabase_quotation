import { NextRequest, NextResponse } from 'next/server'
import { getPool } from '@/lib/db'

export async function PUT(req: NextRequest, { params }: { params: Promise<{ contactId: string }> }) {
  const { contactId } = await params
  const { name, phone } = await req.json()
  const pool = getPool()
  const { rows } = await pool.query(
    'update company_contacts set name=$1, phone=$2 where id=$3 returning *',
    [name, phone, contactId],
  )
  return NextResponse.json(rows[0])
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ contactId: string }> }) {
  const { contactId } = await params
  const pool = getPool()
  await pool.query('delete from company_contacts where id = $1', [contactId])
  return NextResponse.json({ ok: true })
}
