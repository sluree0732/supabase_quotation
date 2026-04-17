import { NextRequest, NextResponse } from 'next/server'
import { verifyDownloadToken } from '@/lib/downloadToken'
import { renderToBuffer } from '@react-pdf/renderer'
import { createElement } from 'react'
import ExcelJS from 'exceljs'
import path from 'path'
import QuotationDocument from '@/lib/pdf/QuotationDocument'
import ContractDocument from '@/lib/pdf/ContractDocument'
import { SUPPLIER } from '@/lib/supplier'
import { getStampBuffer, getStampSrc } from '@/lib/getStampBuffer'
import { getSenderCompanyInfo } from '@/lib/getSenderCompanyInfo'

const VAT_MAP: Record<string, string> = {
  excluded: '부가세 별도',
  included: '부가세 포함',
  none: '',
}

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get('token')
  if (!token) {
    return NextResponse.json({ error: '토큰 없음' }, { status: 400 })
  }

  const data = verifyDownloadToken(token)
  if (!data) {
    return NextResponse.json({ error: '유효하지 않은 토큰' }, { status: 400 })
  }

  const { type, payload, filename } = data as {
    type: 'excel' | 'pdf' | 'contract-pdf' | 'contract-excel'
    payload: Record<string, any>
    filename: string
  }

  try {
    if (type === 'excel') {
      const buffer = await generateExcel(payload)
      const encodedName = encodeURIComponent(filename)
      return new NextResponse(buffer as unknown as BodyInit, {
        headers: {
          'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'Content-Disposition': `attachment; filename*=UTF-8''${encodedName}`,
        },
      })
    }

    if (type === 'pdf') {
      const buffer = await generatePdf(payload)
      const encodedName = encodeURIComponent(filename)
      return new NextResponse(buffer as unknown as BodyInit, {
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename*=UTF-8''${encodedName}`,
        },
      })
    }

    if (type === 'contract-pdf') {
      const buffer = await generateContractPdf(payload)
      const encodedName = encodeURIComponent(filename)
      return new NextResponse(buffer as unknown as BodyInit, {
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename*=UTF-8''${encodedName}`,
        },
      })
    }

    if (type === 'contract-excel') {
      const buffer = await generateContractExcel(payload)
      const encodedName = encodeURIComponent(filename)
      return new NextResponse(buffer as unknown as BodyInit, {
        headers: {
          'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'Content-Disposition': `attachment; filename*=UTF-8''${encodedName}`,
        },
      })
    }

    return NextResponse.json({ error: '지원하지 않는 타입' }, { status: 400 })
  } catch (e: any) {
    return NextResponse.json({ error: e.message ?? '파일 생성 실패' }, { status: 500 })
  }
}

async function generateExcel(payload: Record<string, any>): Promise<Buffer> {
  const { quoteDate, recipient, items, totalAmount, vatType, period = 1, senderCompanyId, senderInfo } = payload

  const wb = new ExcelJS.Workbook()
  const ws = wb.addWorksheet('견적서')

  ws.columns = [
    { width: 12 }, { width: 24 }, { width: 10 },
    { width: 14 }, { width: 14 }, { width: 48 },
  ]

  function applyBorder(cell: ExcelJS.Cell) {
    cell.border = {
      top: { style: 'thin' }, left: { style: 'thin' },
      bottom: { style: 'thin' }, right: { style: 'thin' },
    }
  }

  function headerCell(cell: ExcelJS.Cell, value: string) {
    cell.value = value
    cell.font = { bold: true, size: 9 }
    cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true }
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD9D9D9' } }
    applyBorder(cell)
  }

  function dataCell(cell: ExcelJS.Cell, value: string | number, align: 'left' | 'center' | 'right' = 'center') {
    cell.value = value
    cell.font = { size: 9 }
    cell.alignment = { horizontal: align, vertical: 'middle', wrapText: true }
    applyBorder(cell)
  }

  ws.mergeCells('A1:F1')
  const titleCell = ws.getCell('A1')
  titleCell.value = '견  적  서'
  titleCell.font = { bold: true, size: 18 }
  titleCell.alignment = { horizontal: 'center', vertical: 'middle' }
  ws.getRow(1).height = 40

  const s = {
    name: senderInfo?.name ?? SUPPLIER.name,
    ceo: senderInfo?.ceo ?? SUPPLIER.ceo,
    business_no: senderInfo?.business_no ?? SUPPLIER.business_no,
    phone: senderInfo?.phone ?? SUPPLIER.phone,
    address: senderInfo?.address ?? SUPPLIER.address,
    business_type: senderInfo?.business_type ?? SUPPLIER.business_type,
    business_item: senderInfo?.business_item ?? SUPPLIER.business_item,
    bank: senderInfo?.bank ?? SUPPLIER.bank,
  }
  ws.getRow(2).height = 28
  ws.getRow(3).height = 28
  ws.getRow(4).height = 18
  ws.getRow(5).height = 18
  ws.getRow(6).height = 18
  ws.getRow(7).height = 18

  ws.getCell('A2').value = quoteDate
  ws.getCell('A2').font = { size: 9 }
  ws.mergeCells('A2:B2')
  ws.getCell('A3').value = `수 신 : ${recipient}`
  ws.getCell('A3').font = { size: 9 }
  ws.mergeCells('A3:B3')
  ws.getCell('A5').value = '아래와 같이 견적합니다.'
  ws.getCell('A5').font = { bold: true, size: 9 }
  ws.mergeCells('A5:B5')

  const supplierData = [
    ['상  호', s.name, '사업자 등록번호', s.business_no],
    ['대표자', s.ceo, '연  락  처', s.phone],
    ['사업장', s.address, '', ''],
    ['업  태', s.business_type, '종  목', s.business_item],
    ['계좌정보', s.bank, '', ''],
  ]

  supplierData.forEach((row, ri) => {
    const rowNum = 2 + ri
    const [l1, v1, l2, v2] = row
    const labelCell1 = ws.getCell(rowNum, 3)
    labelCell1.value = l1
    labelCell1.font = { bold: true, size: 8 }
    labelCell1.alignment = { horizontal: 'center', vertical: 'middle' }
    labelCell1.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD9D9D9' } }
    applyBorder(labelCell1)

    if (l2) {
      const val1Cell = ws.getCell(rowNum, 4)
      val1Cell.value = v1; val1Cell.font = { size: 8 }
      val1Cell.alignment = { horizontal: 'left', vertical: 'middle' }
      applyBorder(val1Cell)
      const labelCell2 = ws.getCell(rowNum, 5)
      labelCell2.value = l2; labelCell2.font = { bold: true, size: 8 }
      labelCell2.alignment = { horizontal: 'center', vertical: 'middle' }
      labelCell2.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD9D9D9' } }
      applyBorder(labelCell2)
      const val2Cell = ws.getCell(rowNum, 6)
      val2Cell.value = v2; val2Cell.font = { size: 8 }
      val2Cell.alignment = { horizontal: ri <= 1 ? 'center' : 'left', vertical: 'middle' }
      applyBorder(val2Cell)
    } else {
      ws.mergeCells(rowNum, 4, rowNum, 6)
      const wideCell = ws.getCell(rowNum, 4)
      if (l1 === '계좌정보') {
        const parts = v1.trim().split(' ')
        wideCell.value = {
          richText: parts.map((part: string, i: number) => {
            const isAccount = /\d/.test(part) && part.includes('-')
            return { text: (i > 0 ? ' ' : '') + part, font: { size: 8, color: isAccount ? { argb: 'FFCC0000' } : undefined } }
          }),
        }
      } else {
        wideCell.value = v1; wideCell.font = { size: 8 }
      }
      wideCell.alignment = { horizontal: 'left', vertical: 'middle' }
      applyBorder(wideCell)
    }
  })

  const headerRow = 8
  ws.getRow(headerRow).height = 22
  ws.mergeCells(`A${headerRow}:B${headerRow}`)
  headerCell(ws.getCell(`A${headerRow}`), '상  품')
  headerCell(ws.getCell(`C${headerRow}`), '기간(월)')
  headerCell(ws.getCell(`D${headerRow}`), '금  액')
  headerCell(ws.getCell(`E${headerRow}`), '총  액')
  headerCell(ws.getCell(`F${headerRow}`), '비  고')

  const subRow = headerRow + 1
  ws.getRow(subRow).height = 16
  headerCell(ws.getCell(`A${subRow}`), '대분류')
  headerCell(ws.getCell(`B${subRow}`), '상품명')
  headerCell(ws.getCell(`C${subRow}`), '')
  headerCell(ws.getCell(`D${subRow}`), '')
  headerCell(ws.getCell(`E${subRow}`), '')
  headerCell(ws.getCell(`F${subRow}`), '')

  function calcRowHeight(note: string): number {
    if (!note) return 40
    const lines = note.split('\n').filter(Boolean)
    const totalLines = lines.reduce((acc: number, line: string) => acc + Math.max(1, Math.ceil(line.length / 28)), 0)
    return Math.max(40, totalLines * 14 + 10)
  }

  const dataStartRow = subRow + 1
  items.forEach((item: any, i: number) => {
    const r = dataStartRow + i
    ws.getRow(r).height = calcRowHeight(item.note ?? '')
    dataCell(ws.getCell(`A${r}`), item.category ?? '', 'center')
    dataCell(ws.getCell(`B${r}`), item.item_name ?? '', 'center')
    dataCell(ws.getCell(`C${r}`), period, 'center')
    dataCell(ws.getCell(`D${r}`), item.unit_price ?? 0, 'right')
    dataCell(ws.getCell(`E${r}`), item.total_price ?? 0, 'right')
    dataCell(ws.getCell(`F${r}`), item.note ?? '', 'left')
    ws.getCell(`D${r}`).numFmt = '#,##0'
    ws.getCell(`E${r}`).numFmt = '#,##0'
  })

  const totalRow = dataStartRow + items.length
  ws.getRow(totalRow).height = 22
  ws.mergeCells(`A${totalRow}:D${totalRow}`)
  const totalLabelCell = ws.getCell(`A${totalRow}`)
  totalLabelCell.value = '합  계 (부가세포함)'
  totalLabelCell.font = { bold: true, size: 9 }
  totalLabelCell.alignment = { horizontal: 'left', vertical: 'middle' }
  applyBorder(totalLabelCell)

  const totalAmountCell = ws.getCell(`E${totalRow}`)
  totalAmountCell.value = totalAmount
  totalAmountCell.numFmt = '#,##0'
  totalAmountCell.font = { bold: true, size: 9 }
  totalAmountCell.alignment = { horizontal: 'right', vertical: 'middle' }
  applyBorder(totalAmountCell)

  const vatCell = ws.getCell(`F${totalRow}`)
  vatCell.value = VAT_MAP[vatType] ?? ''
  vatCell.font = { bold: true, size: 9, color: { argb: 'FFCC0000' } }
  vatCell.alignment = { horizontal: 'center', vertical: 'middle' }
  applyBorder(vatCell)

  const stampBuffer = await getStampBuffer(senderCompanyId)
  const stampId = wb.addImage({ buffer: stampBuffer as any, extension: 'png' })
  ws.addImage(stampId, {
    tl: { col: 5.08, row: 1.12 },
    ext: { width: 65, height: 65 },
    editAs: 'oneCell',
  } as any)

  return wb.xlsx.writeBuffer() as unknown as Promise<Buffer>
}

async function generatePdf(payload: Record<string, any>): Promise<Buffer> {
  const { quoteDate, recipient, items, totalAmount, vatType, senderCompanyId, senderInfo } = payload
  const stampSrc = await getStampSrc(senderCompanyId)
  const element = createElement(QuotationDocument, { quoteDate, recipient, items, totalAmount, vatType, stampSrc, senderInfo })
  return renderToBuffer(element as any) as Promise<Buffer>
}

async function generateContractExcel(payload: Record<string, any>): Promise<Buffer> {
  const {
    contractDate, startDate, endDate, recipient, companyName, companyAddress,
    items, totalAmount, vatType, specialTerms, senderCompanyId,
  } = payload

  const wb = new ExcelJS.Workbook()
  const ws = wb.addWorksheet('계약서')

  ws.columns = [
    { width: 12 }, // A: 대분류
    { width: 24 }, // B: 항목명
    { width: 14 }, // C: 금액
    { width: 14 }, // D: 총액
    { width: 48 }, // E: 비고
  ]

  function applyBorder(cell: ExcelJS.Cell) {
    cell.border = {
      top: { style: 'thin' }, left: { style: 'thin' },
      bottom: { style: 'thin' }, right: { style: 'thin' },
    }
  }

  function headerCell(cell: ExcelJS.Cell, value: string) {
    cell.value = value
    cell.font = { bold: true, size: 9 }
    cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true }
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD9D9D9' } }
    applyBorder(cell)
  }

  function dataCell(cell: ExcelJS.Cell, value: string | number, align: 'left' | 'center' | 'right' = 'center') {
    cell.value = value
    cell.font = { size: 9 }
    cell.alignment = { horizontal: align, vertical: 'middle', wrapText: true }
    applyBorder(cell)
  }

  // ── 제목 ─────────────────────────────────────────────
  ws.mergeCells('A1:E1')
  const titleCell = ws.getCell('A1')
  titleCell.value = '계  약  서'
  titleCell.font = { bold: true, size: 18 }
  titleCell.alignment = { horizontal: 'center', vertical: 'middle' }
  ws.getRow(1).height = 40

  // ── 기본 정보 (왼쪽: 날짜/수신, 오른쪽: 수신처/주소) ─
  ws.getRow(2).height = 20
  ws.getRow(3).height = 20
  ws.getRow(4).height = 20
  ws.getRow(5).height = 20

  ws.getCell('A2').value = `계약일 : ${contractDate}`
  ws.getCell('A2').font = { size: 9 }
  ws.mergeCells('A2:B2')

  ws.getCell('A3').value = `수  신 : ${recipient}`
  ws.getCell('A3').font = { size: 9 }
  ws.mergeCells('A3:B3')

  if (startDate) {
    ws.getCell('A4').value = `시작일 : ${startDate}`
    ws.getCell('A4').font = { size: 9 }
    ws.mergeCells('A4:B4')
  }
  if (endDate) {
    ws.getCell('A5').value = `종료일 : ${endDate}`
    ws.getCell('A5').font = { size: 9 }
    ws.mergeCells('A5:B5')
  }

  // 오른쪽: 수신처 정보 (C~E)
  if (companyName) {
    const nameLabel = ws.getCell('C2')
    nameLabel.value = '수  신  처'
    nameLabel.font = { bold: true, size: 8 }
    nameLabel.alignment = { horizontal: 'center', vertical: 'middle' }
    nameLabel.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD9D9D9' } }
    applyBorder(nameLabel)

    ws.mergeCells('D2:E2')
    const nameVal = ws.getCell('D2')
    nameVal.value = companyName
    nameVal.font = { size: 8 }
    nameVal.alignment = { horizontal: 'left', vertical: 'middle' }
    applyBorder(nameVal)

    if (companyAddress) {
      const addrLabel = ws.getCell('C3')
      addrLabel.value = '주  소'
      addrLabel.font = { bold: true, size: 8 }
      addrLabel.alignment = { horizontal: 'center', vertical: 'middle' }
      addrLabel.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD9D9D9' } }
      applyBorder(addrLabel)

      ws.mergeCells('D3:E3')
      const addrVal = ws.getCell('D3')
      addrVal.value = companyAddress
      addrVal.font = { size: 8 }
      addrVal.alignment = { horizontal: 'left', vertical: 'middle' }
      applyBorder(addrVal)
    }

    // 도장 이미지 (오른쪽 상단)
    const stampBuffer = await getStampBuffer(senderCompanyId)
    const stampId = wb.addImage({ buffer: stampBuffer as any, extension: 'png' })
    ws.addImage(stampId, {
      tl: { col: 4.08, row: 1.12 },
      ext: { width: 65, height: 65 },
      editAs: 'oneCell',
    } as any)
  }

  // ── 테이블 헤더 ───────────────────────────────────────
  const headerRow = 7
  ws.getRow(headerRow).height = 22
  headerCell(ws.getCell(`A${headerRow}`), '대분류')
  headerCell(ws.getCell(`B${headerRow}`), '항목명')
  headerCell(ws.getCell(`C${headerRow}`), '금  액')
  headerCell(ws.getCell(`D${headerRow}`), '총  액')
  headerCell(ws.getCell(`E${headerRow}`), '비  고')

  // ── 데이터 행 ─────────────────────────────────────────
  function calcRowHeight(note: string): number {
    if (!note) return 40
    const lines = note.split('\n').filter(Boolean)
    const totalLines = lines.reduce((acc: number, line: string) => acc + Math.max(1, Math.ceil(line.length / 28)), 0)
    return Math.max(40, totalLines * 14 + 10)
  }

  const dataStartRow = headerRow + 1
  items.forEach((item: any, i: number) => {
    const r = dataStartRow + i
    ws.getRow(r).height = calcRowHeight(item.note ?? '')
    dataCell(ws.getCell(`A${r}`), item.category ?? '', 'center')
    dataCell(ws.getCell(`B${r}`), item.item_name ?? '', 'center')
    dataCell(ws.getCell(`C${r}`), item.unit_price ?? 0, 'right')
    dataCell(ws.getCell(`D${r}`), item.total_price ?? 0, 'right')
    dataCell(ws.getCell(`E${r}`), item.note ?? '', 'left')
    ws.getCell(`C${r}`).numFmt = '#,##0'
    ws.getCell(`D${r}`).numFmt = '#,##0'
  })

  // ── 합계 행 ───────────────────────────────────────────
  const totalRow = dataStartRow + items.length
  ws.getRow(totalRow).height = 22
  ws.mergeCells(`A${totalRow}:C${totalRow}`)
  const totalLabelCell = ws.getCell(`A${totalRow}`)
  totalLabelCell.value = `합  계 ${VAT_MAP[vatType] ? `(${VAT_MAP[vatType]})` : ''}`
  totalLabelCell.font = { bold: true, size: 9 }
  totalLabelCell.alignment = { horizontal: 'left', vertical: 'middle' }
  applyBorder(totalLabelCell)

  const totalAmountCell = ws.getCell(`D${totalRow}`)
  totalAmountCell.value = totalAmount
  totalAmountCell.numFmt = '#,##0'
  totalAmountCell.font = { bold: true, size: 9 }
  totalAmountCell.alignment = { horizontal: 'right', vertical: 'middle' }
  applyBorder(totalAmountCell)

  const vatCell = ws.getCell(`E${totalRow}`)
  vatCell.value = ''
  applyBorder(vatCell)

  // ── 특약사항 ──────────────────────────────────────────
  if (specialTerms) {
    const termsRow = totalRow + 2
    ws.getRow(termsRow).height = 18
    ws.mergeCells(`A${termsRow}:E${termsRow}`)
    const termsTitle = ws.getCell(`A${termsRow}`)
    termsTitle.value = '특약사항'
    termsTitle.font = { bold: true, size: 9 }
    termsTitle.alignment = { horizontal: 'left', vertical: 'middle' }

    const contentRow = termsRow + 1
    const lines = specialTerms.split('\n').length
    ws.getRow(contentRow).height = Math.max(40, lines * 14 + 10)
    ws.mergeCells(`A${contentRow}:E${contentRow}`)
    const termsContent = ws.getCell(`A${contentRow}`)
    termsContent.value = specialTerms
    termsContent.font = { size: 9 }
    termsContent.alignment = { horizontal: 'left', vertical: 'top', wrapText: true }
    applyBorder(termsContent)
  }

  return wb.xlsx.writeBuffer() as unknown as Promise<Buffer>
}

async function generateContractPdf(payload: Record<string, any>): Promise<Buffer> {
  const {
    contractDate, startDate, endDate, recipient, companyName, companyAddress,
    items, totalAmount, vatType, specialTerms, senderCompanyId,
    senderName, senderAddress, senderBusinessNo,
  } = payload
  const [stampSrc, senderInfo] = await Promise.all([
    getStampSrc(senderCompanyId),
    getSenderCompanyInfo(senderCompanyId, { name: senderName, address: senderAddress, business_no: senderBusinessNo }),
  ])
  const element = createElement(ContractDocument, {
    contractDate, startDate, endDate, recipient, companyName, companyAddress,
    items, totalAmount, vatType, specialTerms, stampSrc,
    senderName: senderInfo.name,
    senderAddress: senderInfo.address,
    senderBusinessNo: senderInfo.business_no,
    senderCeo: senderInfo.ceo,
    senderBank: senderInfo.bank,
  })
  return renderToBuffer(element as any) as Promise<Buffer>
}
