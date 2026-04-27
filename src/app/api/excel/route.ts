import { NextRequest, NextResponse } from 'next/server'
import ExcelJS from 'exceljs'
import { getStampBuffer } from '@/lib/getStampBuffer'

const VAT_MAP: Record<string, string> = {
  excluded: '부가세 별도',
  included: '부가세 포함',
  none: '',
}

export async function POST(req: NextRequest) {
  try {
    const { quoteDate, recipient, projectName, items, totalAmount, vatType, senderCompanyId, senderInfo } = await req.json()

    const wb = new ExcelJS.Workbook()
    const ws = wb.addWorksheet('견적서')

    // ── 열 너비 ───────────────────────────────────────────
    ws.columns = [
      { width: 28 }, // A: 상품(대분류+상품명)
      { width: 7  }, // B: 수량
      { width: 14 }, // C: 금액
      { width: 14 }, // D: 총액
      { width: 55 }, // E: 비고
    ]

    // ── 인쇄 설정 (A4 한 장) ─────────────────────────────
    ws.pageSetup = {
      paperSize: 9,
      orientation: 'portrait',
      fitToPage: true,
      fitToWidth: 1,
      fitToHeight: 1,
      scale: undefined,
      margins: { left: 0.4, right: 0.4, top: 0.6, bottom: 0.6, header: 0.3, footer: 0.3 },
    } as any

    // ── 공통 스타일 헬퍼 ──────────────────────────────────
    function applyBorder(cell: ExcelJS.Cell) {
      cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' },
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

    // ── 제목 ──────────────────────────────────────────────
    ws.mergeCells('A1:F1')
    const titleCell = ws.getCell('A1')
    titleCell.value = '견  적  서'
    titleCell.font = { bold: true, size: 18 }
    titleCell.alignment = { horizontal: 'center', vertical: 'middle' }
    ws.getRow(1).height = 40

    // ── 공급자 정보 ───────────────────────────────────────
    const s = {
      name: senderInfo?.name ?? '',
      ceo: senderInfo?.ceo ?? '',
      business_no: senderInfo?.business_no ?? '',
      phone: senderInfo?.phone ?? '',
      address: senderInfo?.address ?? '',
      business_type: senderInfo?.business_type ?? '',
      business_item: senderInfo?.business_item ?? '',
      bank: senderInfo?.bank ?? '',
    }

    ws.getRow(2).height = 24
    ws.getRow(3).height = 24
    ws.getRow(4).height = 24
    ws.getRow(5).height = 24
    ws.getRow(6).height = 24

    // 왼쪽: 날짜, 수신
    ws.getCell('A2').value = quoteDate
    ws.getCell('A2').font = { size: 9 }
    ws.mergeCells('A2:B2')

    ws.getCell('A3').value = `수 신 : ${recipient}`
    ws.getCell('A3').font = { size: 9 }
    ws.mergeCells('A3:B3')

    if (projectName) {
      ws.getCell('A4').value = `프로젝트 : ${projectName}`
      ws.getCell('A4').font = { size: 9 }
      ws.mergeCells('A4:B4')
    }

    ws.getCell('A5').value = '아래와 같이 견적합니다.'
    ws.getCell('A5').font = { bold: true, size: 9 }
    ws.mergeCells('A5:B5')

    // 오른쪽: 공급자 테이블
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
        val1Cell.value = v1
        val1Cell.font = { size: 8 }
        val1Cell.alignment = { horizontal: 'left', vertical: 'middle' }
        applyBorder(val1Cell)

        const labelCell2 = ws.getCell(rowNum, 5)
        labelCell2.value = l2
        labelCell2.font = { bold: true, size: 8 }
        labelCell2.alignment = { horizontal: 'center', vertical: 'middle' }
        labelCell2.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD9D9D9' } }
        applyBorder(labelCell2)

        const val2Cell = ws.getCell(rowNum, 6)
        val2Cell.value = v2
        val2Cell.font = { size: 8 }
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
              return {
                text: (i > 0 ? ' ' : '') + part,
                font: { size: 8, color: isAccount ? { argb: 'FFCC0000' } : undefined },
              }
            }),
          }
        } else {
          wideCell.value = v1
          wideCell.font = { size: 8 }
        }
        wideCell.alignment = { horizontal: 'left', vertical: 'middle' }
        applyBorder(wideCell)
      }
    })

    // ── 테이블 헤더 ──────────────────────────────────────
    const headerRow = 8
    ws.getRow(headerRow).height = 22

    headerCell(ws.getCell(`A${headerRow}`), '상  품')
    headerCell(ws.getCell(`B${headerRow}`), '수  량')
    headerCell(ws.getCell(`C${headerRow}`), '금  액')
    headerCell(ws.getCell(`D${headerRow}`), '총  액')
    headerCell(ws.getCell(`E${headerRow}`), '비  고')

    // ── 비고 줄 수 기반 행 높이 계산 ─────────────────────
    function calcRowHeight(note: string): number {
      if (!note) return 40
      const lines = note.split('\n').filter(Boolean)
      const totalLines = lines.reduce((acc, line) => {
        return acc + Math.max(1, Math.ceil(line.length / 28))
      }, 0)
      return Math.max(40, totalLines * 14 + 10)
    }

    // ── 데이터 행 ─────────────────────────────────────────
    const dataStartRow = headerRow + 1

    items.forEach((item: any, i: number) => {
      const r = dataStartRow + i
      ws.getRow(r).height = calcRowHeight(item.note ?? '')
      const productLabel = [item.category, item.item_name].filter(Boolean).join(', ')
      dataCell(ws.getCell(r, 1), productLabel, 'center')
      dataCell(ws.getCell(r, 2), item.period ?? 1, 'center')
      dataCell(ws.getCell(r, 3), item.unit_price ?? 0, 'center')
      dataCell(ws.getCell(r, 4), item.total_price ?? item.unit_price ?? 0, 'center')
      dataCell(ws.getCell(r, 5), item.note ?? '', 'left')
      ws.getCell(r, 3).numFmt = '#,##0'
      ws.getCell(r, 4).numFmt = '#,##0'
    })

    // ── 합계 행 ───────────────────────────────────────────
    const totalRow = dataStartRow + items.length
    ws.getRow(totalRow).height = 22

    const vatLabel = VAT_MAP[vatType] ?? ''
    ws.mergeCells(`A${totalRow}:C${totalRow}`)
    const totalLabelCell = ws.getCell(`A${totalRow}`)
    totalLabelCell.value = vatLabel ? `합  계 (${vatLabel})` : '합  계'
    totalLabelCell.font = { bold: true, size: 9 }
    totalLabelCell.alignment = { horizontal: 'left', vertical: 'middle' }
    applyBorder(totalLabelCell)

    const totalAmountCell = ws.getCell(`D${totalRow}`)
    totalAmountCell.value = totalAmount
    totalAmountCell.numFmt = '#,##0'
    totalAmountCell.font = { bold: true, size: 9 }
    totalAmountCell.alignment = { horizontal: 'center', vertical: 'middle' }
    applyBorder(totalAmountCell)

    const vatCell = ws.getCell(`E${totalRow}`)
    vatCell.value = vatLabel
    vatCell.font = { bold: true, size: 9, color: { argb: 'FFCC0000' } }
    vatCell.alignment = { horizontal: 'center', vertical: 'middle' }
    applyBorder(vatCell)

    // ── 도장 이미지 삽입 ──────────────────────────────────
    const stampBuffer = await getStampBuffer(senderCompanyId)
    const stampId = wb.addImage({ buffer: stampBuffer as any, extension: 'png' })
    ws.addImage(stampId, {
      tl: { col: 4.08, row: 1.12 },
      ext: { width: 65, height: 65 },
      editAs: 'oneCell',
    } as any)

    // ── 버퍼 생성 및 반환 ─────────────────────────────────
    const buffer = await wb.xlsx.writeBuffer()
    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': 'attachment; filename="quotation.xlsx"',
      },
    })
  } catch (e: any) {
    return NextResponse.json({ error: e.message ?? '엑셀 생성 실패' }, { status: 500 })
  }
}
