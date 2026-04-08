'use client'

import { useState } from 'react'
import { Building2, ChevronRight, X } from 'lucide-react'
import type { Company, VatType } from '@/types'
import CompanyPickerModal from './CompanyPickerModal'

interface Step1State {
  recipient: string
  quoteDate: string
  company: Company | null
  vatType: VatType
}

interface Props {
  state: Step1State
  onChange: (s: Step1State) => void
  onNext: () => void
  loading: boolean
}

const VAT_OPTIONS: { value: VatType; label: string }[] = [
  { value: 'excluded', label: '별도' },
  { value: 'included', label: '포함' },
  { value: 'none', label: '없음' },
]

export default function Step1BasicInfo({ state, onChange, onNext, loading }: Props) {
  const [showCompany, setShowCompany] = useState(false)

  const set = (patch: Partial<Step1State>) => onChange({ ...state, ...patch })

  function handleNext() {
    if (!state.recipient.trim()) {
      alert('수신인을 입력해주세요.')
      return
    }
    onNext()
  }

  return (
    <div className="flex flex-col gap-5 px-4 py-5 md:px-8">
      {/* 수신인 */}
      <div className="space-y-1.5">
        <label className="text-sm font-medium text-[#4a5568]">수신인 *</label>
        <input
          type="text"
          value={state.recipient}
          onChange={e => set({ recipient: e.target.value })}
          placeholder="예: 홍길동 대표"
          className="input-base"
          autoFocus
        />
      </div>

      {/* 견적일 */}
      <div className="space-y-1.5">
        <label className="text-sm font-medium text-[#4a5568]">견적일</label>
        <input
          type="date"
          value={state.quoteDate}
          onChange={e => set({ quoteDate: e.target.value })}
          className="input-base"
        />
      </div>

      {/* 업체 선택 */}
      <div className="space-y-1.5">
        <label className="text-sm font-medium text-[#4a5568]">수신 업체</label>
        <button
          onClick={() => setShowCompany(true)}
          className="w-full flex items-center gap-3 px-4 py-3 border border-gray-200 rounded-xl bg-white hover:border-[#2980b9] transition-colors text-left"
        >
          <Building2 size={18} className="text-[#2980b9] shrink-0" />
          <span className={`flex-1 text-sm ${state.company ? 'text-[#1e2a3a] font-medium' : 'text-gray-400'}`}>
            {state.company?.name ?? '업체 선택 (선택사항)'}
          </span>
          {state.company ? (
            <button
              onClick={e => { e.stopPropagation(); set({ company: null }) }}
              className="p-0.5 text-gray-400 hover:text-gray-600"
            >
              <X size={14} />
            </button>
          ) : (
            <ChevronRight size={16} className="text-gray-400" />
          )}
        </button>
        {state.company?.address && (
          <p className="text-xs text-gray-400 px-1">{state.company.address}</p>
        )}
      </div>

      {/* 부가세 */}
      <div className="space-y-1.5">
        <label className="text-sm font-medium text-[#4a5568]">부가세</label>
        <div className="flex gap-2">
          {VAT_OPTIONS.map(opt => (
            <button
              key={opt.value}
              onClick={() => set({ vatType: opt.value })}
              className={`flex-1 py-2.5 rounded-xl text-sm font-medium border transition-colors ${
                state.vatType === opt.value
                  ? 'bg-[#2980b9] text-white border-[#2980b9]'
                  : 'bg-white text-[#4a5568] border-gray-200 hover:border-[#2980b9]'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* 다음 버튼 */}
      <button
        onClick={handleNext}
        disabled={loading}
        className="w-full py-3.5 bg-[#2980b9] text-white rounded-xl font-semibold text-sm mt-2 disabled:opacity-50"
      >
        {loading ? '처리 중...' : '다음 — 항목 입력'}
      </button>

      {showCompany && (
        <CompanyPickerModal
          selected={state.company}
          onSelect={company => set({ company })}
          onClose={() => setShowCompany(false)}
        />
      )}
    </div>
  )
}
