import { NextRequest, NextResponse } from 'next/server'
import { renderToBuffer } from '@react-pdf/renderer'
import { createElement } from 'react'
import ContractDocument from '@/lib/pdf/ContractDocument'
import type { VatType } from '@/types'
import { getStampSrc } from '@/lib/getStampBuffer'
import { getSenderCompanyInfo } from '@/lib/getSenderCompanyInfo'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const {
      contractDate, startDate, endDate, recipient, companyName, companyAddress,
      items, totalAmount, vatType, specialTerms, senderCompanyId,
      senderName, senderAddress, senderBusinessNo,
    } = body as {
      contractDate: string
      startDate: string
      endDate: string
      recipient: string
      companyName: string
      companyAddress?: string
      items: any[]
      totalAmount: number
      vatType: VatType
      specialTerms: string
      senderCompanyId?: string | null
      senderName?: string
      senderAddress?: string
      senderBusinessNo?: string
    }

    const [stampSrc, senderInfo] = await Promise.all([
      getStampSrc(senderCompanyId),
      getSenderCompanyInfo(senderCompanyId, { name: senderName, address: senderAddress, business_no: senderBusinessNo }),
    ])
    const element = createElement(ContractDocument, {
      contractDate,
      startDate,
      endDate,
      recipient,
      companyName,
      companyAddress,
      items,
      totalAmount,
      vatType,
      specialTerms,
      stampSrc,
      senderName: senderInfo.name,
      senderAddress: senderInfo.address,
      senderBusinessNo: senderInfo.business_no,
    })

    const buffer = await renderToBuffer(element as any)

    const dateStr = contractDate.replace(/-/g, '')
    const name = companyName || ''
    const filename = encodeURIComponent(name ? `${name}_계약서(${dateStr}).pdf` : `계약서(${dateStr}).pdf`)

    return new NextResponse(buffer as unknown as BodyInit, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename*=UTF-8''${filename}`,
      },
    })
  } catch (e: any) {
    console.error('계약서 PDF 생성 오류:', e)
    return NextResponse.json({ error: e.message ?? '계약서 PDF 생성 실패' }, { status: 500 })
  }
}
