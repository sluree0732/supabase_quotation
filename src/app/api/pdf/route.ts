import { NextRequest, NextResponse } from 'next/server'
import { renderToBuffer } from '@react-pdf/renderer'
import { createElement } from 'react'
import QuotationDocument from '@/lib/pdf/QuotationDocument'
import type { VatType } from '@/types'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { quoteDate, recipient, items, totalAmount, vatType } = body as {
      quoteDate: string
      recipient: string
      items: any[]
      totalAmount: number
      vatType: VatType
    }

    const element = createElement(QuotationDocument, {
      quoteDate,
      recipient,
      items,
      totalAmount,
      vatType,
    })

    const buffer = await renderToBuffer(element as any)

    // 파일명: 견적서_YYYYMMDD.pdf
    const dateStr = quoteDate.replace(/-/g, '')
    const filename = encodeURIComponent(`견적서_${dateStr}.pdf`)

    return new NextResponse(buffer as unknown as BodyInit, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename*=UTF-8''${filename}`,
      },
    })
  } catch (e: any) {
    console.error('PDF 생성 오류:', e)
    return NextResponse.json({ error: e.message ?? 'PDF 생성 실패' }, { status: 500 })
  }
}
