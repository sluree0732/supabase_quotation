import {
  Document, Page, View, Text, StyleSheet, Font, Image,
} from '@react-pdf/renderer'
import path from 'path'
import type { QuotationItem, VatType } from '@/types'

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
    paddingHorizontal: 18 * 2.835,
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
  infoRow: { flexDirection: 'row', marginBottom: 10 },
  infoLeft: { flex: 0.38, paddingRight: 8 },
  infoRight: { flex: 0.62 },
  infoText: { fontSize: 8.5, lineHeight: 1.6 },
  infoBold: { fontSize: 8.5, fontWeight: 'bold', lineHeight: 1.6 },
  // 공급자 테이블
  supplierTable: { borderWidth: 1, borderColor: '#333' },
  supplierRow: { flexDirection: 'row', borderBottomWidth: 0.5, borderColor: '#333', minHeight: 20 },
  supplierLastRow: { flexDirection: 'row', minHeight: 20 },
  supplierLabel: {
    width: '13%', backgroundColor: '#d9d9d9',
    borderRightWidth: 0.5, borderColor: '#333',
    justifyContent: 'center', alignItems: 'center',
    paddingVertical: 4,
  },
  supplierLabel2: {
    width: '16%', backgroundColor: '#d9d9d9',
    borderRightWidth: 0.5, borderColor: '#333',
    justifyContent: 'center', alignItems: 'center',
    paddingVertical: 4,
  },
  supplierVal: {
    width: '22%',
    borderRightWidth: 0.5, borderColor: '#333',
    justifyContent: 'center', paddingHorizontal: 3, paddingVertical: 4,
  },
  supplierValWide: {
    flex: 1, justifyContent: 'center',
    paddingHorizontal: 3, paddingVertical: 4,
  },
  labelText: { fontSize: 7.5, fontWeight: 'bold', textAlign: 'center' },
  valText: { fontSize: 7.5, textAlign: 'center' },
  bankText: { fontSize: 7.5, color: 'red' },
  // 항목 테이블
  table: { borderWidth: 1, borderColor: '#333' },
  tableHeader: { flexDirection: 'row', backgroundColor: '#d9d9d9', borderBottomWidth: 1, borderColor: '#333', minHeight: 20 },
  tableRow: { flexDirection: 'row', borderBottomWidth: 0.5, borderColor: '#d0d0d0' },
  tableLastRow: { flexDirection: 'row' },
  colProduct: { width: '26%', borderRightWidth: 0.5, borderColor: '#d0d0d0', justifyContent: 'center', alignItems: 'center', paddingHorizontal: 2, paddingVertical: 3 },
  colCat:   { width: '9%',  borderRightWidth: 0.5, borderColor: '#d0d0d0', justifyContent: 'center', alignItems: 'center', paddingHorizontal: 2, paddingVertical: 3 },
  colName:  { width: '17%', borderRightWidth: 0.5, borderColor: '#d0d0d0', justifyContent: 'center', alignItems: 'center', paddingHorizontal: 2, paddingVertical: 3 },
  colQty:   { width: '7%',  borderRightWidth: 0.5, borderColor: '#d0d0d0', justifyContent: 'center', alignItems: 'center', paddingHorizontal: 2, paddingVertical: 3 },
  colUnit:  { width: '12%', borderRightWidth: 0.5, borderColor: '#d0d0d0', justifyContent: 'center', alignItems: 'center', paddingHorizontal: 2, paddingVertical: 3 },
  colTotal: { width: '12%', borderRightWidth: 0.5, borderColor: '#d0d0d0', justifyContent: 'center', alignItems: 'center', paddingHorizontal: 2, paddingVertical: 3 },
  colNote:  { flex: 1, justifyContent: 'flex-start', paddingHorizontal: 4, paddingVertical: 4 },
  // 데이터 행 전용: items stack(91%)이 컨테이너이므로 비율 보정 (헤더/합계는 테이블 직접 자식)
  dataColName:  { width: '18.68%', borderRightWidth: 0.5, borderColor: '#d0d0d0', justifyContent: 'center', alignItems: 'center', paddingHorizontal: 2, paddingVertical: 3 },
  dataColQty:   { width: '7.69%',  borderRightWidth: 0.5, borderColor: '#d0d0d0', justifyContent: 'center', alignItems: 'center', paddingHorizontal: 2, paddingVertical: 3 },
  dataColUnit:  { width: '13.19%', borderRightWidth: 0.5, borderColor: '#d0d0d0', justifyContent: 'center', alignItems: 'center', paddingHorizontal: 2, paddingVertical: 3 },
  dataColTotal: { width: '13.19%', borderRightWidth: 0.5, borderColor: '#d0d0d0', justifyContent: 'center', alignItems: 'center', paddingHorizontal: 2, paddingVertical: 3 },
  noteText: { fontSize: 7, lineHeight: 1.6, textAlign: 'center' },
  headerText: { fontSize: 8, fontWeight: 'bold', textAlign: 'center' },
  cellText: { fontSize: 7.5, textAlign: 'center' },
  // 합계 행
  totalRow: { flexDirection: 'row', borderTopWidth: 1, borderColor: '#333' },
  totalLabel: { width: '45%', paddingHorizontal: 6, paddingVertical: 4, justifyContent: 'center', alignItems: 'center' },
  totalAmount: { width: '12%', paddingHorizontal: 4, paddingVertical: 4, justifyContent: 'center', alignItems: 'center', borderLeftWidth: 0.5, borderColor: '#d0d0d0' },
  totalVat: { flex: 1, paddingHorizontal: 4, paddingVertical: 4, justifyContent: 'center', alignItems: 'center', borderLeftWidth: 0.5, borderColor: '#d0d0d0' },
})

// ── 유틸 ──────────────────────────────────────────────────
function fmtNum(n: number) { return n.toLocaleString('ko-KR') }

function noteLines(note: string): string[] {
  if (!note) return []
  return note.split('\n').map(l => l.trim()).filter(Boolean)
}

function formatBank(bank: string) {
  return bank.trim().split(' ')
}

const VAT_MAP: Record<VatType, string> = {
  excluded: '부가세 별도',
  included: '부가세 포함',
  none: '',
}

const DEFAULT_STAMP_PATH = path.join(process.cwd(), 'public', 'images', 'stamp.png')

interface SenderInfo {
  name?: string | null
  address?: string | null
  phone?: string | null
  business_no?: string | null
  business_type?: string | null
  business_item?: string | null
  ceo?: string | null
  bank?: string | null
}

// ── 공급자 테이블 ─────────────────────────────────────────
function SupplierTable({ stampSrc, senderInfo }: { stampSrc: string; senderInfo?: SenderInfo | null }) {
  const name = senderInfo?.name ?? ''
  const address = senderInfo?.address ?? ''
  const phone = senderInfo?.phone ?? ''
  const businessNo = senderInfo?.business_no ?? ''
  const businessType = senderInfo?.business_type ?? ''
  const businessItem = senderInfo?.business_item ?? ''
  const ceo = senderInfo?.ceo ?? ''
  const bankParts = formatBank(senderInfo?.bank ?? '')

  return (
    <View style={S.supplierTable}>
      {/* row 0+1: 상호/대표자 */}
      <View style={{ flexDirection: 'row', borderBottomWidth: 0.5, borderColor: '#333' }}>
        <View style={{ width: '51%' }}>
          <View style={{ flexDirection: 'row', borderBottomWidth: 0.5, borderColor: '#333', minHeight: 20 }}>
            <View style={{ width: '25.5%', backgroundColor: '#d9d9d9', borderRightWidth: 0.5, borderColor: '#333', justifyContent: 'center', alignItems: 'center', paddingVertical: 4 }}>
              <Text style={S.labelText}>상  호</Text>
            </View>
            <View style={{ width: '43.1%', borderRightWidth: 0.5, borderColor: '#333', justifyContent: 'center', paddingHorizontal: 3, paddingVertical: 4 }}>
              <Text style={S.valText}>{name}</Text>
            </View>
            <View style={{ flex: 1, backgroundColor: '#d9d9d9', justifyContent: 'center', alignItems: 'center', paddingVertical: 4 }}>
              <Text style={S.labelText}>사업자 등록번호</Text>
            </View>
          </View>
          <View style={{ flexDirection: 'row', minHeight: 20 }}>
            <View style={{ width: '25.5%', backgroundColor: '#d9d9d9', borderRightWidth: 0.5, borderColor: '#333', justifyContent: 'center', alignItems: 'center', paddingVertical: 4 }}>
              <Text style={S.labelText}>대표자</Text>
            </View>
            <View style={{ width: '43.1%', borderRightWidth: 0.5, borderColor: '#333', justifyContent: 'center', paddingHorizontal: 3, paddingVertical: 4 }}>
              <Text style={S.valText}>{ceo}</Text>
            </View>
            <View style={{ flex: 1, backgroundColor: '#d9d9d9', justifyContent: 'center', alignItems: 'center', paddingVertical: 4 }}>
              <Text style={S.labelText}>연  락  처</Text>
            </View>
          </View>
        </View>
        <View style={{ flex: 1, borderLeftWidth: 0.5, borderColor: '#333' }}>
          <View style={{ flex: 1, borderBottomWidth: 0.5, borderColor: '#333', flexDirection: 'row', alignItems: 'center' }}>
            <View style={{ width: 42, justifyContent: 'center', alignItems: 'center', paddingVertical: 1, paddingLeft: 2 }}>
              <Image src={stampSrc} style={{ width: 40, height: 40 }} />
            </View>
            <Text style={[S.valText, { flex: 1, paddingHorizontal: 3 }]}>{businessNo}</Text>
          </View>
          <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center' }}>
            <View style={{ width: 42 }} />
            <Text style={[S.valText, { flex: 1, paddingHorizontal: 3 }]}>{phone}</Text>
          </View>
        </View>
      </View>
      {/* row 2: 사업장 */}
      <View style={S.supplierRow}>
        <View style={S.supplierLabel}><Text style={S.labelText}>사업장</Text></View>
        <View style={S.supplierValWide}><Text style={S.valText}>{address}</Text></View>
      </View>
      {/* row 3: 업태 / 종목 */}
      <View style={S.supplierRow}>
        <View style={S.supplierLabel}><Text style={S.labelText}>업  태</Text></View>
        <View style={S.supplierVal}><Text style={S.valText}>{businessType}</Text></View>
        <View style={S.supplierLabel2}><Text style={S.labelText}>종  목</Text></View>
        <View style={S.supplierValWide}><Text style={S.valText}>{businessItem}</Text></View>
      </View>
      {/* row 4: 계좌정보 */}
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

// ── 카테고리 그룹 묶기 ────────────────────────────────────
function groupItems(items: QuotationItem[]) {
  const groups: { category: string; items: QuotationItem[]; startIdx: number }[] = []
  let i = 0
  while (i < items.length) {
    let j = i
    while (j + 1 < items.length && items[j + 1].category === items[i].category) j++
    groups.push({ category: items[i].category ?? '', items: items.slice(i, j + 1), startIdx: i })
    i = j + 1
  }
  return groups
}

// ── 항목 테이블 ───────────────────────────────────────────
function ItemsTable({ items, total, vatType }: { items: QuotationItem[]; total: number; vatType: VatType }) {
  const groups = groupItems(items)
  const vatLabel = VAT_MAP[vatType]

  return (
    <View style={S.table}>
      {/* 단일 헤더 행 */}
      <View style={S.tableHeader}>
        <View style={S.colProduct}><Text style={S.headerText}>상  품</Text></View>
        <View style={S.colQty}><Text style={S.headerText}>수량</Text></View>
        <View style={S.colUnit}><Text style={S.headerText}>금액</Text></View>
        <View style={S.colTotal}><Text style={S.headerText}>총액</Text></View>
        <View style={S.colNote}><Text style={S.headerText}>비고</Text></View>
      </View>
      {/* 데이터 행 - 그룹 단위 렌더링 */}
      {groups.map((group, gi) => {
        const isLastGroup = gi === groups.length - 1
        return (
          <View key={gi} style={{ flexDirection: 'row' }}>
            {/* 카테고리: 그룹 전체 높이 세로 중앙 */}
            <View style={[S.colCat, {
              borderBottomWidth: isLastGroup ? 0 : 0.5,
              borderColor: '#d0d0d0',
            }]}>
              <Text style={S.cellText}>{group.category}</Text>
            </View>
            {/* 아이템 스택 */}
            <View style={{ flex: 1 }}>
              {group.items.map((item, ii) => {
                const isLastItem = isLastGroup && ii === group.items.length - 1
                const RowStyle = isLastItem ? S.tableLastRow : S.tableRow
                return (
                  <View key={ii} style={RowStyle} wrap={false}>
                    <View style={S.dataColName}>
                      <Text style={S.cellText}>{item.item_name}</Text>
                    </View>
                    <View style={S.dataColQty}>
                      <Text style={S.cellText}>{item.period ?? 1}</Text>
                    </View>
                    <View style={S.dataColUnit}>
                      <Text style={S.cellText}>{fmtNum(item.unit_price)}</Text>
                    </View>
                    <View style={S.dataColTotal}>
                      <Text style={S.cellText}>{fmtNum(item.total_price ?? item.unit_price)}</Text>
                    </View>
                    <View style={S.colNote}>
                      {noteLines(item.note).map((line, li) => (
                        <Text key={li} style={S.noteText}>{line}</Text>
                      ))}
                    </View>
                  </View>
                )
              })}
            </View>
          </View>
        )
      })}
      {/* 합계 행 - 테이블 내부에 배치하여 공백 제거 */}
      <View style={S.totalRow}>
        <View style={S.totalLabel}>
          <Text style={{ fontSize: 8.5, fontWeight: 'bold', textAlign: 'center' }}>
            {`합  계${vatLabel ? ` (${vatLabel})` : ''}`}
          </Text>
        </View>
        <View style={S.totalAmount}>
          <Text style={{ fontSize: 8.5, fontWeight: 'bold' }}>{fmtNum(total)}</Text>
        </View>
        <View style={S.totalVat}>
          <Text style={{ fontSize: 8, color: 'red', fontWeight: 'bold' }}>{vatLabel}</Text>
        </View>
      </View>
    </View>
  )
}

// ── 메인 Document ─────────────────────────────────────────
export interface QuotationDocProps {
  quoteDate: string
  recipient: string
  projectName?: string | null
  items: QuotationItem[]
  totalAmount: number
  vatType: VatType
  stampSrc?: string
  senderInfo?: SenderInfo | null
}

export default function QuotationDocument({
  quoteDate, recipient, projectName, items, totalAmount, vatType, stampSrc, senderInfo,
}: QuotationDocProps) {
  return (
    <Document>
      <Page size="A4" style={S.page}>
        <Text style={S.title}>견  적  서</Text>

        <View style={S.infoRow}>
          <View style={S.infoLeft}>
            <Text style={S.infoText}>{quoteDate}</Text>
            <Text style={{ ...S.infoText, marginTop: 8 }}>수 신 : {recipient}</Text>
            {!!projectName && (
              <Text style={{ ...S.infoText, marginTop: 4 }}>프로젝트 : {projectName}</Text>
            )}
            <Text style={{ ...S.infoBold, marginTop: 16 }}>아래와 같이 견적합니다.</Text>
          </View>
          <View style={S.infoRight}>
            <SupplierTable stampSrc={stampSrc ?? DEFAULT_STAMP_PATH} senderInfo={senderInfo} />
          </View>
        </View>

        <ItemsTable items={items} total={totalAmount} vatType={vatType} />
      </Page>
    </Document>
  )
}
