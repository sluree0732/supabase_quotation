import React from 'react'
import {
  Document, Page, View, Text, StyleSheet, Font, Image,
} from '@react-pdf/renderer'
import path from 'path'
import type { ContractItem, VatType } from '@/types'
import { mergeArticles } from '@/lib/contractArticles'
import type { ContractArticles } from '@/lib/contractArticles'

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
    width: 56,
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
function Article({ no, title, children }: { no: number; title: string; children: React.ReactNode }) {
  return (
    <View style={S.articleWrap} wrap={false}>
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
          <Text style={S.articleBody}>{A.a1}</Text>
        </Article>

        {/* 제2조 */}
        <Article no={2} title="업무의 범위">
          <Text style={S.articleBody}>을은 다음의 업무를 대행한다.</Text>
          {items.map((it, i) => (
            <Text key={i} style={S.itemLine}>
              {i + 1}. {it.category ? `[${it.category}] ` : ''}{it.item_name}
            </Text>
          ))}
        </Article>

        {/* 제3조 */}
        <Article no={3} title="계약 기간">
          <Text style={S.articleBody}>
            본 계약의 기간은 {fmtDate(startDate)}부터 {fmtDate(endDate)}까지로 한다.
          </Text>
        </Article>

        {/* 제4조 */}
        <Article no={4} title="광고 비용 및 대금 지급">
          <Text style={S.articleBody}>
            1. 총 광고 예산: {toKoreanAmount(totalAmount)} (₩{fmtNum(totalAmount)} / {vatType === 'excluded' ? '부가세 별도' : vatType === 'included' ? '부가세 포함' : '부가세 없음'})
          </Text>
          <Text style={[S.articleBody, { paddingLeft: 24, marginTop: 2 }]}>
            • 예산 세부 내역(매체비, 제작비, 대행 수수료 등)은 별첨된 견적서에 따른다.
          </Text>
          <Text style={[S.articleBody, { marginTop: 4 }]}>
            2. 지급 방법:
          </Text>
          {A.a4_payment.split('\n').map((line, i) => (
            <Text key={i} style={[S.articleBody, { paddingLeft: 24, marginTop: i === 0 ? 2 : 0 }]}>{line}</Text>
          ))}
          <Text style={[S.articleBody, { marginTop: 4 }]}>
            2. 결제 계좌: {resolvedSenderBank.trim().split(' ').filter((p: string) => !(/\d/.test(p) && p.includes('-'))).join(' ')} {resolvedSenderBank.trim().split(' ').find((p: string) => /\d/.test(p) && p.includes('-')) ?? ''} (예금주: {resolvedSenderCeo})
          </Text>
        </Article>

        {/* 제5조 */}
        <Article no={5} title="광고물 승인">
          <Text style={S.articleBody}>{A.a5}</Text>
        </Article>

        {/* 제6조 */}
        <Article no={6} title="저작권">
          <Text style={S.articleBody}>{A.a6}</Text>
        </Article>

        {/* 제7조 */}
        <Article no={7} title="비밀유지">
          <Text style={S.articleBody}>{A.a7}</Text>
        </Article>

        {/* 제8조 */}
        <Article no={8} title="계약의 해지">
          <Text style={S.articleBody}>{A.a8}</Text>
        </Article>

        {/* 제9조 */}
        <Article no={9} title="관할법원">
          <Text style={S.articleBody}>{A.a9}</Text>
        </Article>

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
