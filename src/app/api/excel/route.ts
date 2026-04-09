import { NextRequest, NextResponse } from 'next/server'
import ExcelJS from 'exceljs'
import { SUPPLIER } from '@/lib/supplier'

const VAT_MAP: Record<string, string> = {
  excluded: '부가세 별도',
  included: '부가세 포함',
  none: '',
}

export async function POST(req: NextRequest) {
  try {
    const { quoteDate, recipient, items, totalAmount, vatType } = await req.json()

    const wb = new ExcelJS.Workbook()
    const ws = wb.addWorksheet('견적서')

    // ── 열 너비 설정 ──────────────────────────────────────
    ws.columns = [
      { width: 12 }, // A: 대분류
      { width: 24 }, // B: 상품명
      { width: 10 }, // C: 기간(월)
      { width: 14 }, // D: 금액
      { width: 14 }, // E: 총액
      { width: 48 }, // F: 비고
    ]

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

    // ── 날짜 / 수신 + 공급자 정보 ─────────────────────────
    const s = SUPPLIER

    ws.getRow(2).height = 18
    ws.getRow(3).height = 18
    ws.getRow(4).height = 18
    ws.getRow(5).height = 18
    ws.getRow(6).height = 18
    ws.getRow(7).height = 18

    // 왼쪽: 날짜, 수신
    ws.getCell('A2').value = quoteDate
    ws.getCell('A2').font = { size: 9 }
    ws.mergeCells('A2:B2')

    ws.getCell('A3').value = `수 신 : ${recipient}`
    ws.getCell('A3').font = { size: 9 }
    ws.mergeCells('A3:B3')

    ws.getCell('A5').value = '아래와 같이 견적합니다.'
    ws.getCell('A5').font = { bold: true, size: 9 }
    ws.mergeCells('A5:B5')

    // 오른쪽: 공급자 테이블 (C~F, 행 2~6)
    const supplierData = [
      ['상  호', s.name, '사업자번호', s.business_no],
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
        // v1: col D, label2: col E, v2: col F
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
        val2Cell.alignment = { horizontal: 'left', vertical: 'middle' }
        applyBorder(val2Cell)
      } else {
        // 사업장/계좌정보: D~F 병합
        ws.mergeCells(rowNum, 4, rowNum, 6)
        const wideCell = ws.getCell(rowNum, 4)
        wideCell.value = v1
        wideCell.font = { size: 8, color: l1 === '계좌정보' ? { argb: 'FFCC0000' } : undefined }
        wideCell.alignment = { horizontal: 'left', vertical: 'middle' }
        applyBorder(wideCell)
      }
    })

    // ── 빈 행 (구분) ──────────────────────────────────────
    const headerRow = 8

    // ── 테이블 헤더 ───────────────────────────────────────
    ws.getRow(headerRow).height = 22
    ws.mergeCells(`A${headerRow}:B${headerRow}`)
    headerCell(ws.getCell(`A${headerRow}`), '상  품')
    headerCell(ws.getCell(`C${headerRow}`), '기간(월)')
    headerCell(ws.getCell(`D${headerRow}`), '금  액')
    headerCell(ws.getCell(`E${headerRow}`), '총  액')
    headerCell(ws.getCell(`F${headerRow}`), '비  고')

    // 서브헤더
    const subRow = headerRow + 1
    ws.getRow(subRow).height = 16
    headerCell(ws.getCell(`A${subRow}`), '대분류')
    headerCell(ws.getCell(`B${subRow}`), '상품명')
    headerCell(ws.getCell(`C${subRow}`), '')
    headerCell(ws.getCell(`D${subRow}`), '')
    headerCell(ws.getCell(`E${subRow}`), '')
    headerCell(ws.getCell(`F${subRow}`), '')

    // ── 데이터 행 ─────────────────────────────────────────
    let dataStartRow = subRow + 1
    items.forEach((item: any, i: number) => {
      const r = dataStartRow + i
      ws.getRow(r).height = 40
      dataCell(ws.getCell(`A${r}`), item.category ?? '', 'center')
      dataCell(ws.getCell(`B${r}`), item.item_name ?? '', 'center')
      dataCell(ws.getCell(`C${r}`), item.period ?? 0, 'center')
      dataCell(ws.getCell(`D${r}`), item.unit_price ?? 0, 'right')
      dataCell(ws.getCell(`E${r}`), item.total_price ?? 0, 'right')
      dataCell(ws.getCell(`F${r}`), item.note ?? '', 'left')

      // 금액/총액 숫자 포맷
      ws.getCell(`D${r}`).numFmt = '#,##0'
      ws.getCell(`E${r}`).numFmt = '#,##0'
    })

    // ── 합계 행 ───────────────────────────────────────────
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
