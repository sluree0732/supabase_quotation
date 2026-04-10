import React from 'react'
import {
  Document, Page, View, Text, StyleSheet, Font, Image,
} from '@react-pdf/renderer'
import path from 'path'
import type { ContractItem, VatType } from '@/types'
import { SUPPLIER } from '@/lib/supplier'

// ── 폰트 등록 ─────────────────────────────────────────────
const fontDir = path.join(process.cwd(), 'public', 'fonts')
Font.register({
  family: 'NanumGothic',
  fonts: [
    { src: path.join(fontDir, 'NanumGothic.ttf'), fontWeight: 'normal' },
    { src: path.join(fontDir, 'NanumGothicBold.ttf'), fontWeight: 'bold' },
  ],
})

const stampPath = path.join(process.cwd(), 'public', 'images', 'stamp.png')

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
  signSection: {
    marginTop: 16,
    flexDirection: 'row',
    gap: 20,
  },
  signBox: {
    flex: 1,
    borderWidth: 0.5,
    borderColor: '#aaa',
    padding: 10,
  },
  signTitle: {
    fontSize: 9,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
    borderBottomWidth: 0.5,
    borderColor: '#ccc',
    paddingBottom: 4,
  },
  signRow: {
    flexDirection: 'row',
    marginBottom: 5,
    fontSize: 8.5,
    minHeight: 14,
  },
  signLabel: {
    width: 40,
    color: '#555',
  },
  signValue: {
    flex: 1,
  },
  signDate: {
    fontSize: 9,
    textAlign: 'center',
    marginTop: 14,
    marginBottom: 10,
    letterSpacing: 1,
  },
})

// ── 유틸 ──────────────────────────────────────────────────
function fmtNum(n: number) { return n.toLocaleString('ko-KR') }

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
  items: ContractItem[]
  totalAmount: number
  vatType: VatType
  specialTerms: string
}

export default function ContractDocument({
  contractDate, startDate, endDate, recipient, companyName,
  items, totalAmount, vatType, specialTerms,
}: ContractDocProps) {
  const gab = companyName ? `${companyName} (${recipient})` : recipient

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
            <Text>{SUPPLIER.name} 대표 {SUPPLIER.ceo}</Text>
          </Text>
          <Text style={{ marginTop: 4 }}>
            위 양 당사자는 아래와 같이 광고 대행 계약을 체결한다.
          </Text>
        </View>

        <View style={S.divider} />

        {/* 제1조 */}
        <Article no={1} title="목적">
          <Text style={S.articleBody}>
            본 계약은 갑이 을에게 광고 대행 업무를 위탁하고, 을이 이를 성실히 수행함으로써 상호 이익을 도모함을 목적으로 한다.
          </Text>
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
        <Article no={4} title="비용 및 지급">
          <Text style={S.articleBody}>
            갑은 을에게 본 계약에 따른 대행 비용으로 금 {fmtNum(totalAmount)}원{VAT_MAP[vatType]}을 지급한다.
          </Text>
          {specialTerms ? (
            <Text style={[S.articleBody, { marginTop: 3 }]}>
              지급 조건: {specialTerms}
            </Text>
          ) : null}
        </Article>

        {/* 제5조 */}
        <Article no={5} title="광고물 승인">
          <Text style={S.articleBody}>
            을은 광고 제작 시 갑의 사전 승인을 받아야 하며, 갑은 을의 요청에 대해 지체 없이 승인 여부를 통보하여야 한다.
          </Text>
        </Article>

        {/* 제6조 */}
        <Article no={6} title="저작권">
          <Text style={S.articleBody}>
            본 계약으로 제작된 광고물의 저작권은 을에게 귀속되며, 갑은 계약 기간 내에 한하여 이를 사용할 수 있다.
          </Text>
        </Article>

        {/* 제7조 */}
        <Article no={7} title="비밀유지">
          <Text style={S.articleBody}>
            양 당사자는 본 계약을 통해 알게 된 상대방의 업무상 비밀을 제3자에게 누설하여서는 아니 된다.
          </Text>
        </Article>

        {/* 제8조 */}
        <Article no={8} title="계약의 해지">
          <Text style={S.articleBody}>
            일방이 계약상 의무를 이행하지 않을 경우, 상대방은 30일 이상의 유예기간을 두고 서면으로 통지하여 계약을 해지할 수 있다.
          </Text>
        </Article>

        {/* 제9조 */}
        <Article no={9} title="관할법원">
          <Text style={S.articleBody}>
            본 계약에 관한 분쟁이 발생할 경우 부산지방법원을 관할 법원으로 한다.
          </Text>
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

        {/* 계약일 */}
        <Text style={S.signDate}>{fmtDate(contractDate)}</Text>

        {/* 서명란 */}
        <View style={S.signSection}>
          {/* 갑 */}
          <View style={S.signBox}>
            <Text style={S.signTitle}>갑 (광고주)</Text>
            <View style={S.signRow}>
              <Text style={S.signLabel}>업체명</Text>
              <Text style={S.signValue}>{companyName || ''}</Text>
            </View>
            <View style={S.signRow}>
              <Text style={S.signLabel}>성  명</Text>
              <Text style={S.signValue}>{recipient}</Text>
            </View>
            <View style={S.signRow}>
              <Text style={S.signLabel}>주  소</Text>
              <Text style={S.signValue}> </Text>
            </View>
            <View style={[S.signRow, { marginTop: 8 }]}>
              <Text style={S.signLabel}>서  명</Text>
              <Text style={S.signValue}> </Text>
            </View>
          </View>

          {/* 을 */}
          <View style={S.signBox}>
            <Text style={S.signTitle}>을 (대행사)</Text>
            <View style={S.signRow}>
              <Text style={S.signLabel}>상  호</Text>
              <Text style={S.signValue}>{SUPPLIER.name}</Text>
            </View>
            <View style={S.signRow}>
              <Text style={S.signLabel}>대표자</Text>
              <Text style={S.signValue}>{SUPPLIER.ceo}</Text>
            </View>
            <View style={S.signRow}>
              <Text style={S.signLabel}>주  소</Text>
              <Text style={[S.signValue, { fontSize: 7.5 }]}>{SUPPLIER.address}</Text>
            </View>
            <View style={[S.signRow, { marginTop: 8, alignItems: 'center' }]}>
              <Text style={S.signLabel}>서  명</Text>
              <View style={{ flex: 1, alignItems: 'flex-start' }}>
                <Image src={stampPath} style={{ width: 48, height: 48 }} />
              </View>
            </View>
          </View>
        </View>

      </Page>
    </Document>
  )
}
