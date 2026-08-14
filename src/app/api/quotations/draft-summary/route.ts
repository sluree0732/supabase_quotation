import { NextResponse } from 'next/server'
import { getPool } from '@/lib/db'

// GET /api/quotations/draft-summary
// 10초 폴링용 — 임시저장 견적서 개수 + 목록(수신처/프로젝트명)을 함께 반환해서
// 프론트에서 이전 응답과 비교(diff)해 변경 감지 토스트를 띄울 수 있게 함
export async function GET() {
  const pool = getPool()
  const { rows } = await pool.query(
    `select id, recipient, project_name
     from quotations
     where status = 'draft'
     order by created_at desc`,
  )
  return NextResponse.json({ count: rows.length, drafts: rows })
}
