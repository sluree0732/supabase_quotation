import fs from 'fs'
import path from 'path'
import { createClient } from '@supabase/supabase-js'

const DEFAULT_STAMP_PATH = path.join(process.cwd(), 'public', 'images', 'stamp.png')

async function fetchSenderStampUrl(): Promise<string | null> {
  try {
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
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

export async function getStampBuffer(): Promise<Buffer> {
  const url = await fetchSenderStampUrl()
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

export async function getStampSrc(): Promise<string> {
  const url = await fetchSenderStampUrl()
  if (url) return url
  return DEFAULT_STAMP_PATH
}
