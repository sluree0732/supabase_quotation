'use client'

import { useState } from 'react'
import { Building2, ChevronRight, X, Plus, Sparkles, Loader2, Save, FileSignature } from 'lucide-react'
import { BsFiletypePdf, BsFiletypeXlsx } from 'react-icons/bs'

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
  status: 'draft' | 'saved' | null
}

interface Props {
  initial: QuotationFormState
  isEdit: boolean
  saving: boolean
  onSave: (state: QuotationFormState, status: 'draft' | 'saved') => Promise<void>
  onPdf: (state: QuotationFormState) => Promise<void>
  pdfLoading: boolean
  onExcel: (state: QuotationFormState) => Promise<void>
  excelLoading: boolean
  onSaveSuccess: (status: 'draft' | 'saved') => void
  quotationId?: string
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

export default function QuotationForm({ initial, isEdit, saving, onSave, onPdf, pdfLoading, onExcel, excelLoading, onSaveSuccess, quotationId }: Props) {
  const [state, setState] = useState<QuotationFormState>(initial)
  const [showCompany, setShowCompany] = useState(false)
  const [editIdx, setEditIdx] = useState<number | null>(null)
  const [showAdd, setShowAdd] = useState(false)
  const [aiAllLoading, setAiAllLoading] = useState(false)
  const [toast, setToast] = useState<string | null>(null)
  const [isDirty, setIsDirty] = useState(false)

  const isSaved = state.status === 'saved'

  const set = (patch: Partial<QuotationFormState>) => {
    setState(s => ({ ...s, ...patch }))
    if (!('status' in patch) && isSaved) setIsDirty(true)
  }
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

  function showToast(msg: string) {
    setToast(msg)
    setTimeout(() => setToast(null), 2000)
  }

  async function handleSave(status: 'draft' | 'saved') {
    if (!state.recipient.trim()) { alert('수신인을 입력해주세요.'); return }
    if (status === 'saved' && !state.items.length) { alert('항목을 1개 이상 추가해주세요.'); return }
    await onSave(state, status)
    setState(s => ({ ...s, status }))
    setIsDirty(false)
    onSaveSuccess(status)
    showToast(status === 'saved' ? '저장 완료' : '임시저장 완료')
  }

  return (
    <div className="px-4 py-6 md:px-8">
      {/* ── PC: 2단 레이아웃 / 모바일: 단일 컬럼 ── */}
      <div className="md:grid md:grid-cols-[1fr_1.4fr] md:gap-6 md:items-start space-y-6 md:space-y-0">

        {/* ── 왼쪽: 기본 정보 ───────────────────── */}
        <Section title="기본 정보">
          <Field label="수신인 *">
            <input
              type="text"
              value={state.recipient}
              onChange={e => set({ recipient: e.target.value })}
              placeholder="예: 홍길동 대표"
              className="input-base"
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

        {/* ── 오른쪽: 견적 항목 + 합계 + 버튼 ─── */}
        <div className="space-y-4">
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

          {/* 합계 */}
          {state.items.length > 0 && (
            <div className="bg-[#1e2a3a] rounded-2xl px-5 py-4 flex items-center justify-between">
              <div>
                <p className="text-white/60 text-xs">합계</p>
                <p className="text-white font-bold text-2xl mt-0.5">{total.toLocaleString()}원</p>
              </div>
              <span className="text-white/60 text-xs">{VAT_LABEL[state.vatType]}</span>
            </div>
          )}

          {/* 액션 버튼 */}
          <div className="space-y-2 pb-8">
            {/* 다운로드: saved 상태일 때만 표시 */}
            {isSaved && (
              <div className="bg-white border border-gray-200 rounded-xl px-4 py-3">
                <p className="text-xs text-gray-400 font-medium mb-3">다운로드</p>
                <div className="flex gap-6 justify-center">
                  <button
                    onClick={() => onExcel(state)}
                    disabled={excelLoading}
                    className="flex flex-col items-center gap-1.5 disabled:opacity-40"
                  >
                    <div className="w-14 h-14 rounded-2xl bg-[#217346] flex items-center justify-center shadow-sm hover:opacity-90 transition-opacity">
                      {excelLoading
                        ? <Loader2 size={28} className="animate-spin text-white" />
                        : <BsFiletypeXlsx size={28} color="white" />}
                    </div>
                    <span className="text-xs text-gray-500">{excelLoading ? '생성 중...' : '엑셀'}</span>
                  </button>
                  <button
                    onClick={() => onPdf(state)}
                    disabled={pdfLoading}
                    className="flex flex-col items-center gap-1.5 disabled:opacity-40"
                  >
                    <div className="w-14 h-14 rounded-2xl bg-[#e74c3c] flex items-center justify-center shadow-sm hover:opacity-90 transition-opacity">
                      {pdfLoading
                        ? <Loader2 size={28} className="animate-spin text-white" />
                        : <BsFiletypePdf size={28} color="white" />}
                    </div>
                    <span className="text-xs text-gray-500">{pdfLoading ? '생성 중...' : 'PDF'}</span>
                  </button>
                </div>
              </div>
            )}

            {/* 저장 / 계약서 작성 버튼 (상태에 따라 전환) */}
            {isSaved && !isDirty && quotationId ? (
              <a
                href={`/contracts/new?quotationId=${quotationId}`}
                className="w-full py-3.5 rounded-xl bg-[#8e44ad] text-white font-semibold flex items-center justify-center gap-2"
              >
                <FileSignature size={16} />
                계약서 작성
              </a>
            ) : (
              <button
                onClick={() => handleSave('saved')}
                disabled={saving}
                className="w-full py-3.5 rounded-xl bg-[#27ae60] text-white font-semibold flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                저장
              </button>
            )}

            {/* 임시저장 */}
            <button
              onClick={() => handleSave('draft')}
              disabled={saving}
              className="w-full py-3.5 rounded-xl bg-gray-100 text-[#4a5568] font-medium text-sm disabled:opacity-50"
            >
              임시저장
            </button>
          </div>
        </div>

      </div>

      {/* ── 토스트 ────────────────────────────────────── */}
      {toast && (
        <div className="fixed bottom-24 md:bottom-8 left-1/2 -translate-x-1/2 z-[80] bg-[#1e2a3a] text-white text-sm font-medium px-5 py-3 rounded-2xl shadow-lg flex items-center gap-2 animate-fade-in">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="8" fill="#27ae60"/><path d="M4.5 8l2.5 2.5 4.5-4.5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
          {toast}
        </div>
      )}

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
