import { NextRequest, NextResponse } from 'next/server'
import { getPool } from '@/lib/db'

// PUT /api/quotations/:id/items → 품목 전체 교체 (삭제 후 재삽입)
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const items = await req.json() as Array<{
    category: string; sub_category?: string; item_name: string
    period: number; unit_price: number; total_price: number; note: string
  }>
  const pool = getPool()
  const client = await pool.connect()
  try {
    await client.query('begin')
    await client.query('delete from quotation_items where quotation_id = $1', [id])
    for (let i = 0; i < items.length; i++) {
      const it = items[i]
      await client.query(
        `insert into quotation_items
         (quotation_id, sort_order, category, sub_category, item_name, period, unit_price, total_price, note)
         values ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
        [id, i, it.category, it.sub_category ?? '', it.item_name, it.period, it.unit_price, it.total_price, it.note],
      )
    }
    await client.query('commit')
  } catch (e) {
    await client.query('rollback')
    throw e
  } finally {
    client.release()
  }
  return NextResponse.json({ ok: true })
}
