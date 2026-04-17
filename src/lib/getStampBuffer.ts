import fs from 'fs'
import path from 'path'
import { createClient } from '@supabase/supabase-js'
const DEFAULT_STAMP_PATH = path.join(process.cwd(), 'public', 'images', 'stamp.png')

async function fetchStampUrl(companyId?: string | null): Promise<string | null> {
  try {
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // 특정 업체 ID가 지정된 경우 해당 업체 도장 사용
    if (companyId) {
      const { data, error } = await supabaseAdmin
        .from('companies')
        .select('stamp_url')
        .eq('id', companyId)
        .not('stamp_url', 'is', null)
        .limit(1)
      if (error) {
        console.error('[getStampBuffer] DB query error:', error.message)
        return null
      }
      return data?.[0]?.stamp_url ?? null
    }

    // 미선택 시 최신 자사(sender) 업체 도장 사용
    const { data, error } = await supabaseAdmin
      .from('companies')
      .select('stamp_url')
      .eq('company_type', 'sender')
      .not('stamp_url', 'is', null)
      .order('created_at', { ascending: false })
      .limit(1)
    if (error) {
      console.error('[getStampBuffer] DB query error:', error.message)
      return null
    }
    return data?.[0]?.stamp_url ?? null
  } catch (e: any) {
    console.error('[getStampBuffer] unexpected error:', e?.message ?? e)
    return null
  }
}

export async function getStampBuffer(companyId?: string | null): Promise<Buffer> {
  const url = await fetchStampUrl(companyId)
  if (url) {
    try {
      const res = await fetch(url)
      if (res.ok) {
        return Buffer.from(await res.arrayBuffer())
      }
    } catch {}
  }
  return fs.readFileSync(DEFAULT_STAMP_PATH)
}

export async function getStampSrc(companyId?: string | null): Promise<string> {
  const url = await fetchStampUrl(companyId)
  if (url) return url
  return DEFAULT_STAMP_PATH
}
