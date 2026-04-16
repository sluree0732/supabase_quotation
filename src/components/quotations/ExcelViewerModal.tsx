'use client'

import { useState, useEffect } from 'react'
import { X, Download, Loader2, Trash2 } from 'lucide-react'
import type { QuotationFormState } from './QuotationForm'
import { SUPPLIER } from '@/lib/supplier'
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
      total_price: it.total_price,
      note: it.note,
    }))
  )
  const [downloading, setDownloading] = useState(false)
  const [pdfDownloading, setPdfDownloading] = useState(false)
  const [stampUrl, setStampUrl] = useState<string>('/images/stamp.png')

  useEffect(() => {
    getSenderStampUrl().then(url => {
      if (url) setStampUrl(url)
    }).catch(() => {})
  }, [])

  const total = items.reduce((s, i) => s + i.total_price, 0)

  function updateItem(idx: number, patch: Partial<EditableItem>) {
    setItems(prev => prev.map((it, i) => {
      if (i !== idx) return it
      const updated = { ...it, ...patch }
      if ('unit_price' in patch) updated.total_price = updated.unit_price
      return updated
    }))
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

  async function handleDownload() {
    setDownloading(true)
    try {
      const dateStr = state.quoteDate.replace(/-/g, '')
      const prefix = state.company?.name ?? state.clientInfo?.name ?? ''
      const filename = prefix ? `${prefix}_견적서(${dateStr}).xlsx` : `견적서(${dateStr}).xlsx`
      await triggerTokenDownload('excel', filename, {
        quoteDate: state.quoteDate,
        recipient: state.recipient,
        items,
        totalAmount: total,
        vatType: state.vatType,
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
        items,
        totalAmount: total,
        vatType: state.vatType,
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

          {/* 견적서 제목 */}
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

            {/* 발신 업체 정보 - 엑셀과 동일한 테이블 구조 (5열: label1|value1|label2|stamp|value2) */}
            <div>
              <table className="w-full text-xs border-collapse">
                <tbody>
                  {/* 행1: 상호 / 사업자등록번호 + 도장(rowSpan=2) */}
                  <tr>
                    <td className="bg-gray-100 font-semibold px-2 py-1 whitespace-nowrap border border-gray-200 text-center">상&nbsp;&nbsp;호</td>
                    <td className="px-2 py-1 border border-gray-200">{SUPPLIER.name}</td>
                    <td className="bg-gray-100 font-semibold px-2 py-1 whitespace-nowrap border border-gray-200 text-center">사업자 등록번호</td>
                    <td rowSpan={2} className="border border-gray-200 p-0.5 text-center" style={{ width: '52px', borderRight: 'none' }}>
                      <img
                        src={stampUrl}
                        alt="도장"
                        className="w-11 h-11 object-contain opacity-90 pointer-events-none"
                      />
                    </td>
                    <td className="px-2 py-1 border border-gray-200" style={{ borderLeft: 'none' }}>{SUPPLIER.business_no}</td>
                  </tr>
                  {/* 행2: 대표자 / 연락처 */}
                  <tr>
                    <td className="bg-gray-100 font-semibold px-2 py-1 whitespace-nowrap border border-gray-200 text-center">대&nbsp;&nbsp;표&nbsp;&nbsp;자</td>
                    <td className="px-2 py-1 border border-gray-200">{SUPPLIER.ceo}</td>
                    <td className="bg-gray-100 font-semibold px-2 py-1 whitespace-nowrap border border-gray-200 text-center">연&nbsp;&nbsp;락&nbsp;&nbsp;처</td>
                    {/* stamp cell continues via rowSpan */}
                    <td className="px-2 py-1 border border-gray-200" style={{ borderLeft: 'none' }}>{SUPPLIER.phone}</td>
                  </tr>
                  {/* 행3: 사업장 (value colSpan=4) */}
                  <tr>
                    <td className="bg-gray-100 font-semibold px-2 py-1 whitespace-nowrap border border-gray-200 text-center">사&nbsp;&nbsp;업&nbsp;&nbsp;장</td>
                    <td colSpan={4} className="px-2 py-1 border border-gray-200">{SUPPLIER.address}</td>
                  </tr>
                  {/* 행4: 업태 / 종목 (stamp 없음) */}
                  <tr>
                    <td className="bg-gray-100 font-semibold px-2 py-1 whitespace-nowrap border border-gray-200 text-center">업&nbsp;&nbsp;&nbsp;&nbsp;태</td>
                    <td className="px-2 py-1 border border-gray-200">{SUPPLIER.business_type}</td>
                    <td className="bg-gray-100 font-semibold px-2 py-1 whitespace-nowrap border border-gray-200 text-center">종&nbsp;&nbsp;&nbsp;&nbsp;목</td>
                    <td className="border border-gray-200" style={{ borderLeft: 'none', borderRight: 'none' }} />
                    <td className="px-2 py-1 border border-gray-200" style={{ borderLeft: 'none' }}>{SUPPLIER.business_item}</td>
                  </tr>
                  {/* 행5: 계좌정보 (value colSpan=4) */}
                  <tr>
                    <td className="bg-gray-100 font-semibold px-2 py-1 whitespace-nowrap border border-gray-200 text-center">계좌정보</td>
                    <td colSpan={4} className="px-2 py-1 border border-gray-200">{SUPPLIER.bank}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* 항목 테이블 */}
          <div className="overflow-x-auto">
            <table className="text-sm border-collapse" style={{ minWidth: '700px', width: '100%' }}>
              <thead>
                {/* 1단 헤더 */}
                <tr className="bg-gray-50">
                  <th colSpan={2} className="border border-gray-200 px-3 py-2 text-center font-semibold text-[#4a5568]">상&nbsp;&nbsp;품</th>
                  <th className="border border-gray-200 px-3 py-2 text-center font-semibold text-[#4a5568]" style={{ minWidth: '70px' }}>기간(월)</th>
                  <th className="border border-gray-200 px-3 py-2 text-center font-semibold text-[#4a5568]" style={{ minWidth: '110px' }}>금&nbsp;&nbsp;액</th>
                  <th className="border border-gray-200 px-3 py-2 text-center font-semibold text-[#4a5568]" style={{ minWidth: '110px' }}>총&nbsp;&nbsp;액</th>
                  <th className="border border-gray-200 px-3 py-2 text-center font-semibold text-[#4a5568]" style={{ minWidth: '140px' }}>비&nbsp;&nbsp;고</th>
                  <th className="border border-gray-200" style={{ width: '32px' }} />
                </tr>
                {/* 2단 헤더 */}
                <tr className="bg-gray-50">
                  <th className="border border-gray-200 px-3 py-1.5 text-center font-semibold text-[#4a5568] text-xs" style={{ minWidth: '90px' }}>대분류</th>
                  <th className="border border-gray-200 px-3 py-1.5 text-center font-semibold text-[#4a5568] text-xs" style={{ minWidth: '120px' }}>상품명</th>
                  <th className="border border-gray-200" />
                  <th className="border border-gray-200" />
                  <th className="border border-gray-200" />
                  <th className="border border-gray-200" />
                  <th className="border border-gray-200" />
                </tr>
              </thead>
              <tbody>
                {items.map((item, idx) => (
                  <tr key={idx} className="group">
                    <td className="border border-gray-200 p-1">
                      <input
                        value={item.category}
                        onChange={e => updateItem(idx, { category: e.target.value })}
                        className="w-full px-2 py-1.5 text-center text-sm focus:outline-none focus:bg-blue-50 rounded transition-colors"
                      />
                    </td>
                    <td className="border border-gray-200 p-1">
                      <input
                        value={item.item_name}
                        onChange={e => updateItem(idx, { item_name: e.target.value })}
                        className="w-full px-2 py-1.5 text-sm focus:outline-none focus:bg-blue-50 rounded transition-colors"
                      />
                    </td>
                    <td className="border border-gray-200 p-1">
                      <input
                        type="text"
                        inputMode="numeric"
                        value={item.period || ''}
                        onChange={e => updateItem(idx, { period: parseInt(e.target.value.replace(/[^0-9]/g, ''), 10) || 0 })}
                        className="w-full px-2 py-1.5 text-center text-sm text-[#e67e22] font-medium focus:outline-none focus:bg-blue-50 rounded transition-colors"
                      />
                    </td>
                    <td className="border border-gray-200 p-1">
                      <input
                        type="text"
                        inputMode="numeric"
                        value={item.unit_price ? item.unit_price.toLocaleString() : ''}
                        onChange={e => updateItem(idx, { unit_price: parsePriceInput(e.target.value) })}
                        className="w-full px-2 py-1.5 text-right text-sm focus:outline-none focus:bg-blue-50 rounded transition-colors"
                      />
                    </td>
                    <td className="border border-gray-200 px-3 py-2 text-right text-sm text-[#1e2a3a] font-medium">
                      {item.total_price.toLocaleString()}
                    </td>
                    <td className="border border-gray-200 p-1">
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
                    </td>
                    <td className="border border-gray-200 px-1 text-center">
                      <button
                        onClick={() => deleteItem(idx)}
                        className="p-1 text-gray-300 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all"
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
                  <td className="border border-gray-200 px-3 py-3 text-right text-sm text-[#1e2a3a]">
                    {total.toLocaleString()}원
                  </td>
                  <td className="border border-gray-200 px-3 py-3 text-center text-sm text-red-600">
                    {VAT_LABEL[state.vatType]}
                  </td>
                  <td className="border border-gray-200" />
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
