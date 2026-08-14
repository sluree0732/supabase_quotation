import { Pool, types } from 'pg'

// bigint(OID 20) 컬럼을 문자열이 아닌 숫자로 파싱 — 견적/계약 금액 컬럼이 bigint라
// 기존 Supabase 응답(숫자 타입)과 동일한 형태를 유지하기 위함. 금액이 Number.MAX_SAFE_INTEGER를
// 넘지 않는 이 프로젝트 규모(수백만 원대)에서는 정밀도 손실 위험이 없음.
types.setTypeParser(20, (val: string) => parseInt(val, 10))

let pool: Pool | null = null

// Azure PostgreSQL Flexible Server 연결 풀 (서버 전용 — 브라우저에서 직접 import 금지)
export function getPool(): Pool {
  if (!pool) {
    const connectionString = process.env.AZURE_PG_CONNECTION_STRING
    if (!connectionString) {
      throw new Error('AZURE_PG_CONNECTION_STRING 환경변수가 설정되지 않았습니다.')
    }
    pool = new Pool({ connectionString, ssl: { rejectUnauthorized: true } })
  }
  return pool
}
