'use client'

import { useState } from 'react'
import { Building2, ChevronRight, X, Plus, Sparkles, Loader2, FileDown, Save } from 'lucide-react'
import type { Company, QuotationItem, VatType } from '@/types'
import CompanyPickerModal from './CompanyPickerModal'
import ItemModal from './ItemModal'

// ── 타입 ──────────────────────────────────────────────────
export interface QuotationFormState {
  recipient: string
  quoteDate: string
  company: Company | null
  vatType: VatType
  items: QuotationItem[]
}

interface Props {
  initial: QuotationFormState
  isEdit: boolean
  saving: boolean
  onSave: (state: QuotationFormState, status: 'draft' | 'saved') => Promise<void>
  onPdf: (state: QuotationFormState) => Promise<void>
  pdfLoading: boolean
}

const VAT_OPTIONS: { value: VatType; label: string }[] = [
  { value: 'excluded', label: '별도' },
  { value: 'included', label: '포함' },
  { value: 'none', label: '없음' },
]

const VAT_LABEL: Record<VatType, string> = {
  excluded: '부가세 별도',
  included: '부가세 포함',
  none: '',
}

const CATEGORIES = ['기획', '디자인', '개발', '마케팅', '광고', '영상', '운영', '유지보수', '기타']

export default function QuotationForm({ initial, isEdit, saving, onSave, onPdf, pdfLoading }: Props) {
  const [state, setState] = useState<QuotationFormState>(initial)
  const [showCompany, setShowCompany] = useState(false)
  const [editIdx, setEditIdx] = useState<number | null>(null)
  const [showAdd, setShowAdd] = useState(false)
  const [aiAllLoading, setAiAllLoading] = useState(false)

  const set = (patch: Partial<QuotationFormState>) => setState(s => ({ ...s, ...patch }))
  const total = state.items.reduce((s, i) => s + i.total_price, 0)

  // ── 항목 조작 ─────────────────────────────────────────
  function addItem(data: Omit<QuotationItem, 'id' | 'quotation_id' | 'sort_order'>) {
    set({ items: [...state.items, { ...data, sort_order: state.items.length }] })
  }

  function updateItem(idx: number, data: Omit<QuotationItem, 'id' | 'quotation_id' | 'sort_order'>) {
    set({ items: state.items.map((it, i) => i === idx ? { ...it, ...data } : it) })
  }

  function deleteItem(idx: number) {
    set({ items: state.items.filter((_, i) => i !== idx).map((it, i) => ({ ...it, sort_order: i })) })
  }

  async function handleAiAll() {
    if (!state.items.length) { alert('항목을 먼저 추가해주세요.'); return }
    setAiAllLoading(true)
    try {
      const res = await fetch('/api/gemini', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: state.items.map(i => ({ category: i.category, item_name: i.item_name })) }),
      })
      const json = await res.json()
      if (json.notes) {
        set({ items: state.items.map((it, i) => ({ ...it, note: json.notes[i] ?? it.note })) })
      }
    } catch { alert('AI 생성 실패') }
    finally { setAiAllLoading(false) }
  }

  function handleSave(status: 'draft' | 'saved') {
    if (!state.recipient.trim()) { alert('수신인을 입력해주세요.'); return }
    if (status === 'saved' && !state.items.length) { alert('항목을 1개 이상 추가해주세요.'); return }
    onSave(state, status)
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 md:px-8 space-y-6">

      {/* ── 섹션 1: 기본 정보 ─────────────────────────── */}
      <Section title="기본 정보">
        <Field label="수신인 *">
          <input
            type="text"
            value={state.recipient}
            onChange={e => set({ recipient: e.target.value })}
            placeholder="예: 홍길동 대표"
            className="input-base"
            autoFocus
          />
        </Field>

        <Field label="견적일">
          <input
            type="date"
            value={state.quoteDate}
            onChange={e => set({ quoteDate: e.target.value })}
            className="input-base"
          />
        </Field>

        <Field label="수신 업체">
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
            <p className="text-xs text-gray-400 px-1 mt-1">{state.company.address}</p>
          )}
        </Field>

        <Field label="부가세">
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
        </Field>
      </Section>

      {/* ── 섹션 2: 견적 항목 ─────────────────────────── */}
      <Section
        title="견적 항목"
        action={
          <div className="flex items-center gap-2">
            <button
              onClick={handleAiAll}
              disabled={aiAllLoading || !state.items.length}
              className="flex items-center gap-1.5 text-xs text-[#8e44ad] font-medium border border-[#8e44ad]/30 rounded-lg px-2.5 py-1.5 disabled:opacity-40"
            >
              {aiAllLoading ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />}
              전체 AI 비고
            </button>
            <button
              onClick={() => setShowAdd(true)}
              className="flex items-center gap-1.5 bg-[#2980b9] text-white px-3 py-1.5 rounded-lg text-xs font-semibold"
            >
              <Plus size={14} />
              항목 추가
            </button>
          </div>
        }
      >
        {state.items.length === 0 ? (
          <button
            onClick={() => setShowAdd(true)}
            className="w-full flex flex-col items-center justify-center gap-2 py-10 border-2 border-dashed border-gray-200 rounded-2xl text-gray-400 hover:border-[#2980b9] hover:text-[#2980b9] transition-colors"
          >
            <Plus size={24} />
            <span className="text-sm">항목 추가 버튼을 눌러 시작하세요</span>
          </button>
        ) : (
          <ul className="space-y-2">
            {state.items.map((item, idx) => (
              <li key={idx}>
                <button
                  onClick={() => setEditIdx(idx)}
                  className="w-full bg-white rounded-2xl border border-gray-100 px-4 py-4 flex items-center gap-3 text-left shadow-sm hover:border-[#2980b9]/30 active:scale-[0.99] transition-all"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      {item.category && (
                        <span className="text-[10px] bg-[#ebf5fb] text-[#2980b9] px-2 py-0.5 rounded-full font-medium">
                          {item.category}
                        </span>
                      )}
                      <span className="font-semibold text-sm text-[#1e2a3a]">{item.item_name}</span>
                    </div>
                    <div className="flex items-center gap-3 mt-1 text-xs text-[#718096]">
                      <span>{item.period}개월 × {item.unit_price.toLocaleString()}원</span>
                      <span className="font-semibold text-[#1e2a3a]">= {item.total_price.toLocaleString()}원</span>
                    </div>
                    {item.note && (
                      <p className="text-xs text-[#a0aec0] mt-1 line-clamp-1">{item.note.replace(/•/g, '·')}</p>
                    )}
                  </div>
                  <ChevronRight size={16} className="text-gray-300 shrink-0" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </Section>

      {/* ── 섹션 3: 합계 ──────────────────────────────── */}
      {state.items.length > 0 && (
        <div className="bg-[#1e2a3a] rounded-2xl px-5 py-4 flex items-center justify-between">
          <div>
            <p className="text-white/60 text-xs">합계</p>
            <p className="text-white font-bold text-2xl mt-0.5">{total.toLocaleString()}원</p>
          </div>
          <span className="text-white/60 text-xs">{VAT_LABEL[state.vatType]}</span>
        </div>
      )}

      {/* ── 섹션 4: 액션 버튼 ─────────────────────────── */}
      <div className="space-y-2 pb-8">
        <button
          onClick={() => onPdf(state)}
          disabled={pdfLoading || !state.items.length}
          className="w-full py-3.5 rounded-xl bg-[#2980b9] text-white font-semibold flex items-center justify-center gap-2 disabled:opacity-40"
        >
          {pdfLoading ? <Loader2 size={16} className="animate-spin" /> : <FileDown size={16} />}
          {pdfLoading ? 'PDF 생성 중...' : 'PDF 다운로드'}
        </button>
        <button
          onClick={() => handleSave('saved')}
          disabled={saving}
          className="w-full py-3.5 rounded-xl bg-[#27ae60] text-white font-semibold flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
          저장 완료
        </button>
        <button
          onClick={() => handleSave('draft')}
          disabled={saving}
          className="w-full py-3.5 rounded-xl bg-gray-100 text-[#4a5568] font-medium text-sm disabled:opacity-50"
        >
          임시저장
        </button>
      </div>

      {/* ── 모달 ──────────────────────────────────────── */}
      {showCompany && (
        <CompanyPickerModal
          selected={state.company}
          onSelect={company => set({ company })}
          onClose={() => setShowCompany(false)}
        />
      )}
      {showAdd && (
        <ItemModal onSave={addItem} onClose={() => setShowAdd(false)} />
      )}
      {editIdx !== null && (
        <ItemModal
          item={state.items[editIdx]}
          onSave={data => updateItem(editIdx, data)}
          onDelete={() => deleteItem(editIdx)}
          onClose={() => setEditIdx(null)}
        />
      )}
    </div>
  )
}

// ── 공통 UI ───────────────────────────────────────────────
function Section({ title, action, children }: {
  title: string
  action?: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-50">
        <h2 className="font-bold text-[#1e2a3a] text-sm">{title}</h2>
        {action}
      </div>
      <div className="px-5 py-4 space-y-4">{children}</div>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="text-sm font-medium text-[#4a5568]">{label}</label>
      {children}
    </div>
  )
}
