import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const file = formData.get('file') as File | null
    const companyId = formData.get('companyId') as string | null

    if (!file) {
      return NextResponse.json({ error: '파일이 없습니다.' }, { status: 400 })
    }

    const ext = file.name.split('.').pop() ?? 'png'
    const filename = companyId ? `${companyId}.${ext}` : `temp_${Date.now()}.${ext}`
    const buffer = Buffer.from(await file.arrayBuffer())

    const { data, error } = await supabaseAdmin.storage
      .from('company-stamps')
      .upload(filename, buffer, {
        upsert: true,
        contentType: file.type,
      })

    if (error) throw new Error(error.message)

    const { data: { publicUrl } } = supabaseAdmin.storage
      .from('company-stamps')
      .getPublicUrl(data.path)

    return NextResponse.json({ url: publicUrl })
  } catch (e: any) {
    return NextResponse.json({ error: e.message ?? '업로드 실패' }, { status: 500 })
  }
}
