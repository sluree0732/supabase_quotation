import { NextRequest, NextResponse } from 'next/server'
import { getPool } from '@/lib/db'

// DELETE /api/contracts/drafts?quotationId=X&exceptId=Y
// 같은 견적서에서 새로 만든 계약서(exceptId) 말고 나머지 임시저장 계약서를 정리
export async function DELETE(req: NextRequest) {
  const quotationId = req.nextUrl.searchParams.get('quotationId')
  const exceptId = req.nextUrl.searchParams.get('exceptId')
  if (!quotationId || !exceptId) return NextResponse.json(null, { status: 400 })
  const pool = getPool()
  await pool.query(
    `delete from contracts where quotation_id = $1 and status = 'draft' and id != $2`,
    [quotationId, exceptId],
  )
  return NextResponse.json({ ok: true })
}
