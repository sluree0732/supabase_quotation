'use client'

import { useEffect } from 'react'
import { X, Download, Loader2 } from 'lucide-react'
import type { ContractItem, VatType, Company } from '@/types'
import type { ContractArticles } from '@/lib/contractArticles'
import { parseArticles, substituteVariables, mergeArticles } from '@/lib/contractArticles'
import { groupByCategory } from '@/lib/groupItems'

interface Props {
  contractDate: string
  startDate: string
  endDate: string
  recipient: string
  company: Company | null
  senderCompany: Company | null
  items: ContractItem[]
  total: number
  vatType: VatType
  specialTerms: string
  articles: ContractArticles
  stampUrl?: string
  onClose: () => void
  onPdfDownload: () => Promise<void>
  pdfDownloading?: boolean
}

const VAT_LABEL: Record<VatType, string> = {
  excluded: '부가세 별도', included: '부가세 포함', none: '',
}

function fmtDate(d: string) {
  if (!d) return '미정'
  const [y, m, dd] = d.split('-')
  return `${y}년 ${parseInt(m)}월 ${parseInt(dd)}일`
}

export default function ContractViewerModal({
  contractDate, startDate, endDate, recipient,
  company, senderCompany, items, total, vatType, specialTerms,
  articles, stampUrl, onClose, onPdfDownload, pdfDownloading,
}: Props) {
  const A = mergeArticles(articles)
  const parsed = parseArticles(A.fullText)
  const sortedItems = groupByCategory(items)
  const vatAmount = vatType === 'excluded' ? Math.round(total * 0.1) : 0
  const finalAmount = vatType === 'excluded' ? Math.round(total * 1.1) : total

  const ctx = {
    items, total, vatType, startDate, endDate, contractDate,
    senderName: senderCompany?.name, receiverName: company?.name, recipient,
  }

  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [])

  function cleanVatLabel(text: string) {
    return text.replace(/\s*\(부가세 별도\)/g, '').replace(/\s*\(부가세 포함\)/g, '').replace(/\s*\(부가세 없음\)/g, '')
  }

  function renderArticle(art: { no: number; title: string; body: string }) {
    const hasItemsVar = art.body.includes('{{견적서내용}}')

    if (hasItemsVar) {
      const parts = art.body.split('{{견적서내용}}')
      return (
        <div className="mt-1">
          {parts[0]?.trim() && (
            <p className="text-xs text-gray-700 whitespace-pre-line mb-2 pl-2">
              {cleanVatLabel(substituteVariables(parts[0], ctx))}
            </p>
          )}
          <ItemsTable items={sortedItems} total={total} vatType={vatType} />
          {parts[1]?.trim() && (
            <p className="text-xs text-gray-700 whitespace-pre-line mt-2 pl-2">
              {cleanVatLabel(substituteVariables(parts[1], ctx))}
            </p>
          )}
        </div>
      )
    }

    return (
      <div className="mt-1 pl-2">
        <p className="text-xs text-gray-700 whitespace-pre-line">
          {cleanVatLabel(substituteVariables(art.body, ctx))}
        </p>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-[70] flex flex-col bg-white">
      {/* 헤더 */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 shrink-0">
        <div>
          <h2 className="font-bold text-[#1e2a3a]">계약서 미리보기</h2>
          <p className="text-xs text-gray-400 mt-0.5">내용 수정은 계약서 작성 화면에서 가능합니다</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={onPdfDownload}
            disabled={pdfDownloading || !items.length}
            className="flex items-center gap-1.5 bg-[#e74c3c] text-white px-3 py-1.5 rounded-lg text-sm font-medium disabled:opacity-50"
          >
            {pdfDownloading ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
            PDF
          </button>
          <button onClick={onClose}><X size={20} className="text-gray-400" /></button>
        </div>
      </div>

      {/* 문서 영역 */}
      <div className="flex-1 overflow-auto p-6 bg-gray-100 flex justify-center items-start">
        <div className="bg-white border border-gray-200 shadow-md" style={{ width: '794px' }}>
          {/* 제목 */}
          <div className="text-center py-6 border-b border-gray-100">
            <h1 className="text-2xl font-bold tracking-widest text-[#1e2a3a]">
              광&nbsp;&nbsp;고&nbsp;&nbsp;대&nbsp;&nbsp;행&nbsp;&nbsp;계&nbsp;&nbsp;약&nbsp;&nbsp;서
            </h1>
          </div>

          <div className="px-8 py-6 space-y-5">
            {/* 당사자 */}
            <div className="text-xs text-gray-700 space-y-1 border-b border-gray-100 pb-4">
              <p><span className="font-bold">갑 (광고주) : </span>{company?.name ?? ''}{company?.ceo ? ` 대표 ${company.ceo}` : ''}{recipient ? ` (담당: ${recipient})` : ''}</p>
              <p><span className="font-bold">을 (대행사) : </span>{senderCompany?.name ?? ''}{senderCompany?.ceo ? ` 대표 ${senderCompany.ceo}` : ''}</p>
              <p className="mt-2 text-gray-500">위 양 당사자는 아래와 같이 광고 대행 계약을 체결한다.</p>
            </div>

            {/* 조항 */}
            {parsed.map(art => (
              <div key={art.no} className="space-y-0.5">
                <h3 className="text-xs font-bold text-[#1e2a3a]">
                  제{art.no}조 ({art.title})
                </h3>
                {renderArticle(art)}
              </div>
            ))}

            {/* 특약사항 */}
            {specialTerms && (
              <div className="border border-gray-200 rounded-lg p-3">
                <h3 className="text-xs font-bold text-[#1e2a3a] mb-1">특약사항</h3>
                <p className="text-xs text-gray-700 whitespace-pre-line">{specialTerms}</p>
              </div>
            )}

            {/* 서명 */}
            <div className="pt-4 space-y-4 border-t border-gray-100">
              <p className="text-xs text-center text-gray-700">{fmtDate(contractDate)}</p>
              <div className="grid grid-cols-2 gap-8 text-xs">
                <div className="space-y-1.5">
                  <p className="font-bold text-[#1e2a3a]">갑 (광고주)</p>
                  {company?.name && <p>- 업 체 명 : {company.name}</p>}
                  <p>- 대 표 자 : {company?.ceo || recipient || ''}</p>
                  <p>- 주&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;소 : {company?.address || ''}</p>
                  <p className="mt-2">- 서&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;명 : _____________________</p>
                </div>
                <div className="space-y-1.5">
                  <p className="font-bold text-[#1e2a3a]">을 (대행사)</p>
                  <p>- 상&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;호 : {senderCompany?.name || ''}</p>
                  <p>- 대 표 자 : {senderCompany?.ceo || ''}</p>
                  <p>- 주&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;소 : {senderCompany?.address || ''}</p>
                  <p>- 사업자 등록번호 : {senderCompany?.business_no || ''}</p>
                  {stampUrl && (
                    <div className="mt-1">
                      <img src={stampUrl} alt="도장" className="w-12 h-12 object-contain opacity-90" />
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── 항목 테이블 (읽기 전용) ───────────────────────────────

function ItemsTable({ items, total, vatType }: {
  items: ContractItem[]
  total: number
  vatType: VatType
}) {
  const catSpans = items.map((item, i) => {
    if (i > 0 && item.category === items[i - 1].category) return null
    let count = 1
    while (i + count < items.length && items[i + count].category === items[i].category) count++
    return count
  })

  const vatLabel = VAT_LABEL[vatType]

  return (
    <div className="overflow-x-auto">
      <table className="text-xs border-collapse w-full">
        <thead>
          <tr className="bg-gray-50">
            <th colSpan={2} className="border border-gray-200 px-2 py-1.5 text-center font-semibold text-[#4a5568]" style={{ width: '25.2%' }}>상&nbsp;&nbsp;품</th>
            <th className="border border-gray-200 px-2 py-1.5 text-center font-semibold text-[#4a5568]" style={{ width: '7%' }}>수량</th>
            <th className="border border-gray-200 px-2 py-1.5 text-center font-semibold text-[#4a5568]" style={{ width: '15.4%' }}>금액</th>
            <th className="border border-gray-200 px-2 py-1.5 text-center font-semibold text-[#4a5568]" style={{ width: '18.9%' }}>총액</th>
            <th className="border border-gray-200 px-2 py-1.5 text-center font-semibold text-[#4a5568]">비고</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item, idx) => (
            <tr key={idx}>
              {catSpans[idx] !== null && (
                <td rowSpan={catSpans[idx]!} className="border border-gray-200 p-1 text-center align-middle text-[#1e2a3a] font-medium" style={{ width: '8.4%' }}>
                  {item.category}
                </td>
              )}
              <td className="border border-gray-200 px-2 py-1.5 text-center" style={{ width: '16.8%' }}>{item.item_name}</td>
              <td className="border border-gray-200 px-2 py-1.5 text-center">{item.period}</td>
              <td className="border border-gray-200 px-2 py-1.5 text-center">{item.unit_price.toLocaleString()}</td>
              <td className="border border-gray-200 px-2 py-1.5 text-center">{item.total_price.toLocaleString()}</td>
              <td className="border border-gray-200 px-2 py-1.5 text-xs text-left whitespace-pre-line">{item.note}</td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr className="bg-gray-50 font-bold">
            <td colSpan={4} className="border border-gray-200 px-2 py-2 text-center">합&nbsp;&nbsp;계</td>
            <td className="border border-gray-200 px-2 py-2 text-center">{total.toLocaleString()}원</td>
            <td className="border border-gray-200 px-2 py-2 text-center text-red-500 text-xs">{vatLabel}</td>
          </tr>
        </tfoot>
      </table>
    </div>
  )
}
