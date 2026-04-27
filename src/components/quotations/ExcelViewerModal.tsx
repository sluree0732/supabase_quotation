'use client'

import { useState, useEffect } from 'react'
import { X, Download, Loader2, Trash2 } from 'lucide-react'
import type { QuotationFormState } from './QuotationForm'
import { getSenderStampUrl } from '@/lib/companies'

interface Props {
  state: QuotationFormState
  onClose: () => void
}

interface EditableItem {
  category: string
  item_name: string
  period: number
  unit_price: number
  total_price: number
  note: string
}

const VAT_LABEL: Record<string, string> = {
  excluded: '부가세 별도',
  included: '부가세 포함',
  none: '',
}

export default function ExcelViewerModal({ state, onClose }: Props) {
  const [items, setItems] = useState<EditableItem[]>(
    state.items.map(it => ({
      category: it.category,
      item_name: it.item_name,
      period: it.period ?? 1,
      unit_price: it.unit_price,
      total_price: it.total_price ?? it.unit_price * (it.period ?? 1),
      note: it.note,
    }))
  )
  const [downloading, setDownloading] = useState(false)
  const [pdfDownloading, setPdfDownloading] = useState(false)
  const [stampUrl, setStampUrl] = useState<string>('/images/stamp.png')

  useEffect(() => {
    const id = state.senderCompanyId ?? state.senderCompany?.id ?? undefined
    getSenderStampUrl(id).then(url => {
      if (url) setStampUrl(url)
    }).catch(() => {})
  }, [])

  const total = items.reduce((s, i) => s + (i.total_price ?? i.unit_price), 0)

  // 연속된 같은 대분류 → rowspan 계산
  const categoryRowSpans = items.map((item, i) => {
    if (i > 0 && item.category === items[i - 1].category) return null
    let count = 1
    while (i + count < items.length && items[i + count].category === items[i].category) count++
    return count
  })

  function updateItem(idx: number, patch: Partial<EditableItem>) {
    setItems(prev => prev.map((it, i) => {
      if (i !== idx) return it
      const updated = { ...it, ...patch }
      if ('unit_price' in patch || 'period' in patch) {
        updated.total_price = updated.unit_price * updated.period
      }
      return updated
    }))
  }

  // 병합된 대분류 셀 편집 시 그룹 전체 업데이트
  function updateCategory(idx: number, value: string) {
    const rowSpan = categoryRowSpans[idx]
    if (rowSpan === null) return
    setItems(prev => prev.map((it, i) =>
      i >= idx && i < idx + rowSpan ? { ...it, category: value } : it
    ))
  }

  function deleteItem(idx: number) {
    setItems(prev => prev.filter((_, i) => i !== idx))
  }

  async function triggerTokenDownload(type: 'excel' | 'pdf', filename: string, payload: object) {
    const res = await fetch('/api/download-token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type, payload, filename }),
    })
    if (!res.ok) throw new Error('다운로드 토큰 생성 실패')
    const { token } = await res.json()
    const a = document.createElement('a')
    a.href = `/api/download?token=${token}`
    a.click()
  }

  const senderPayload = {
    senderCompanyId: state.senderCompanyId ?? state.senderCompany?.id ?? null,
    senderInfo: state.senderInfo ?? null,
  }

  async function handleDownload() {
    setDownloading(true)
    try {
      const dateStr = state.quoteDate.replace(/-/g, '')
      const prefix = state.company?.name ?? state.clientInfo?.name ?? ''
      const filename = prefix ? `${prefix}_견적서(${dateStr}).xlsx` : `견적서(${dateStr}).xlsx`
      await triggerTokenDownload('excel', filename, {
        quoteDate: state.quoteDate,
        recipient: state.recipient,
        projectName: state.projectName ?? null,
        items,
        totalAmount: total,
        vatType: state.vatType,
        ...senderPayload,
      })
    } catch (e: any) {
      alert(e.message ?? '엑셀 생성 실패')
    } finally {
      setDownloading(false)
    }
  }

  async function handlePdfDownload() {
    setPdfDownloading(true)
    try {
      const dateStr = state.quoteDate.replace(/-/g, '')
      const prefix = state.company?.name ?? state.clientInfo?.name ?? ''
      const filename = prefix ? `${prefix}_견적서(${dateStr}).pdf` : `견적서(${dateStr}).pdf`
      await triggerTokenDownload('pdf', filename, {
        quoteDate: state.quoteDate,
        recipient: state.recipient,
        projectName: state.projectName ?? null,
        items,
        totalAmount: total,
        vatType: state.vatType,
        ...senderPayload,
      })
    } catch (e: any) {
      alert(e.message ?? 'PDF 생성 실패')
    } finally {
      setPdfDownloading(false)
    }
  }

  function parsePriceInput(raw: string): number {
    return parseInt(raw.replace(/[^0-9]/g, ''), 10) || 0
  }

  return (
    <div className="fixed inset-0 z-[70] flex flex-col bg-white">
      {/* 헤더 */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 shrink-0">
        <div>
          <h2 className="font-bold text-[#1e2a3a]">견적서 미리보기</h2>
          <p className="text-xs text-gray-400 mt-0.5">셀을 클릭해 내용을 수정할 수 있습니다</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleDownload}
            disabled={downloading || !items.length}
            className="flex items-center gap-1.5 bg-[#217346] text-white px-3 py-1.5 rounded-lg text-sm font-medium disabled:opacity-50"
          >
            {downloading ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
            엑셀
          </button>
          <button
            onClick={handlePdfDownload}
            disabled={pdfDownloading || !items.length}
            className="flex items-center gap-1.5 bg-[#e74c3c] text-white px-3 py-1.5 rounded-lg text-sm font-medium disabled:opacity-50"
          >
            {pdfDownloading ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
            PDF
          </button>
          <button onClick={onClose}>
            <X size={20} className="text-gray-400" />
          </button>
        </div>
      </div>

      {/* 뷰어 */}
      <div className="flex-1 overflow-auto p-4 md:p-8 bg-gray-50">
        <div className="max-w-5xl mx-auto bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">

          {/* 제목 */}
          <div className="text-center py-6 border-b border-gray-100">
            <h1 className="text-2xl font-bold tracking-widest text-[#1e2a3a]">견&nbsp;&nbsp;적&nbsp;&nbsp;서</h1>
          </div>

          {/* 기본 정보 */}
          <div className="px-6 py-4 border-b border-gray-100 grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div className="space-y-1.5">
              <p className="text-[#718096]">{state.quoteDate}</p>
              {state.recipient && (
                <p className="text-[#718096]">수 신 : <span className="text-[#1e2a3a] font-medium">{state.recipient}</span></p>
              )}
              {state.projectName && (
                <p className="text-[#718096]">프로젝트&nbsp;&nbsp;<span className="text-[#1e2a3a] font-medium">{state.projectName}</span></p>
              )}
              <p className="text-[#718096] mt-2 pt-2 border-t border-gray-50">아래와 같이 견적합니다.</p>
            </div>

            {/* 발신 업체 정보 */}
            <div>
              <table className="w-full text-xs border-collapse">
                <tbody>
                  <tr>
                    <td className="bg-gray-100 font-semibold px-2 py-2.5 whitespace-nowrap border border-gray-200 text-center">상&nbsp;&nbsp;호</td>
                    <td className="px-2 py-2.5 border border-gray-200">{state.senderInfo?.name ?? ''}</td>
                    <td className="bg-gray-100 font-semibold px-2 py-2.5 whitespace-nowrap border border-gray-200 text-center">사업자 등록번호</td>
                    <td rowSpan={2} className="border border-gray-200 p-0.5 text-center" style={{ width: '52px', borderRight: 'none' }}>
                      <img src={stampUrl} alt="도장" className="w-11 h-11 object-contain opacity-90 pointer-events-none" />
                    </td>
                    <td className="px-2 py-2.5 border border-gray-200" style={{ borderLeft: 'none' }}>{state.senderInfo?.business_no ?? ''}</td>
                  </tr>
                  <tr>
                    <td className="bg-gray-100 font-semibold px-2 py-2.5 whitespace-nowrap border border-gray-200 text-center">대&nbsp;&nbsp;표&nbsp;&nbsp;자</td>
                    <td className="px-2 py-2.5 border border-gray-200">{state.senderInfo?.ceo ?? ''}</td>
                    <td className="bg-gray-100 font-semibold px-2 py-2.5 whitespace-nowrap border border-gray-200 text-center">연&nbsp;&nbsp;락&nbsp;&nbsp;처</td>
                    <td className="px-2 py-2.5 border border-gray-200" style={{ borderLeft: 'none' }}>{state.senderInfo?.phone ?? ''}</td>
                  </tr>
                  <tr>
                    <td className="bg-gray-100 font-semibold px-2 py-2.5 whitespace-nowrap border border-gray-200 text-center">사&nbsp;&nbsp;업&nbsp;&nbsp;장</td>
                    <td colSpan={4} className="px-2 py-2.5 border border-gray-200">{state.senderInfo?.address ?? ''}</td>
                  </tr>
                  <tr>
                    <td className="bg-gray-100 font-semibold px-2 py-2.5 whitespace-nowrap border border-gray-200 text-center">업&nbsp;&nbsp;&nbsp;&nbsp;태</td>
                    <td className="px-2 py-2.5 border border-gray-200">{state.senderInfo?.business_type ?? ''}</td>
                    <td className="bg-gray-100 font-semibold px-2 py-2.5 whitespace-nowrap border border-gray-200 text-center">종&nbsp;&nbsp;&nbsp;&nbsp;목</td>
                    <td className="border border-gray-200" style={{ borderLeft: 'none', borderRight: 'none' }} />
                    <td className="px-2 py-2.5 border border-gray-200" style={{ borderLeft: 'none' }}>{state.senderInfo?.business_item ?? ''}</td>
                  </tr>
                  <tr>
                    <td className="bg-gray-100 font-semibold px-2 py-2.5 whitespace-nowrap border border-gray-200 text-center">계좌정보</td>
                    <td colSpan={4} className="px-2 py-2.5 border border-gray-200">{state.senderInfo?.bank ?? ''}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* 항목 테이블 */}
          <div className="overflow-x-auto">
            <table className="text-sm border-collapse" style={{ minWidth: '700px', width: '100%' }}>
              <thead>
                <tr className="bg-gray-50">
                  <th className="border border-gray-200 px-3 py-2 text-center font-semibold text-[#4a5568] text-xs" style={{ width: '80px' }}>대분류</th>
                  <th className="border border-gray-200 px-3 py-2 text-center font-semibold text-[#4a5568] text-xs" style={{ minWidth: '100px' }}>상품명</th>
                  <th className="border border-gray-200 px-3 py-2 text-center font-semibold text-[#4a5568] text-xs" style={{ width: '60px' }}>수량</th>
                  <th className="border border-gray-200 px-3 py-2 text-center font-semibold text-[#4a5568] text-xs" style={{ width: '110px' }}>금액</th>
                  <th className="border border-gray-200 px-3 py-2 text-center font-semibold text-[#4a5568] text-xs" style={{ width: '110px' }}>총액</th>
                  <th className="border border-gray-200 px-3 py-2 text-center font-semibold text-[#4a5568] text-xs">비고</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item, idx) => (
                  <tr key={idx} className="group">
                    {categoryRowSpans[idx] !== null && (
                      <td
                        rowSpan={categoryRowSpans[idx]!}
                        className="border border-gray-200 p-1 align-middle"
                      >
                        <input
                          value={item.category}
                          onChange={e => updateCategory(idx, e.target.value)}
                          className="w-full px-2 py-1.5 text-center text-sm focus:outline-none focus:bg-blue-50 rounded transition-colors"
                        />
                      </td>
                    )}
                    <td className="border border-gray-200 p-1">
                      <input
                        value={item.item_name}
                        onChange={e => updateItem(idx, { item_name: e.target.value })}
                        className="w-full px-2 py-1.5 text-center text-sm focus:outline-none focus:bg-blue-50 rounded transition-colors"
                      />
                    </td>
                    <td className="border border-gray-200 p-1">
                      <input
                        type="text"
                        inputMode="numeric"
                        value={item.period}
                        onChange={e => updateItem(idx, { period: parseInt(e.target.value) || 1 })}
                        className="w-full px-2 py-1.5 text-center text-sm focus:outline-none focus:bg-blue-50 rounded transition-colors"
                      />
                    </td>
                    <td className="border border-gray-200 p-1">
                      <input
                        type="text"
                        inputMode="numeric"
                        value={item.unit_price ? item.unit_price.toLocaleString() : ''}
                        onChange={e => updateItem(idx, { unit_price: parsePriceInput(e.target.value) })}
                        className="w-full px-2 py-1.5 text-center text-sm focus:outline-none focus:bg-blue-50 rounded transition-colors"
                      />
                    </td>
                    <td className="border border-gray-200 px-3 py-2 text-center text-sm align-middle">
                      {(item.total_price ?? item.unit_price).toLocaleString()}
                    </td>
                    <td className="border border-gray-200 p-1 relative">
                      <textarea
                        value={item.note}
                        onChange={e => {
                          updateItem(idx, { note: e.target.value })
                          e.target.style.height = 'auto'
                          e.target.style.height = e.target.scrollHeight + 'px'
                        }}
                        ref={el => {
                          if (el) {
                            el.style.height = 'auto'
                            el.style.height = el.scrollHeight + 'px'
                          }
                        }}
                        rows={1}
                        className="w-full px-2 py-1.5 text-xs focus:outline-none focus:bg-blue-50 rounded resize-none transition-colors overflow-hidden"
                      />
                      <button
                        onClick={() => deleteItem(idx)}
                        className="absolute top-1 right-1 p-1 text-gray-300 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all"
                      >
                        <Trash2 size={13} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-gray-50 font-bold">
                  <td colSpan={4} className="border border-gray-200 px-4 py-3 text-left text-sm text-[#1e2a3a]">
                    합&nbsp;&nbsp;계 {VAT_LABEL[state.vatType] ? `(${VAT_LABEL[state.vatType]})` : ''}
                  </td>
                  <td className="border border-gray-200 px-3 py-3 text-center text-sm text-[#1e2a3a]">
                    {total.toLocaleString()}원
                  </td>
                  <td className="border border-gray-200 px-3 py-3 text-center text-sm text-red-600">
                    {VAT_LABEL[state.vatType]}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          <div className="px-6 py-3 text-xs text-gray-400 border-t border-gray-100">
            * 수정된 내용은 엑셀/PDF 다운로드 시 반영됩니다. 견적서 폼의 데이터는 변경되지 않습니다.
          </div>
        </div>
      </div>
    </div>
  )
}
