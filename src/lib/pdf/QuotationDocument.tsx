import {
  Document, Page, View, Text, StyleSheet, Font,
} from '@react-pdf/renderer'
import path from 'path'
import type { QuotationItem, VatType } from '@/types'
import { SUPPLIER } from '@/lib/supplier'

// ── 폰트 등록 (서버사이드 전용) ───────────────────────────
const fontDir = path.join(process.cwd(), 'public', 'fonts')
Font.register({
  family: 'NanumGothic',
  fonts: [
    { src: path.join(fontDir, 'NanumGothic.ttf'), fontWeight: 'normal' },
    { src: path.join(fontDir, 'NanumGothicBold.ttf'), fontWeight: 'bold' },
  ],
})

// ── 스타일 ────────────────────────────────────────────────
const S = StyleSheet.create({
  page: {
    fontFamily: 'NanumGothic',
    fontSize: 8,
    paddingHorizontal: 18 * 2.835,   // 18mm → pt
    paddingVertical: 16 * 2.835,
    color: '#1a1a1a',
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 16,
    letterSpacing: 6,
  },
  // 날짜+수신 / 공급자 섹션
  infoRow: { flexDirection: 'row', marginBottom: 10 },
  infoLeft: { flex: 0.38, paddingRight: 8 },
  infoRight: { flex: 0.62 },
  infoText: { fontSize: 8.5, lineHeight: 1.6 },
  infoBold: { fontSize: 8.5, fontWeight: 'bold', lineHeight: 1.6 },
  // 공급자 테이블
  supplierTable: { borderWidth: 1, borderColor: '#333' },
  supplierRow: { flexDirection: 'row', borderBottomWidth: 0.5, borderColor: '#333', minHeight: 16 },
  supplierLastRow: { flexDirection: 'row', minHeight: 16 },
  supplierLabel: {
    width: '13%', backgroundColor: '#d9d9d9',
    borderRightWidth: 0.5, borderColor: '#333',
    justifyContent: 'center', alignItems: 'center',
    paddingVertical: 2,
  },
  supplierLabel2: {
    width: '16%', backgroundColor: '#d9d9d9',
    borderRightWidth: 0.5, borderColor: '#333',
    justifyContent: 'center', alignItems: 'center',
    paddingVertical: 2,
  },
  supplierVal: {
    width: '22%',
    borderRightWidth: 0.5, borderColor: '#333',
    justifyContent: 'center', paddingHorizontal: 3, paddingVertical: 2,
  },
  supplierValWide: {
    flex: 1, justifyContent: 'center',
    paddingHorizontal: 3, paddingVertical: 2,
  },
  labelText: { fontSize: 7.5, fontWeight: 'bold', textAlign: 'center' },
  valText: { fontSize: 7.5 },
  bankText: { fontSize: 7.5, color: 'red' },
  // 항목 테이블
  table: { borderWidth: 1, borderColor: '#333', marginBottom: 4 },
  tableHeader: { flexDirection: 'row', backgroundColor: '#d9d9d9', borderBottomWidth: 1, borderColor: '#333', minHeight: 20 },
  tableRow: { flexDirection: 'row', borderBottomWidth: 0.5, borderColor: '#d0d0d0' },
  tableLastRow: { flexDirection: 'row' },
  colCat:   { width: '10%', borderRightWidth: 0.5, borderColor: '#d0d0d0', justifyContent: 'center', paddingHorizontal: 3, paddingVertical: 3 },
  colName:  { width: '18%', borderRightWidth: 0.5, borderColor: '#d0d0d0', justifyContent: 'center', paddingHorizontal: 3, paddingVertical: 3 },
  colPer:   { width: '9%',  borderRightWidth: 0.5, borderColor: '#d0d0d0', justifyContent: 'center', alignItems: 'center', paddingVertical: 3 },
  colUnit:  { width: '13%', borderRightWidth: 0.5, borderColor: '#d0d0d0', justifyContent: 'center', alignItems: 'flex-end', paddingHorizontal: 3, paddingVertical: 3 },
  colTotal: { width: '13%', borderRightWidth: 0.5, borderColor: '#d0d0d0', justifyContent: 'center', alignItems: 'flex-end', paddingHorizontal: 3, paddingVertical: 3 },
  colNote:  { flex: 1, justifyContent: 'flex-start', paddingHorizontal: 4, paddingVertical: 4 },
  noteText: { fontSize: 7, lineHeight: 1.6 },
  headerText: { fontSize: 8, fontWeight: 'bold', textAlign: 'center' },
  cellText: { fontSize: 7.5 },
  // 합계 행
  totalRow: { flexDirection: 'row', borderWidth: 1, borderColor: '#333' },
  totalLabel: { flex: 1, paddingHorizontal: 6, paddingVertical: 4, justifyContent: 'center' },
  totalAmount: { width: '20%', paddingHorizontal: 6, paddingVertical: 4, justifyContent: 'center', alignItems: 'flex-end', borderLeftWidth: 0.5, borderColor: '#d0d0d0' },
  totalVat: { width: '16%', paddingHorizontal: 4, paddingVertical: 4, justifyContent: 'center', alignItems: 'center', borderLeftWidth: 0.5, borderColor: '#d0d0d0' },
})

// ── 유틸 ──────────────────────────────────────────────────
function fmtNum(n: number) { return n.toLocaleString('ko-KR') }

function noteLines(note: string): string[] {
  if (!note) return []
  return note.split('\n').map(l => l.trim()).filter(Boolean)
}

function formatBank(bank: string) {
  // 계좌번호 부분을 분리해서 반환 (색상 처리는 별도 컴포넌트)
  const parts = bank.trim().split(' ')
  return parts
}

// ── VAT 표기 ──────────────────────────────────────────────
const VAT_MAP: Record<VatType, string> = {
  excluded: '부가세 별도',
  included: '부가세 포함',
  none: '',
}

// ── 공급자 테이블 ─────────────────────────────────────────
function SupplierTable() {
  const s = SUPPLIER
  const bankParts = formatBank(s.bank)

  return (
    <View style={S.supplierTable}>
      {/* row 0: 상호 / 사업자번호 */}
      <View style={S.supplierRow}>
        <View style={S.supplierLabel}><Text style={S.labelText}>상  호</Text></View>
        <View style={S.supplierVal}><Text style={S.valText}>{s.name}</Text></View>
        <View style={S.supplierLabel2}><Text style={S.labelText}>사업자번호</Text></View>
        <View style={S.supplierValWide}><Text style={S.valText}>{s.business_no}</Text></View>
      </View>
      {/* row 1: 대표자 / 연락처 */}
      <View style={S.supplierRow}>
        <View style={S.supplierLabel}><Text style={S.labelText}>대표자</Text></View>
        <View style={S.supplierVal}><Text style={S.valText}>{s.ceo}</Text></View>
        <View style={S.supplierLabel2}><Text style={S.labelText}>연  락  처</Text></View>
        <View style={S.supplierValWide}><Text style={S.valText}>{s.phone}</Text></View>
      </View>
      {/* row 2: 사업장 (full width) */}
      <View style={S.supplierRow}>
        <View style={S.supplierLabel}><Text style={S.labelText}>사업장</Text></View>
        <View style={S.supplierValWide}><Text style={S.valText}>{s.address}</Text></View>
      </View>
      {/* row 3: 업태 / 종목 */}
      <View style={S.supplierRow}>
        <View style={S.supplierLabel}><Text style={S.labelText}>업  태</Text></View>
        <View style={S.supplierVal}><Text style={S.valText}>{s.business_type}</Text></View>
        <View style={S.supplierLabel2}><Text style={S.labelText}>종  목</Text></View>
        <View style={S.supplierValWide}><Text style={S.valText}>{s.business_item}</Text></View>
      </View>
      {/* row 4: 계좌정보 (계좌번호 빨간색) */}
      <View style={S.supplierLastRow}>
        <View style={S.supplierLabel}><Text style={S.labelText}>계좌정보</Text></View>
        <View style={S.supplierValWide}>
          <Text>
            {bankParts.map((part, i) => {
              const isAccount = /\d/.test(part) && part.includes('-')
              return (
                <Text key={i} style={isAccount ? S.bankText : S.valText}>
                  {i > 0 ? ' ' : ''}{part}
                </Text>
              )
            })}
          </Text>
        </View>
      </View>
    </View>
  )
}

// ── 항목 테이블 ───────────────────────────────────────────
function ItemsTable({ items }: { items: QuotationItem[] }) {
  return (
    <View style={S.table}>
      {/* 헤더 */}
      <View style={S.tableHeader}>
        <View style={[S.colCat, S.colName, { width: '28%' }]}><Text style={S.headerText}>상  품</Text></View>
        <View style={S.colPer}><Text style={S.headerText}>기간(월)</Text></View>
        <View style={[S.colUnit, { alignItems: 'center' }]}><Text style={S.headerText}>금  액</Text></View>
        <View style={[S.colTotal, { alignItems: 'center' }]}><Text style={S.headerText}>총  액</Text></View>
        <View style={S.colNote}><Text style={S.headerText}>비  고</Text></View>
      </View>
      {/* 서브헤더 (대분류 / 상품명 구분) */}
      <View style={[S.tableRow, { backgroundColor: '#f5f5f5' }]}>
        <View style={S.colCat}><Text style={[S.headerText, { fontSize: 7 }]}>대분류</Text></View>
        <View style={S.colName}><Text style={[S.headerText, { fontSize: 7 }]}>상품명</Text></View>
        <View style={S.colPer}></View>
        <View style={S.colUnit}></View>
        <View style={S.colTotal}></View>
        <View style={S.colNote}></View>
      </View>
      {/* 데이터 행 */}
      {items.map((item, i) => {
        const isLast = i === items.length - 1
        const RowStyle = isLast ? S.tableLastRow : S.tableRow
        return (
          <View key={i} style={RowStyle} wrap={false}>
            <View style={S.colCat}><Text style={S.cellText}>{item.category}</Text></View>
            <View style={S.colName}><Text style={S.cellText}>{item.item_name}</Text></View>
            <View style={S.colPer}><Text style={S.cellText}>{item.period}</Text></View>
            <View style={S.colUnit}><Text style={S.cellText}>{fmtNum(item.unit_price)}</Text></View>
            <View style={S.colTotal}><Text style={S.cellText}>{fmtNum(item.total_price)}</Text></View>
            <View style={S.colNote}>
              {noteLines(item.note).map((line, li) => (
                <Text key={li} style={S.noteText}>{line}</Text>
              ))}
            </View>
          </View>
        )
      })}
    </View>
  )
}

// ── 합계 행 ───────────────────────────────────────────────
function TotalRow({ total, vatType }: { total: number; vatType: VatType }) {
  return (
    <View style={S.totalRow}>
      <View style={S.totalLabel}>
        <Text style={{ fontSize: 8.5, fontWeight: 'bold' }}>합  계 (부가세포함)</Text>
      </View>
      <View style={S.totalAmount}>
        <Text style={{ fontSize: 8.5, fontWeight: 'bold' }}>{fmtNum(total)}</Text>
      </View>
      <View style={S.totalVat}>
        <Text style={{ fontSize: 8, color: 'red', fontWeight: 'bold' }}>{VAT_MAP[vatType]}</Text>
      </View>
    </View>
  )
}

// ── 메인 Document ─────────────────────────────────────────
export interface QuotationDocProps {
  quoteDate: string
  recipient: string
  items: QuotationItem[]
  totalAmount: number
  vatType: VatType
}

export default function QuotationDocument({
  quoteDate, recipient, items, totalAmount, vatType,
}: QuotationDocProps) {
  return (
    <Document>
      <Page size="A4" style={S.page}>
        {/* 제목 */}
        <Text style={S.title}>견  적  서</Text>

        {/* 날짜+수신 / 공급자 */}
        <View style={S.infoRow}>
          <View style={S.infoLeft}>
            <Text style={S.infoText}>{quoteDate}</Text>
            <Text style={{ ...S.infoText, marginTop: 8 }}>수 신 : {recipient}</Text>
            <Text style={{ ...S.infoBold, marginTop: 16 }}>아래와 같이 견적합니다.</Text>
          </View>
          <View style={S.infoRight}>
            <SupplierTable />
          </View>
        </View>

        {/* 항목 테이블 */}
        <ItemsTable items={items} />

        {/* 합계 */}
        <TotalRow total={totalAmount} vatType={vatType} />
      </Page>
    </Document>
  )
}
