import { NextRequest, NextResponse } from 'next/server'
import { getPool } from '@/lib/db'

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const p = await req.json()
  const fields = ['name', 'description', 'articles', 'sort_order'] as const
  const keys = fields.filter(k => k in p)
  if (!keys.length) return NextResponse.json(null, { status: 400 })
  const setClause = keys.map((k, i) => `${k} = $${i + 2}`).join(', ')
  const values = keys.map(k => (k === 'articles' && p[k] != null ? JSON.stringify(p[k]) : p[k]))
  const pool = getPool()
  const { rows } = await pool.query(
    `update contract_templates set ${setClause} where id = $1 returning *`,
    [id, ...values],
  )
  return NextResponse.json(rows[0])
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const pool = getPool()
  await pool.query('delete from contract_templates where id = $1', [id])
  return NextResponse.json({ ok: true })
}
