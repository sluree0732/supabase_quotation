import { createClient } from '@supabase/supabase-js'
import { getPool } from './db'
import { BACKEND } from './backend'

export interface SenderCompanyInfo {
  name?: string
  address?: string
  business_no?: string
  phone?: string
  business_type?: string
  business_item?: string
  ceo?: string
  bank?: string
}

async function getSenderCompanyInfoSupabase(
  companyId: string, overrides?: SenderCompanyInfo,
): Promise<SenderCompanyInfo> {
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )
  const { data, error } = await supabaseAdmin
    .from('companies')
    .select('name, address, business_no, phone, business_type, business_item, ceo, bank')
    .eq('id', companyId)
    .single()
  if (error || !data) return overrides ?? {}
  return {
    name: data.name,
    address: data.address ?? undefined,
    business_no: data.business_no ?? undefined,
    phone: data.phone ?? undefined,
    business_type: data.business_type ?? undefined,
    business_item: data.business_item ?? undefined,
    ceo: data.ceo ?? undefined,
    bank: data.bank ?? undefined,
  }
}

async function getSenderCompanyInfoAzure(
  companyId: string, overrides?: SenderCompanyInfo,
): Promise<SenderCompanyInfo> {
  const pool = getPool()
  const { rows } = await pool.query(
    'select name, address, business_no, phone, business_type, business_item, ceo, bank from companies where id = $1',
    [companyId],
  )
  const data = rows[0]
  if (!data) return overrides ?? {}
  return {
    name: data.name,
    address: data.address ?? undefined,
    business_no: data.business_no ?? undefined,
    phone: data.phone ?? undefined,
    business_type: data.business_type ?? undefined,
    business_item: data.business_item ?? undefined,
    ceo: data.ceo ?? undefined,
    bank: data.bank ?? undefined,
  }
}

export async function getSenderCompanyInfo(
  companyId: string | null | undefined,
  overrides?: SenderCompanyInfo,
): Promise<SenderCompanyInfo> {
  if (!companyId) return overrides ?? {}
  try {
    return BACKEND === 'supabase'
      ? await getSenderCompanyInfoSupabase(companyId, overrides)
      : await getSenderCompanyInfoAzure(companyId, overrides)
  } catch {
    return overrides ?? {}
  }
}
