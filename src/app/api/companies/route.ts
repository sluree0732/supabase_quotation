import { NextRequest, NextResponse } from 'next/server'
import { getPool } from '@/lib/db'

// GET /api/companies                      → 전체 목록(+담당자)
// GET /api/companies?stampFor=sender      → 최신 자사(sender) 도장 URL
// GET /api/companies?stampFor=<companyId> → 특정 업체 도장 URL
export async function GET(req: NextRequest) {
  const stampFor = req.nextUrl.searchParams.get('stampFor')
  const pool = getPool()

  if (stampFor) {
    const isSender = stampFor === 'sender'
    const { rows } = await pool.query(
      isSender
        ? `select stamp_url from companies where company_type = 'sender' and stamp_url is not null order by created_at desc limit 1`
        : `select stamp_url from companies where id = $1 and stamp_url is not null limit 1`,
      isSender ? [] : [stampFor],
    )
    return NextResponse.json({ stamp_url: rows[0]?.stamp_url ?? null })
  }

  const { rows } = await pool.query(
    `select c.*, coalesce(
       (select jsonb_agg(cc.* order by cc.created_at)
        from company_contacts cc where cc.company_id = c.id), '[]'
     ) as company_contacts
     from companies c
     order by c.created_at desc`,
  )
  return NextResponse.json(rows.map(c => ({ ...c, contacts: c.company_contacts ?? [] })))
}

export async function POST(req: NextRequest) {
  const p = await req.json()
  const pool = getPool()
  const { rows } = await pool.query(
    `insert into companies
     (company_type, name, address, phone, business_no, business_type, business_item, email, fax, ceo, bank, stamp_url)
     values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) returning *`,
    [p.company_type, p.name, p.address, p.phone, p.business_no, p.business_type, p.business_item,
     p.email, p.fax, p.ceo ?? null, p.bank ?? null, p.stamp_url ?? null],
  )
  return NextResponse.json(rows[0])
}
