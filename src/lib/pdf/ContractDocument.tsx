import React from 'react'
import {
  Document, Page, View, Text, StyleSheet, Font, Image,
} from '@react-pdf/renderer'
import path from 'path'
import type { ContractItem, VatType } from '@/types'
import { mergeArticles, getArticleBody, substituteVariables } from '@/lib/contractArticles'
import type { ContractArticles } from '@/lib/contractArticles'
import { groupByCategory } from '@/lib/groupItems'

// ── 폰트 등록 ─────────────────────────────────────────────
const fontDir = path.join(process.cwd(), 'public', 'fonts')
Font.register({
  family: 'NanumGothic',
  fonts: [
    { src: path.join(fontDir, 'NanumGothic.ttf'), fontWeight: 'normal' },
    { src: path.join(fontDir, 'NanumGothicBold.ttf'), fontWeight: 'bold' },
  ],
})

const DEFAULT_STAMP_PATH = path.join(process.cwd(), 'public', 'images', 'stamp.png')

// ── 스타일 ────────────────────────────────────────────────
const S = StyleSheet.create({
  page: {
    fontFamily: 'NanumGothic',
    fontSize: 9,
    paddingHorizontal: 20 * 2.835,
    paddingVertical: 18 * 2.835,
    color: '#1a1a1a',
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
    letterSpacing: 8,
  },
  partySection: {
    marginBottom: 14,
    fontSize: 9,
    lineHeight: 1.8,
  },
  partyTitle: {
    fontSize: 9,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  articleWrap: {
    marginBottom: 10,
  },
  articleTitle: {
    fontSize: 9,
    fontWeight: 'bold',
    marginBottom: 3,
  },
  articleBody: {
    fontSize: 8.5,
    lineHeight: 1.7,
    paddingLeft: 8,
  },
  itemLine: {
    fontSize: 8.5,
    lineHeight: 1.7,
    paddingLeft: 16,
  },
  divider: {
    borderBottomWidth: 0.5,
    borderColor: '#aaa',
    marginVertical: 10,
  },
  specialTermsBox: {
    borderWidth: 0.5,
    borderColor: '#aaa',
    padding: 8,
    marginBottom: 12,
    borderRadius: 2,
  },
  // 제2조 테이블
  table: {
    marginTop: 4,
    borderWidth: 0.5,
    borderColor: '#ccc',
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 0.5,
    borderColor: '#ccc',
  },
  tableHeader: {
    backgroundColor: '#f5f5f5',
  },
  tableCell: {
    borderRightWidth: 0.5,
    borderColor: '#ccc',
    padding: 3,
    fontSize: 7.5,
    justifyContent: 'center',
  },
  tableCellLast: {
    padding: 3,
    fontSize: 7.5,
    justifyContent: 'center',
  },
  tableCellText: {
    textAlign: 'center',
  },
  tableCellNoteText: {
    textAlign: 'left',
    fontSize: 7,
    lineHeight: 1.4,
  },
  // 서명란
  signDate: {
    fontSize: 10,
    textAlign: 'center',
    marginTop: 14,
    marginBottom: 20,
    letterSpacing: 1,
  },
  signParty: {
    marginBottom: 16,
  },
  signPartyTitle: {
    fontSize: 9,
    fontWeight: 'bold',
    marginBottom: 6,
  },
  signRow: {
    flexDirection: 'row',
    marginBottom: 5,
    fontSize: 8.5,
    paddingLeft: 12,
  },
  signLabel: {
    width: 80,
    color: '#333',
  },
  signValue: {
    flex: 1,
  },
})

// ── 유틸 ──────────────────────────────────────────────────
function fmtNum(n: number) { return n.toLocaleString('ko-KR') }

function toKoreanAmount(n: number): string {
  const units = ['', '일', '이', '삼', '사', '오', '육', '칠', '팔', '구']
  const places = ['', '십', '백', '천']
  const bigUnits = ['', '만', '억', '조']

  if (n === 0) return '영'

  let result = ''
  let bigIdx = 0

  while (n > 0) {
    const chunk = n % 10000
    if (chunk > 0) {
      let chunkStr = ''
      let tmp = chunk
      for (let i = 3; i >= 0; i--) {
        const digit = Math.floor(tmp / Math.pow(10, i)) % 10
        if (digit > 0) {
          chunkStr += (digit === 1 && i > 0 ? '' : units[digit]) + places[i]
        }
      }
      result = chunkStr + bigUnits[bigIdx] + result
    }
    bigIdx++
    n = Math.floor(n / 10000)
  }

  return '일금 ' + result + '원정'
}

function fmtDate(d: string) {
  if (!d) return '미정'
  const [y, m, dd] = d.split('-')
  return `${y}년 ${m}월 ${dd}일`
}

const VAT_MAP: Record<VatType, string> = {
  excluded: '(부가세 별도)',
  included: '(부가세 포함)',
  none: '',
}

// ── 조항 컴포넌트 ─────────────────────────────────────────
function Article({ no, title, children, allowWrap = false }: { no: number; title: string; children: React.ReactNode; allowWrap?: boolean }) {
  return (
    <View style={S.articleWrap} wrap={allowWrap}>
      <Text style={S.articleTitle}>제{no}조 ({title})</Text>
      {children}
    </View>
  )
}

// ── 메인 Document ─────────────────────────────────────────
export interface ContractDocProps {
  contractDate: string
  startDate: string
  endDate: string
  recipient: string
  companyName: string
  companyAddress?: string
  items: ContractItem[]
  totalAmount: number
  vatType: VatType
  specialTerms: string
  stampSrc?: string
  senderName?: string
  senderAddress?: string
  senderBusinessNo?: string
  senderPhone?: string
  senderCeo?: string
  senderBank?: string
  companyRepresentative?: string
  articles?: Partial<ContractArticles> | null
}

export default function ContractDocument({
  contractDate, startDate, endDate, recipient, companyName, companyAddress,
  items, totalAmount, vatType, specialTerms, stampSrc,
  senderName, senderAddress, senderBusinessNo, senderPhone,
  senderCeo, senderBank, companyRepresentative, articles,
}: ContractDocProps) {
  const resolvedSenderName = senderName ?? ''
  const resolvedSenderAddress = senderAddress ?? ''
  const resolvedSenderBusinessNo = senderBusinessNo ?? ''
  const resolvedSenderCeo = senderCeo ?? ''
  const resolvedSenderBank = senderBank ?? ''
  const A = mergeArticles(articles)
  const sortedItems = groupByCategory(items)
  const ctx = {
    items, total: totalAmount, vatType,
    startDate, endDate, contractDate,
    senderName: resolvedSenderName,
    receiverName: companyName,
    recipient,
  }
  const vatAmountNum = vatType === 'excluded' ? Math.round(totalAmount * 0.1) : 0
  const finalAmountNum = vatType === 'excluded' ? Math.round(totalAmount * 1.1) : totalAmount
  const gab = companyName
    ? companyRepresentative
      ? `${companyName} 대표 ${companyRepresentative}`
      : companyName
    : recipient

  return (
    <Document>
      <Page size="A4" style={S.page}>

        {/* 제목 */}
        <Text style={S.title}>광 고 대 행 계 약 서</Text>

        {/* 당사자 */}
        <View style={S.partySection}>
          <Text>
            <Text style={{ fontWeight: 'bold' }}>갑 (광고주) : </Text>
            <Text>{gab}</Text>
          </Text>
          <Text>
            <Text style={{ fontWeight: 'bold' }}>을 (대행사) : </Text>
            <Text>{resolvedSenderName} 대표 {resolvedSenderCeo}</Text>
          </Text>
          <Text style={{ marginTop: 4 }}>
            위 양 당사자는 아래와 같이 광고 대행 계약을 체결한다.
          </Text>
        </View>

        <View style={S.divider} />

        {/* 제1조 */}
        <Article no={1} title="목적">
          <Text style={S.articleBody}>{getArticleBody(A.fullText, 1)}</Text>
        </Article>

        {/* 제2조 — 미리보기와 동일한 테이블 구조 */}
        <Article no={2} title="업무의 범위" allowWrap={true}>
          <Text style={S.articleBody}>을은 다음의 업무를 대행한다.</Text>
          <View style={S.table}>
            {/* 헤더 행 */}
            <View style={[S.tableRow, S.tableHeader]}>
              <View style={[S.tableCell, { width: '8%' }]}><Text style={[S.tableCellText, { fontWeight: 'bold' }]}>구분</Text></View>
              <View style={[S.tableCell, { width: '17%' }]}><Text style={[S.tableCellText, { fontWeight: 'bold' }]}>상품</Text></View>
              <View style={[S.tableCell, { width: '7%' }]}><Text style={[S.tableCellText, { fontWeight: 'bold' }]}>수량</Text></View>
              <View style={[S.tableCell, { width: '15%' }]}><Text style={[S.tableCellText, { fontWeight: 'bold' }]}>금액</Text></View>
              <View style={[S.tableCell, { width: '18%' }]}><Text style={[S.tableCellText, { fontWeight: 'bold' }]}>총액</Text></View>
              <View style={[S.tableCellLast, { flex: 1 }]}><Text style={[S.tableCellText, { fontWeight: 'bold' }]}>비고</Text></View>
            </View>
            {/* 데이터 행 */}
            {(() => {
              const order: string[] = []
              const groups = new Map<string, ContractItem[]>()
              for (const it of sortedItems) {
                const cat = it.category ?? ''
                if (!groups.has(cat)) { order.push(cat); groups.set(cat, []) }
                groups.get(cat)!.push(it)
              }
              return order.map(cat => {
                const catItems = groups.get(cat) ?? []
                return catItems.map((it, i) => (
                  <View key={`${cat}-${i}`} style={S.tableRow}>
                    {/* 카테고리: 첫 행만 표시, 이후는 빈 셀 */}
                    <View style={[S.tableCell, { width: '8%' }]}>
                      {i === 0 && cat
                        ? <Text style={[S.tableCellText, { fontWeight: 'bold' }]}>{cat}</Text>
                        : null}
                    </View>
                    <View style={[S.tableCell, { width: '17%' }]}><Text style={S.tableCellText}>{it.item_name}</Text></View>
                    <View style={[S.tableCell, { width: '7%' }]}><Text style={S.tableCellText}>{it.period}</Text></View>
                    <View style={[S.tableCell, { width: '15%' }]}><Text style={S.tableCellText}>{fmtNum(it.unit_price)}</Text></View>
                    <View style={[S.tableCell, { width: '18%' }]}><Text style={S.tableCellText}>{fmtNum(it.total_price)}</Text></View>
                    <View style={[S.tableCellLast, { flex: 1 }]}>
                      <Text style={S.tableCellNoteText}>{it.note ?? ''}</Text>
                    </View>
                  </View>
                ))
              })
            })()}
            {/* 합계 행 — 데이터 행과 동일한 6컬럼 구조, 앞 4셀 border 제거로 병합 효과 */}
            <View style={[S.tableRow, S.tableHeader]}>
              <View style={[S.tableCell, { width: '8%', borderRightWidth: 0 }]}><Text style={[S.tableCellText, { fontWeight: 'bold' }]}>합 계</Text></View>
              <View style={[S.tableCell, { width: '17%', borderRightWidth: 0 }]}><Text> </Text></View>
              <View style={[S.tableCell, { width: '7%', borderRightWidth: 0 }]}><Text> </Text></View>
              <View style={[S.tableCell, { width: '15%' }]}><Text> </Text></View>
              <View style={[S.tableCell, { width: '18%' }]}><Text style={[S.tableCellText, { fontWeight: 'bold' }]}>{fmtNum(totalAmount)}원</Text></View>
              <View style={[S.tableCellLast, { flex: 1 }]}>
                <Text style={[S.tableCellText, { color: '#e74c3c', fontWeight: 'bold' }]}>{VAT_MAP[vatType]}</Text>
              </View>
            </View>
          </View>
        </Article>

        {/* 제3조 */}
        <Article no={3} title="계약 기간">
          <Text style={S.articleBody}>{substituteVariables(getArticleBody(A.fullText, 3), ctx)}</Text>
        </Article>

        {/* 제4조 */}
        <Article no={4} title="광고 비용 및 대금 지급">
          <Text style={S.articleBody}>
            1. 공급가액: {toKoreanAmount(totalAmount)} (₩{fmtNum(totalAmount)})
          </Text>
          <Text style={[S.articleBody, { paddingLeft: 16, marginTop: 2 }]}>
            부가세(10%): ₩{fmtNum(vatAmountNum)}
          </Text>
          <Text style={[S.articleBody, { paddingLeft: 16, marginTop: 2 }]}>
            최종 지급액: ₩{fmtNum(finalAmountNum)}
          </Text>
          <Text style={[S.articleBody, { paddingLeft: 16, marginTop: 2 }]}>
            • 예산 세부 내역은 별첨된 견적서에 따른다.
          </Text>
          <Text style={[S.articleBody, { marginTop: 4 }]}>2. 지급 방법:</Text>
          {(() => {
            const body = getArticleBody(A.fullText, 4)
            const paymentMatch = body.match(/2\.\s*지급 방법[:\s]*\n([\s\S]*)/)
            const paymentText = paymentMatch ? paymentMatch[1].trim() : ''
            return paymentText.split('\n').map((line, i) => (
              <Text key={i} style={[S.articleBody, { paddingLeft: 16 }]}>{line}</Text>
            ))
          })()}
          <Text style={[S.articleBody, { marginTop: 4 }]}>
            3. 결제 계좌: {resolvedSenderBank || '미등록'} (예금주: {resolvedSenderCeo})
          </Text>
        </Article>

        {[5, 6, 7, 8, 9].map(no => {
          const body = substituteVariables(getArticleBody(A.fullText, no), ctx)
          if (!body) return null
          const titleMap: Record<number, string> = {
            5: '광고물 승인', 6: '저작권', 7: '비밀유지', 8: '계약의 해지', 9: '관할법원',
          }
          return (
            <Article key={no} no={no} title={titleMap[no] ?? ''}>
              <Text style={S.articleBody}>{body}</Text>
            </Article>
          )
        })}

        {/* 특약사항 */}
        {specialTerms ? (
          <View style={S.articleWrap} wrap={false}>
            <Text style={S.articleTitle}>특약사항</Text>
            <View style={S.specialTermsBox}>
              <Text style={{ fontSize: 8.5, lineHeight: 1.7 }}>{specialTerms}</Text>
            </View>
          </View>
        ) : null}

        {/* 서명 전체 wrap={false} — 페이지 중간에서 잘리지 않게 */}
        <View wrap={false}>
          {/* 계약일 */}
          <Text style={S.signDate}>{fmtDate(contractDate)}</Text>

          {/* 갑 서명란 */}
          <View style={S.signParty}>
            <Text style={S.signPartyTitle}>갑 (광고주)</Text>
            {companyName ? (
              <View style={S.signRow}>
                <Text style={S.signLabel}>- 업 체 명 :</Text>
                <Text style={S.signValue}>{companyName}</Text>
              </View>
            ) : null}
            <View style={S.signRow}>
              <Text style={S.signLabel}>- 대 표 자 :</Text>
              <Text style={S.signValue}>{companyRepresentative || recipient}</Text>
            </View>
            <View style={S.signRow}>
              <Text style={S.signLabel}>- 주    소 :</Text>
              <Text style={S.signValue}>{companyAddress || ''}</Text>
            </View>
            <View style={[S.signRow, { marginTop: 6 }]}>
              <Text style={S.signLabel}>- 서    명 :</Text>
              <Text style={S.signValue}> </Text>
            </View>
          </View>

          {/* 을 서명란 */}
          <View style={S.signParty}>
            <Text style={S.signPartyTitle}>을 (대행사)</Text>
            <View style={S.signRow}>
              <Text style={S.signLabel}>- 상    호 :</Text>
              <Text style={S.signValue}>{resolvedSenderName}</Text>
            </View>
            <View style={S.signRow}>
              <Text style={S.signLabel}>- 대 표 자 :</Text>
              <Text style={S.signValue}>{resolvedSenderCeo}</Text>
            </View>
            <View style={S.signRow}>
              <Text style={S.signLabel}>- 주    소 :</Text>
              <Text style={[S.signValue, { fontSize: 8 }]}>{resolvedSenderAddress}</Text>
            </View>
            <View style={S.signRow}>
              <Text style={S.signLabel}>- 사업자 등록번호 :</Text>
              <Text style={S.signValue}>{resolvedSenderBusinessNo}</Text>
            </View>
            <View style={[S.signRow, { marginTop: 6, alignItems: 'center' }]}>
              <Text style={S.signLabel}>- 서    명 :</Text>
              <View style={{ flex: 1 }}>
                <Image src={stampSrc ?? DEFAULT_STAMP_PATH} style={{ width: 48, height: 48 }} />
              </View>
            </View>
          </View>
        </View>

      </Page>
    </Document>
  )
}
