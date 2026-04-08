'use client'

import { useState } from 'react'
import { Loader2, FileDown, Save } from 'lucide-react'
import type { QuotationItem, VatType, Company } from '@/types'

const VAT_LABEL: Record<VatType, string> = { excluded: '부가세 별도', included: '부가세 포함', none: '없음' }

interface Props {
  recipient: string
  quoteDate: string
  company: Company | null
  vatType: VatType
  items: QuotationItem[]
  onBack: () => void
  onSaveDraft: () => Promise<void>
  onSave: () => Promise<void>
  saving: boolean
}

export default function Step3Review({ recipient, quoteDate, company, vatType, items, onBack, onSaveDraft, onSave, saving }: Props) {
  const total = items.reduce((s, i) => s + i.total_price, 0)
  const [pdfLoading, setPdfLoading] = useState(false)

  async function handlePdfDownload() {
    setPdfLoading(true)
    try {
      const res = await fetch('/api/pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quoteDate, recipient, items, totalAmount: total, vatType }),
      })
      if (!res.ok) throw new Error('PDF 생성 실패')
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `견적서_${quoteDate.replace(/-/g, '')}.pdf`
      a.click()
      URL.revokeObjectURL(url)
    } catch (e: any) {
      alert(e.message ?? 'PDF 생성 실패')
    } finally {
      setPdfLoading(false)
    }
  }

  return (
    <div className="flex flex-col gap-5 px-4 py-5 md:px-8">
      {/* 기본 정보 카드 */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-3 shadow-sm">
        <h3 className="font-bold text-[#1e2a3a] text-sm">기본 정보</h3>
        <Row label="수신인" value={recipient} />
        <Row label="견적일" value={quoteDate} />
        <Row label="업체" value={company?.name ?? '—'} />
        <Row label="부가세" value={VAT_LABEL[vatType]} />
      </div>

      {/* 항목 카드 */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-3 shadow-sm">
        <h3 className="font-bold text-[#1e2a3a] text-sm">견적 항목 ({items.length}개)</h3>
        {items.map((item, i) => (
          <div key={i} className="flex items-start gap-2 py-2 border-b border-gray-50 last:border-0">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                {item.category && (
                  <span className="text-[10px] bg-[#ebf5fb] text-[#2980b9] px-1.5 py-0.5 rounded font-medium">
                    {item.category}
                  </span>
                )}
                <span className="text-sm font-medium text-[#1e2a3a]">{item.item_name}</span>
              </div>
              <p className="text-xs text-[#718096] mt-0.5">
                {item.period}개월 × {item.unit_price.toLocaleString()}원
              </p>
              {item.note && (
                <p className="text-xs text-[#a0aec0] mt-0.5 line-clamp-2">{item.note}</p>
              )}
            </div>
            <span className="font-bold text-sm text-[#1e2a3a] shrink-0">{item.total_price.toLocaleString()}원</span>
          </div>
        ))}
      </div>

      {/* 합계 */}
      <div className="bg-[#1e2a3a] rounded-2xl px-5 py-4 flex items-center justify-between">
        <div>
          <p className="text-white/60 text-xs">합계</p>
          <p className="text-white font-bold text-2xl mt-0.5">{total.toLocaleString()}원</p>
        </div>
        <span className="text-white/60 text-xs">{VAT_LABEL[vatType]}</span>
      </div>

      {/* 액션 버튼 */}
      <div className="flex flex-col gap-2 mt-1">
        {/* PDF 다운로드 */}
        <button
          onClick={handlePdfDownload}
          disabled={pdfLoading || items.length === 0}
          className="w-full py-3.5 rounded-xl bg-[#2980b9] text-white font-semibold flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {pdfLoading ? <Loader2 size={16} className="animate-spin" /> : <FileDown size={16} />}
          {pdfLoading ? 'PDF 생성 중...' : 'PDF 다운로드'}
        </button>
        {/* 저장 완료 */}
        <button
          onClick={onSave}
          disabled={saving}
          className="w-full py-3.5 rounded-xl bg-[#27ae60] text-white font-semibold flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
          저장 완료
        </button>
        {/* 임시저장 */}
        <button
          onClick={onSaveDraft}
          disabled={saving}
          className="w-full py-3.5 rounded-xl bg-gray-100 text-[#4a5568] font-medium text-sm flex items-center justify-center gap-2 disabled:opacity-50"
        >
          임시저장
        </button>
        <button onClick={onBack} className="w-full py-3 text-sm text-gray-400">
          ← 이전으로 돌아가기
        </button>
      </div>
    </div>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-[#718096]">{label}</span>
      <span className="font-medium text-[#1e2a3a]">{value || '—'}</span>
    </div>
  )
}
