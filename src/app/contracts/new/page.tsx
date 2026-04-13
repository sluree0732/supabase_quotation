'use client'

import { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Building2, ChevronRight, X, Plus, Loader2, Save, ChevronLeft, FileDown } from 'lucide-react'
import type { Company, ContractItem, VatType, ContractStatus } from '@/types'
import {
  createContract, updateContract, saveContractItems, getContractWithItems,
  deleteDraftsByQuotationId,
} from '@/lib/contracts'
import { getQuotationWithItems } from '@/lib/quotations'
import CompanyPickerModal from '@/components/quotations/CompanyPickerModal'
import ItemModal from '@/components/quotations/ItemModal'
import ContractPdfViewerModal from '@/components/contracts/ContractPdfViewerModal'
import RecipientCombobox from '@/components/shared/RecipientCombobox'

function today() {
  return new Date().toISOString().slice(0, 10)
}

interface ContractFormState {
  company: Company | null
  contractDate: string
  startDate: string
  endDate: string
  recipient: string
  vatType: VatType
  items: ContractItem[]
  specialTerms: string
  status: ContractStatus | null
  savedQuotationId: string | null
  savedId: string | null
}

const INITIAL: ContractFormState = {
  company: null,
  contractDate: today(),
  startDate: today(),
  endDate: '',
  recipient: '',
  vatType: 'excluded',
  items: [],
  specialTerms: '',
  status: null,
  savedQuotationId: null,
  savedId: null,
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

function ContractPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const editId = searchParams.get('id')
  const quotationId = searchParams.get('quotationId')

  const [form, setForm] = useState<ContractFormState>(INITIAL)
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(!!(editId || quotationId))
  const [showPdfViewer, setShowPdfViewer] = useState(false)
  const [showCompany, setShowCompany] = useState(false)
  const [showAdd, setShowAdd] = useState(false)
  const [editIdx, setEditIdx] = useState<number | null>(null)
  const [toast, setToast] = useState<string | null>(null)

  function showToast(msg: string) {
    setToast(msg)
    setTimeout(() => setToast(null), 2000)
  }

  const set = (patch: Partial<ContractFormState>) => setForm(s => ({ ...s, ...patch }))
  const total = form.items.reduce((s, i) => s + i.total_price, 0)

  useEffect(() => {
    if (!editId && !quotationId) {
      setForm(INITIAL)
      setLoading(false)
      return
    }
    if (editId) {
      setLoading(true)
      getContractWithItems(editId).then(data => {
        setForm({
          company: data.companies ?? null,
          contractDate: data.contract_date,
          startDate: data.start_date ?? today(),
          endDate: data.end_date ?? '',
          recipient: data.recipient ?? '',
          vatType: data.vat_type,
          items: data.items,
          specialTerms: data.special_terms ?? '',
          status: data.status,
          savedQuotationId: data.quotation_id ?? null,
          savedId: editId,
        })
      }).finally(() => setLoading(false))
      return
    }
    if (quotationId) {
      setLoading(true)
      getQuotationWithItems(quotationId).then(data => {
        if (!data) return
        const period = data.period ?? 1
        const start = today()
        const endDate = (() => {
          const d = new Date(start)
          d.setMonth(d.getMonth() + period)
          d.setDate(d.getDate() - 1)
          return d.toISOString().slice(0, 10)
        })()
        setForm(prev => ({
          ...prev,
          company: data.companies ?? null,
          recipient: data.recipient,
          vatType: data.vat_type,
          startDate: start,
          endDate,
          items: data.items.map(it => ({ ...it, contract_id: undefined })),
        }))
      }).finally(() => setLoading(false))
    }
  }, [editId, quotationId])

  function addItem(data: Omit<ContractItem, 'id' | 'contract_id' | 'sort_order'>) {
    set({ items: [...form.items, { ...data, sort_order: form.items.length }] })
  }

  function updateItem(idx: number, data: Omit<ContractItem, 'id' | 'contract_id' | 'sort_order'>) {
    set({ items: form.items.map((it, i) => i === idx ? { ...it, ...data } : it) })
  }

  function deleteItem(idx: number) {
    set({ items: form.items.filter((_, i) => i !== idx).map((it, i) => ({ ...it, sort_order: i })) })
  }

  function getPdfPayload() {
    const dateStr = form.contractDate.replace(/-/g, '')
    const name = form.company?.name ?? ''
    return {
      contractDate: form.contractDate,
      startDate: form.startDate,
      endDate: form.endDate,
      recipient: form.recipient,
      companyName: name,
      companyAddress: form.company?.address ?? '',
      items: form.items,
      totalAmount: total,
      vatType: form.vatType,
      specialTerms: form.specialTerms,
      filename: name ? `${name}_계약서(${dateStr}).pdf` : `계약서(${dateStr}).pdf`,
    }
  }

  async function handleSave(status: ContractStatus) {
    if (!form.recipient.trim()) { alert('수신 담당자를 입력해주세요.'); return }
    setSaving(true)
    try {
      const payload = {
        company_id: form.company?.id ?? null,
        contract_date: form.contractDate,
        start_date: form.startDate || null,
        end_date: form.endDate || null,
        recipient: form.recipient,
        total_amount: total,
        vat_type: form.vatType,
        status,
        special_terms: form.specialTerms || null,
        quotation_id: quotationId ?? null,
      }

      let savedId = form.savedId
      if (editId) {
        await Promise.all([
          updateContract(editId, payload),
          saveContractItems(editId, form.items),
        ])
        savedId = editId
      } else {
        const c = await createContract({
          quotation_id: quotationId ?? null,
          company_id: form.company?.id ?? null,
          contract_date: form.contractDate,
          recipient: form.recipient,
        })
        await Promise.all([
          updateContract(c.id, { ...payload }),
          saveContractItems(c.id, form.items),
        ])
        savedId = c.id
      }

      if (status === 'signed') {
        const qid = quotationId ?? form.savedQuotationId
        if (qid && savedId) {
          await deleteDraftsByQuotationId(qid, savedId)
        }
        set({ status: 'signed', savedId })
        showToast('계약이 완료되었습니다.')
      } else {
        set({ status: 'draft', savedId })
        showToast('임시저장 완료')
      }
    } catch (e: any) {
      alert(e.message ?? '저장 실패')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-400 text-sm">
        불러오는 중...
      </div>
    )
  }

  return (
    <div className="flex flex-col min-h-full">
      {/* 토스트 */}
      {toast && (
        <div className="fixed bottom-24 md:bottom-8 left-1/2 -translate-x-1/2 z-[80] bg-[#1e2a3a] text-white text-sm font-medium px-5 py-3 rounded-2xl shadow-lg flex items-center gap-2 animate-fade-in">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="8" fill="#27ae60"/><path d="M4.5 8l2.5 2.5 4.5-4.5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
          {toast}
        </div>
      )}

      {/* 헤더 */}
      <div className="bg-white border-b border-gray-100 px-4 py-4 md:px-8 sticky top-0 z-10 flex items-center gap-3">
        <button onClick={() => router.back()} className="p-1 text-gray-400 hover:text-gray-600">
          <ChevronLeft size={20} />
        </button>
        <h1 className="text-xl font-bold text-[#1e2a3a]">
          {editId ? '계약서 수정' : '새 계약서'}
        </h1>
      </div>

      <div className="px-4 py-6 md:px-8">
        <div className="md:grid md:grid-cols-[1fr_1.4fr] md:gap-6 md:items-start space-y-6 md:space-y-0">

          {/* ── 왼쪽: 기본 정보 ── */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
            <div className="px-5 py-4 border-b border-gray-50 rounded-t-2xl">
              <h2 className="font-bold text-[#1e2a3a] text-sm">기본 정보</h2>
            </div>
            <div className="px-5 py-4 space-y-4">

              <Field label="계약일">
                <input type="date" value={form.contractDate}
                  onChange={e => set({ contractDate: e.target.value })} className="input-base" />
              </Field>

              <Field label="수신 업체">
                <button onClick={() => setShowCompany(true)}
                  className="w-full flex items-center gap-3 px-4 py-3 border border-gray-200 rounded-xl bg-white hover:border-[#2980b9] transition-colors text-left">
                  <Building2 size={18} className="text-[#2980b9] shrink-0" />
                  <span className={`flex-1 text-sm ${form.company ? 'text-[#1e2a3a] font-medium' : 'text-gray-400'}`}>
                    {form.company?.name ?? '업체 선택 (선택사항)'}
                  </span>
                  {form.company ? (
                    <button onClick={e => { e.stopPropagation(); set({ company: null }) }}
                      className="p-0.5 text-gray-400 hover:text-gray-600">
                      <X size={14} />
                    </button>
                  ) : (
                    <ChevronRight size={16} className="text-gray-400" />
                  )}
                </button>
              </Field>

              <Field label="수신 담당자">
                <RecipientCombobox
                  companyId={form.company?.id ?? null}
                  initialContacts={form.company?.contacts}
                  value={form.recipient}
                  onChange={v => set({ recipient: v })}
                />
              </Field>

              <div className="grid grid-cols-2 gap-3">
                <Field label="계약 시작일">
                  <input type="date" value={form.startDate}
                    onChange={e => set({ startDate: e.target.value })} className="input-base" />
                </Field>
                <Field label="계약 종료일">
                  <input type="date" value={form.endDate}
                    onChange={e => set({ endDate: e.target.value })} className="input-base" />
                </Field>
              </div>

              <Field label="부가세">
                <div className="flex gap-2">
                  {VAT_OPTIONS.map(opt => (
                    <button key={opt.value} onClick={() => set({ vatType: opt.value })}
                      className={`flex-1 py-2.5 rounded-xl text-sm font-medium border transition-colors ${
                        form.vatType === opt.value
                          ? 'bg-[#2980b9] text-white border-[#2980b9]'
                          : 'bg-white text-[#4a5568] border-gray-200 hover:border-[#2980b9]'
                      }`}>
                      {opt.label}
                    </button>
                  ))}
                </div>
              </Field>

              <Field label="특약사항">
                <textarea
                  value={form.specialTerms}
                  onChange={e => set({ specialTerms: e.target.value })}
                  placeholder="계약에 추가할 특이사항을 입력하세요"
                  rows={4}
                  className="input-base resize-none"
                />
              </Field>
            </div>
          </div>

          {/* ── 오른쪽: 계약 항목 + 합계 + 버튼 ── */}
          <div className="space-y-4">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="flex items-center justify-between px-5 py-4 border-b border-gray-50">
                <h2 className="font-bold text-[#1e2a3a] text-sm">계약 항목</h2>
                <button onClick={() => setShowAdd(true)}
                  className="flex items-center gap-1.5 bg-[#2980b9] text-white px-3 py-1.5 rounded-lg text-xs font-semibold">
                  <Plus size={14} />
                  항목 추가
                </button>
              </div>
              <div className="px-5 py-4">
                {form.items.length === 0 ? (
                  <button onClick={() => setShowAdd(true)}
                    className="w-full flex flex-col items-center justify-center gap-2 py-10 border-2 border-dashed border-gray-200 rounded-2xl text-gray-400 hover:border-[#2980b9] hover:text-[#2980b9] transition-colors">
                    <Plus size={24} />
                    <span className="text-sm">항목 추가 버튼을 눌러 시작하세요</span>
                  </button>
                ) : (
                  <ul className="space-y-2">
                    {form.items.map((item, idx) => (
                      <li key={idx}>
                        <button onClick={() => setEditIdx(idx)}
                          className="w-full bg-white rounded-2xl border border-gray-100 px-4 py-4 flex items-center gap-3 text-left shadow-sm hover:border-[#2980b9]/30 transition-all">
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
                          </div>
                          <ChevronRight size={16} className="text-gray-300 shrink-0" />
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>

            {/* 합계 */}
            {form.items.length > 0 && (
              <div className="bg-[#1e2a3a] rounded-2xl px-5 py-4 flex items-center justify-between">
                <div>
                  <p className="text-white/60 text-xs">합계</p>
                  <p className="text-white font-bold text-2xl mt-0.5">{total.toLocaleString()}원</p>
                </div>
                <span className="text-white/60 text-xs">{VAT_LABEL[form.vatType]}</span>
              </div>
            )}

            {/* 버튼 */}
            <div className="space-y-2 pb-8">
              <button onClick={() => handleSave('signed')} disabled={saving}
                className={`w-full py-3.5 rounded-xl text-white font-semibold flex items-center justify-center gap-2 disabled:opacity-50 transition-colors ${
                  form.status === 'signed' ? 'bg-[#2980b9]' : 'bg-[#27ae60]'
                }`}>
                {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                {form.status === 'signed' ? '계약 완료' : '계약 확정'}
              </button>
              <button onClick={() => handleSave('draft')} disabled={saving}
                className="w-full py-3.5 rounded-xl bg-gray-100 text-[#4a5568] font-medium text-sm disabled:opacity-50">
                임시저장
              </button>
              {form.status === 'signed' && (
                <button onClick={() => setShowPdfViewer(true)}
                  className="w-full py-3.5 rounded-xl border border-[#e74c3c] text-[#e74c3c] font-medium text-sm flex items-center justify-center gap-2 hover:bg-red-50 transition-colors">
                  <FileDown size={16} />
                  계약서 PDF 미리보기
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {showPdfViewer && (
        <ContractPdfViewerModal
          payload={getPdfPayload()}
          onClose={() => setShowPdfViewer(false)}
        />
      )}
      {showCompany && (
        <CompanyPickerModal selected={form.company}
          onSelect={company => set({ company })}
          onClose={() => setShowCompany(false)} />
      )}
      {showAdd && (
        <ItemModal
          onSave={addItem}
          onUpdate={(idx, data) => updateItem(idx, data)}
          items={form.items}
          onClose={() => setShowAdd(false)}
        />
      )}
      {editIdx !== null && (
        <ItemModal item={form.items[editIdx]}
          onSave={data => updateItem(editIdx, data)}
          onDelete={() => deleteItem(editIdx)}
          onClose={() => setEditIdx(null)} />
      )}
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

export default function NewContractPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center h-64 text-gray-400 text-sm">로딩 중...</div>
    }>
      <ContractPage />
    </Suspense>
  )
}
