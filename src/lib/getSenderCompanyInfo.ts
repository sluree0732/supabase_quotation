import { createClient } from '@supabase/supabase-js'

export interface SenderCompanyInfo {
  name?: string
  address?: string
  business_no?: string
  phone?: string
  business_type?: string
  business_item?: string
}

export async function getSenderCompanyInfo(
  companyId: string | null | undefined,
  overrides?: SenderCompanyInfo,
): Promise<SenderCompanyInfo> {
  // 프론트에서 이미 텍스트가 다 채워져 있으면 DB 조회 불필요
  if (overrides?.name && overrides?.business_no) return overrides

  if (!companyId) return overrides ?? {}

  try {
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
    const { data, error } = await supabaseAdmin
      .from('companies')
      .select('name, address, business_no, phone, business_type, business_item')
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
    }
  } catch {
    return overrides ?? {}
  }
}
