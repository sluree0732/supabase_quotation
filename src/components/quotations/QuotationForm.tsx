'use client'

import { useState, useEffect } from 'react'
import { Building2, ChevronRight, X, Plus, Sparkles, Loader2, Save, FileSignature, ChevronDown, ChevronUp } from 'lucide-react'
import { BsFiletypeXlsx } from 'react-icons/bs'

import type { Company, CompanyInfo, QuotationItem, VatType } from '@/types'
import CompanyPickerModal from './CompanyPickerModal'
import ItemModal, { type ItemPrefill } from './ItemModal'
import ExcelViewerModal from './ExcelViewerModal'
import RecipientCombobox from '@/components/shared/RecipientCombobox'

// ── 타입 ──────────────────────────────────────────────────
export interface QuotationFormState {
  projectName: string
  recipient: string
  quoteDate: string
  senderCompany: Company | null
  senderInfo: CompanyInfo | null
  company: Company | null
  clientInfo: CompanyInfo | null
  vatType: VatType
  items: QuotationItem[]
  status: 'draft' | 'saved' | null
}

interface Props {
  initial: QuotationFormState
  isEdit: boolean
  saving: boolean
  onSave: (state: QuotationFormState, status: 'draft' | 'saved') => Promise<void>
  onSaveSuccess: (status: 'draft' | 'saved') => void
  quotationId?: string
  itemPrefill?: ItemPrefill
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

function companyToInfo(c: Company): CompanyInfo {
  return {
    name: c.name ?? '',
    address: c.address ?? '',
    phone: c.phone ?? '',
    business_no: c.business_no ?? '',
    business_type: c.business_type ?? '',
    business_item: c.business_item ?? '',
    email: c.email ?? '',
    fax: c.fax ?? '',
  }
}

// ── 업체 정보 인라인 편집 컴포넌트 ──────────────────────────
function CompanyInfoEditor({
  info,
  onChange,
  open,
  onOpenChange,
  extraBottom,
}: {
  info: CompanyInfo
  onChange: (info: CompanyInfo) => void
  open: boolean
  onOpenChange: (v: boolean) => void
  extraBottom?: React.ReactNode
}) {
  const field = (label: string, key: keyof CompanyInfo) => (
    <div className="space-y-1">
      <label className="text-xs text-[#718096]">{label}</label>
      <input
        type="text"
        value={info[key]}
        onChange={e => onChange({ ...info, [key]: e.target.value })}
        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:border-[#2980b9] transition-colors"
      />
    </div>
  )

  return (
    <div className="mt-1.5 border border-gray-100 rounded-xl">
      <button
        onClick={() => onOpenChange(!open)}
        className="w-full flex items-center justify-between px-3 py-2 bg-gray-50 text-xs text-[#4a5568] font-medium rounded-t-xl"
      >
        <span>상세 정보 편집</span>
        {open ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
      </button>
      {open && (
        <div className="px-3 py-3 space-y-2.5 bg-white rounded-b-xl">
          {field('업체명', 'name')}
          {field('주소', 'address')}
          {field('연락처', 'phone')}
          {field('사업자 등록번호', 'business_no')}
          {field('업태', 'business_type')}
          {field('업종', 'business_item')}
          {field('이메일', 'email')}
          {field('팩스', 'fax')}
          {extraBottom}
        </div>
      )}
    </div>
  )
}

export default function QuotationForm({ initial, isEdit, saving, onSave, onSaveSuccess, quotationId, itemPrefill }: Props) {
  const [state, setState] = useState<QuotationFormState>(initial)
  const [showSenderPicker, setShowSenderPicker] = useState(false)
  const [showClientPicker, setShowClientPicker] = useState(false)
  const [editIdx, setEditIdx] = useState<number | null>(null)
  const [showAdd, setShowAdd] = useState(false)
  const [toast, setToast] = useState<string | null>(null)
  const [isDirty, setIsDirty] = useState(false)
  const [showExcelViewer, setShowExcelViewer] = useState(false)
  const [senderInfoOpen, setSenderInfoOpen] = useState(true)
  const [clientInfoOpen, setClientInfoOpen] = useState(true)

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

  useEffect(() => {
    if (!itemPrefill) return
    set({
      items: [{
        category: itemPrefill.category ?? '',
        item_name: itemPrefill.itemName ?? '',
        unit_price: 0,
        total_price: 0,
        note: itemPrefill.note ?? '',
        sub_category: '',
        period: 0,
        sort_order: 0,
      }]
    })
  }, [])

  function updateItem(idx: number, data: Omit<QuotationItem, 'id' | 'quotation_id' | 'sort_order'>) {
    set({ items: state.items.map((it, i) => i === idx ? { ...it, ...data } : it) })
  }

  function deleteItem(idx: number) {
    set({ items: state.items.filter((_, i) => i !== idx).map((it, i) => ({ ...it, sort_order: i })) })
  }

  function showToast(msg: string) {
    setToast(msg)
    setTimeout(() => setToast(null), 2000)
  }

  async function handleSave(status: 'draft' | 'saved') {
    if (!state.recipient.trim()) { alert('수신 담당자를 입력해주세요.'); return }
    if (status === 'saved' && !state.items.length) { alert('항목을 1개 이상 추가해주세요.'); return }
    await onSave(state, status)
    setState(s => ({ ...s, status }))
    setIsDirty(false)
    onSaveSuccess(status)
    showToast(status === 'saved' ? '저장 완료' : '임시저장 완료')
  }

  return (
    <div className="px-4 py-6 md:px-8">
      <div className="md:grid md:grid-cols-[1fr_1.4fr] md:gap-6 md:items-start space-y-6 md:space-y-0">

        {/* ── 왼쪽: 기본 정보 ───────────────────── */}
        <Section title="기본 정보">
          {/* 프로젝트명 */}
          <Field label="프로젝트명">
            <input
              type="text"
              value={state.projectName}
              onChange={e => set({ projectName: e.target.value })}
              placeholder="예: 2026년 상반기 마케팅 캠페인"
              className="input-base"
            />
          </Field>

          {/* 견적일 */}
          <Field label="견적일">
            <input
              type="date"
              value={state.quoteDate}
              onChange={e => set({ quoteDate: e.target.value })}
              className="input-base"
            />
          </Field>

          {/* 발신 업체 */}
          <Field label="발신 업체">
            <button
              onClick={() => setShowSenderPicker(true)}
              className="w-full flex items-center gap-3 px-4 py-3 border border-gray-200 rounded-xl bg-white hover:border-[#2980b9] transition-colors text-left"
            >
              <Building2 size={18} className="text-[#27ae60] shrink-0" />
              <span className={`flex-1 text-sm ${state.senderCompany ? 'text-[#1e2a3a] font-medium' : 'text-gray-400'}`}>
                {state.senderCompany?.name ?? '자사 업체 선택 (선택사항)'}
              </span>
              {state.senderCompany ? (
                <button
                  onClick={e => { e.stopPropagation(); set({ senderCompany: null, senderInfo: null }) }}
                  className="p-0.5 text-gray-400 hover:text-gray-600"
                >
                  <X size={14} />
                </button>
              ) : (
                <ChevronRight size={16} className="text-gray-400" />
              )}
            </button>
            {state.senderInfo && (
              <CompanyInfoEditor
                info={state.senderInfo}
                onChange={info => set({ senderInfo: info })}
                open={senderInfoOpen}
                onOpenChange={setSenderInfoOpen}
              />
            )}
          </Field>

          {/* 수신 업체 */}
          <Field label="수신 업체">
            <button
              onClick={() => setShowClientPicker(true)}
              className="w-full flex items-center gap-3 px-4 py-3 border border-gray-200 rounded-xl bg-white hover:border-[#2980b9] transition-colors text-left"
            >
              <Building2 size={18} className="text-[#2980b9] shrink-0" />
              <span className={`flex-1 text-sm ${state.company ? 'text-[#1e2a3a] font-medium' : 'text-gray-400'}`}>
                {state.company?.name ?? '광고주 업체 선택 (선택사항)'}
              </span>
              {state.company ? (
                <button
                  onClick={e => { e.stopPropagation(); set({ company: null, clientInfo: null }) }}
                  className="p-0.5 text-gray-400 hover:text-gray-600"
                >
                  <X size={14} />
                </button>
              ) : (
                <ChevronRight size={16} className="text-gray-400" />
              )}
            </button>
            {state.clientInfo && (
              <CompanyInfoEditor
                info={state.clientInfo}
                onChange={info => set({ clientInfo: info })}
                open={clientInfoOpen}
                onOpenChange={setClientInfoOpen}
                extraBottom={
                  <div className="space-y-1">
                    <label className="text-xs text-[#718096]">수신 담당자</label>
                    <RecipientCombobox
                      companyId={state.company?.id ?? null}
                      initialContacts={state.company?.contacts}
                      value={state.recipient}
                      onChange={v => set({ recipient: v })}
                    />
                  </div>
                }
              />
            )}
          </Field>

          {/* 부가세 */}
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
                          <span className="font-semibold text-[#1e2a3a]">{item.total_price.toLocaleString()}원</span>
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
            {isSaved && (
              <div className="bg-white border border-gray-200 rounded-xl px-4 py-3">
                <p className="text-xs text-gray-400 font-medium mb-3">미리보기 / 다운로드</p>
                <div className="flex gap-6 justify-center">
                  <button
                    onClick={() => setShowExcelViewer(true)}
                    className="flex flex-col items-center gap-1.5"
                  >
                    <div className="w-14 h-14 rounded-2xl bg-[#217346] flex items-center justify-center shadow-sm hover:opacity-90 transition-opacity">
                      <BsFiletypeXlsx size={28} color="white" />
                    </div>
                    <span className="text-xs text-gray-500">엑셀/PDF</span>
                  </button>
                </div>
              </div>
            )}

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

      {/* ── 뷰어 모달 ─────────────────────────────────── */}
      {showExcelViewer && (
        <ExcelViewerModal state={state} onClose={() => setShowExcelViewer(false)} />
      )}

      {/* ── 모달 ──────────────────────────────────────── */}
      {showSenderPicker && (
        <CompanyPickerModal
          selected={state.senderCompany}
          typeFilter="sender"
          onSelect={company => set({ senderCompany: company, senderInfo: companyToInfo(company) })}
          onClose={() => setShowSenderPicker(false)}
        />
      )}
      {showClientPicker && (
        <CompanyPickerModal
          selected={state.company}
          typeFilter="client"
          onSelect={company => set({ company, clientInfo: companyToInfo(company) })}
          onClose={() => setShowClientPicker(false)}
        />
      )}
      {showAdd && (
        <ItemModal
          prefill={itemPrefill}
          onSave={addItem}
          onUpdate={(idx, data) => updateItem(idx, data)}
          items={state.items}
          onAiAllResult={(notes) => {
            setState(s => ({
              ...s,
              items: s.items.map((it, i) => ({
                ...it,
                note: notes[i] || it.note,
              })),
            }))
          }}
          onClose={(newCount, totalCount) => {
            setShowAdd(false)
            if (newCount && newCount > 0) {
              const msg = totalCount && totalCount > newCount
                ? `${newCount}개 항목 추가하여 총 ${totalCount}개 추가되었습니다`
                : `${newCount}개 항목이 추가되었습니다`
              showToast(msg)
            }
          }}
        />
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
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-50 rounded-t-2xl">
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
