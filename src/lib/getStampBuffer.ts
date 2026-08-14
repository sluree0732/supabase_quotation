import fs from 'fs'
import path from 'path'
import { createClient } from '@supabase/supabase-js'
import { getPool } from './db'
import { BACKEND } from './backend'
const DEFAULT_STAMP_PATH = path.join(process.cwd(), 'public', 'images', 'stamp.png')

async function fetchStampUrlSupabase(companyId?: string | null): Promise<string | null> {
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )
  if (companyId) {
    const { data, error } = await supabaseAdmin
      .from('companies').select('stamp_url').eq('id', companyId).not('stamp_url', 'is', null).limit(1)
    if (error) { console.error('[getStampBuffer] DB query error:', error.message); return null }
    return data?.[0]?.stamp_url ?? null
  }
  const { data, error } = await supabaseAdmin
    .from('companies').select('stamp_url').eq('company_type', 'sender')
    .not('stamp_url', 'is', null).order('created_at', { ascending: false }).limit(1)
  if (error) { console.error('[getStampBuffer] DB query error:', error.message); return null }
  return data?.[0]?.stamp_url ?? null
}

async function fetchStampUrlAzure(companyId?: string | null): Promise<string | null> {
  const pool = getPool()
  if (companyId) {
    const { rows } = await pool.query(
      'select stamp_url from companies where id = $1 and stamp_url is not null limit 1',
      [companyId],
    )
    return rows[0]?.stamp_url ?? null
  }
  const { rows } = await pool.query(
    `select stamp_url from companies where company_type = 'sender' and stamp_url is not null order by created_at desc limit 1`,
  )
  return rows[0]?.stamp_url ?? null
}

async function fetchStampUrl(companyId?: string | null): Promise<string | null> {
  try {
    return BACKEND === 'supabase' ? await fetchStampUrlSupabase(companyId) : await fetchStampUrlAzure(companyId)
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
