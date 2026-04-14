import { NextRequest, NextResponse } from 'next/server'
import { createDownloadToken } from '@/lib/downloadToken'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { type, payload, filename } = body as {
      type: 'excel' | 'pdf' | 'contract-pdf'
      payload: Record<string, any>
      filename: string
    }

    if (!type || !payload || !filename) {
      return NextResponse.json({ error: '필수 파라미터 누락' }, { status: 400 })
    }

    const token = createDownloadToken({ type, payload, filename })
    return NextResponse.json({ token })
  } catch (e: any) {
    return NextResponse.json({ error: e.message ?? '토큰 생성 실패' }, { status: 500 })
  }
}
