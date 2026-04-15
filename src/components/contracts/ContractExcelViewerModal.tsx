'use client'

import { useState } from 'react'
import { X, Download, Loader2, Trash2 } from 'lucide-react'
import type { ContractItem, VatType } from '@/types'

interface ContractState {
  contractDate: string
  startDate: string
  endDate: string
  recipient: string
  vatType: VatType
  items: ContractItem[]
  specialTerms: string
  companyName: string
  companyAddress: string
}

interface Props {
  state: ContractState
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

function InfoRow({ label, value }: { label: string; value?: string }) {
  if (!value) return null
  return (
    <div className="flex gap-2">
      <span className="text-[#a0aec0] shrink-0" dangerouslySetInnerHTML={{ __html: label }} />
      <span className="font-medium text-[#1e2a3a]">{value}</span>
    </div>
  )
}

export default function ContractExcelViewerModal({ state, onClose }: Props) {
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
  const [pdfDownloading, setPdfDownloading] = useState(false)

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

  async function triggerTokenDownload(type: 'contract-excel' | 'contract-pdf', filename: string, payload: object) {
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

  function getPayload() {
    const dateStr = state.contractDate.replace(/-/g, '')
    const name = state.companyName
    return {
      contractDate: state.contractDate,
      startDate: state.startDate,
      endDate: state.endDate,
      recipient: state.recipient,
      companyName: name,
      companyAddress: state.companyAddress,
      items,
      totalAmount: total,
      vatType: state.vatType,
      specialTerms: state.specialTerms,
      filename: name ? `${name}_계약서(${dateStr})` : `계약서(${dateStr})`,
    }
  }

  async function handleExcelDownload() {
    setDownloading(true)
    try {
      const p = getPayload()
      await triggerTokenDownload('contract-excel', `${p.filename}.xlsx`, p)
    } catch (e: any) {
      alert(e.message ?? '엑셀 생성 실패')
    } finally {
      setDownloading(false)
    }
  }

  async function handlePdfDownload() {
    setPdfDownloading(true)
    try {
      const p = getPayload()
      await triggerTokenDownload('contract-pdf', `${p.filename}.pdf`, p)
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
          <h2 className="font-bold text-[#1e2a3a]">계약서 미리보기</h2>
          <p className="text-xs text-gray-400 mt-0.5">셀을 클릭해 내용을 수정할 수 있습니다</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleExcelDownload}
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
            <h1 className="text-2xl font-bold tracking-widest text-[#1e2a3a]">계&nbsp;&nbsp;약&nbsp;&nbsp;서</h1>
          </div>

          {/* 기본 정보 */}
          <div className="px-6 py-4 border-b border-gray-100 grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div className="space-y-1.5">
              <p className="text-[#718096]">계약일&nbsp;&nbsp;<span className="text-[#1e2a3a] font-medium">{state.contractDate}</span></p>
              <p className="text-[#718096]">수&nbsp;&nbsp;신&nbsp;&nbsp;<span className="text-[#1e2a3a] font-medium">{state.recipient}</span></p>
              {state.startDate && <p className="text-[#718096]">시작일&nbsp;&nbsp;<span className="text-[#1e2a3a] font-medium">{state.startDate}</span></p>}
              {state.endDate && <p className="text-[#718096]">종료일&nbsp;&nbsp;<span className="text-[#1e2a3a] font-medium">{state.endDate}</span></p>}
            </div>
            {state.companyName && (
              <div className="border border-gray-100 rounded-lg p-3 text-xs text-[#4a5568] space-y-1 relative">
                <InfoRow label="수&nbsp;&nbsp;신&nbsp;&nbsp;처" value={state.companyName} />
                <InfoRow label="주&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;소" value={state.companyAddress} />
                {/* 도장 */}
                <img
                  src="/images/stamp.png"
                  alt="도장"
                  className="absolute top-2 right-2 w-12 h-12 object-contain opacity-90 pointer-events-none"
                />
              </div>
            )}
          </div>

          {/* 항목 테이블 */}
          <div className="overflow-x-auto">
            <table className="text-sm border-collapse" style={{ minWidth: '640px', width: '100%' }}>
              <thead>
                <tr className="bg-gray-50">
                  <th className="border border-gray-200 px-3 py-2.5 text-center font-semibold text-[#4a5568]" style={{ minWidth: '90px' }}>대분류</th>
                  <th className="border border-gray-200 px-3 py-2.5 text-center font-semibold text-[#4a5568]" style={{ minWidth: '120px' }}>항목명</th>
                  <th className="border border-gray-200 px-3 py-2.5 text-center font-semibold text-[#4a5568]" style={{ minWidth: '110px' }}>금액</th>
                  <th className="border border-gray-200 px-3 py-2.5 text-center font-semibold text-[#4a5568]" style={{ minWidth: '110px' }}>총액</th>
                  <th className="border border-gray-200 px-3 py-2.5 text-center font-semibold text-[#4a5568]" style={{ minWidth: '140px' }}>비고</th>
                  <th className="border border-gray-200" style={{ width: '32px' }} />
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
                    <td className="border border-gray-200 p-1 text-center">
                      <button
                        onClick={() => deleteItem(idx)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity p-1 text-red-400 hover:text-red-600"
                      >
                        <Trash2 size={13} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* 합계 */}
          <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between">
            <span className="font-semibold text-[#1e2a3a]">합 계 {VAT_LABEL[state.vatType] && `(${VAT_LABEL[state.vatType]})`}</span>
            <span className="font-bold text-lg text-[#1e2a3a]">{total.toLocaleString()}원</span>
          </div>

          {/* 특약사항 */}
          {state.specialTerms && (
            <div className="px-6 py-4 border-t border-gray-100">
              <p className="text-sm font-semibold text-[#4a5568] mb-2">특약사항</p>
              <p className="text-sm text-[#718096] whitespace-pre-wrap">{state.specialTerms}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
