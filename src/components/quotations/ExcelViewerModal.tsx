'use client'

import { useState } from 'react'
import { X, Download, Loader2, Trash2 } from 'lucide-react'
import type { QuotationFormState } from './QuotationForm'

interface Props {
  state: QuotationFormState
  onClose: () => void
}

interface EditableItem {
  category: string
  item_name: string
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
      unit_price: it.unit_price,
      total_price: it.total_price,
      note: it.note,
    }))
  )
  const [downloading, setDownloading] = useState(false)

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

  async function handleDownload() {
    setDownloading(true)
    try {
      const res = await fetch('/api/excel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectName: state.projectName,
          quoteDate: state.quoteDate,
          recipient: state.recipient,
          senderInfo: state.senderInfo,
          clientInfo: state.clientInfo,
          items,
          totalAmount: total,
          vatType: state.vatType,
        }),
      })
      if (!res.ok) throw new Error('엑셀 생성 실패')
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      const dateStr = state.quoteDate.replace(/-/g, '')
      const prefix = state.company?.name ?? state.clientInfo?.name ?? ''
      a.download = prefix ? `${prefix}_견적서(${dateStr}).xlsx` : `견적서(${dateStr}).xlsx`
      a.click()
      URL.revokeObjectURL(url)
    } catch (e: any) {
      alert(e.message ?? '엑셀 생성 실패')
    } finally {
      setDownloading(false)
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
          <h2 className="font-bold text-[#1e2a3a]">엑셀 미리보기</h2>
          <p className="text-xs text-gray-400 mt-0.5">셀을 클릭해 내용을 수정할 수 있습니다</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleDownload}
            disabled={downloading || !items.length}
            className="flex items-center gap-1.5 bg-[#217346] text-white px-3 py-1.5 rounded-lg text-sm font-medium disabled:opacity-50"
          >
            {downloading ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
            엑셀 다운로드
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
              <p className="text-[#718096]">견적일&nbsp;&nbsp;<span className="text-[#1e2a3a] font-medium">{state.quoteDate}</span></p>
              <p className="text-[#718096]">수&nbsp;&nbsp;신&nbsp;&nbsp;<span className="text-[#1e2a3a] font-medium">{state.recipient}</span></p>
              {state.projectName && (
                <p className="text-[#718096]">프로젝트&nbsp;&nbsp;<span className="text-[#1e2a3a] font-medium">{state.projectName}</span></p>
              )}
              <p className="text-[#718096] mt-2 pt-2 border-t border-gray-50">아래와 같이 견적합니다.</p>
            </div>
            {state.senderInfo && (
              <div className="border border-gray-100 rounded-lg p-3 text-xs text-[#4a5568] space-y-1">
                <InfoRow label="상&nbsp;&nbsp;호" value={state.senderInfo.name} />
                <InfoRow label="사업자번호" value={state.senderInfo.business_no} />
                <InfoRow label="사업장" value={state.senderInfo.address} />
                <InfoRow label="연&nbsp;&nbsp;락&nbsp;&nbsp;처" value={state.senderInfo.phone} />
                {state.senderInfo.email && <InfoRow label="이메일" value={state.senderInfo.email} />}
              </div>
            )}
          </div>

          {/* 항목 테이블 */}
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-gray-50">
                  <th className="border border-gray-200 px-3 py-2.5 text-center font-semibold text-[#4a5568] w-28">대분류</th>
                  <th className="border border-gray-200 px-3 py-2.5 text-center font-semibold text-[#4a5568]">상품명</th>
                  <th className="border border-gray-200 px-3 py-2.5 text-center font-semibold text-[#4a5568] w-36">금액</th>
                  <th className="border border-gray-200 px-3 py-2.5 text-center font-semibold text-[#4a5568] w-36">총액</th>
                  <th className="border border-gray-200 px-3 py-2.5 text-center font-semibold text-[#4a5568]">비고</th>
                  <th className="border border-gray-200 w-8" />
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
                        onChange={e => updateItem(idx, { note: e.target.value })}
                        rows={2}
                        className="w-full px-2 py-1.5 text-xs focus:outline-none focus:bg-blue-50 rounded resize-none transition-colors"
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
                  <td colSpan={3} className="border border-gray-200 px-4 py-3 text-left text-sm text-[#1e2a3a]">
                    합&nbsp;&nbsp;계 (부가세포함)
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
            * 수정된 내용은 엑셀 다운로드 시 반영됩니다. 견적서 폼의 데이터는 변경되지 않습니다.
          </div>
        </div>
      </div>
    </div>
  )
}

function InfoRow({ label, value }: { label: string; value: string }) {
  if (!value) return null
  return (
    <p>
      <span className="text-gray-400 inline-block w-20">{label}</span>
      {value}
    </p>
  )
}
