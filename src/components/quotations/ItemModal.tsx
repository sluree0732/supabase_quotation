'use client'

import { useState, useEffect } from 'react'
import { X, Sparkles, Loader2, Plus, Pencil, Trash2, ChevronDown } from 'lucide-react'
import type { QuotationItem, NoteTemplate } from '@/types'
import { getNoteTemplates } from '@/lib/noteTemplates'
import { getCategories, addCategory as addCategoryToDb, removeCategory as removeCategoryFromDb } from '@/lib/categories'

const DEFAULT_CATEGORIES = ['기획', '디자인', '개발', '마케팅', '광고', '영상', '운영', '유지보수', '기타']
const DEFAULT_SUB_CATEGORIES_MAP: Record<string, string[]> = {
  '기획': ['기획서', 'PM', '전략', '요구사항 분석', '컨설팅'],
  '디자인': ['UI/UX', '브랜딩', '인쇄물', '모션'],
  '개발': ['프론트엔드', '백엔드', '앱', 'API', 'DB'],
  '마케팅': ['SNS', '콘텐츠', '광고', 'SEO'],
  '광고': ['배너', 'GDN', '키워드 광고', 'SNS 광고'],
  '영상': ['촬영', '편집', '모션그래픽', '자막'],
  '운영': ['운영 관리', '고객 대응', '데이터 분석'],
  '유지보수': ['기술 지원', '업데이트', '모니터링'],
  '기타': ['기타'],
}

const LS_CATEGORIES = 'item-categories'
const LS_SUB_CATEGORIES_PREFIX = 'item-sub-categories-'

function loadKeywords(key: string, defaults: string[]): string[] {
  if (typeof window === 'undefined') return defaults
  try {
    const stored = localStorage.getItem(key)
    return stored ? JSON.parse(stored) : defaults
  } catch { return defaults }
}

function saveKeywords(key: string, list: string[]) {
  try { localStorage.setItem(key, JSON.stringify(list)) } catch {}
}

function loadSubCategories(cat: string): string[] {
  if (!cat || typeof window === 'undefined') return DEFAULT_SUB_CATEGORIES_MAP[cat] ?? []
  try {
    const stored = localStorage.getItem(LS_SUB_CATEGORIES_PREFIX + cat)
    return stored ? JSON.parse(stored) : (DEFAULT_SUB_CATEGORIES_MAP[cat] ?? [])
  } catch { return DEFAULT_SUB_CATEGORIES_MAP[cat] ?? [] }
}

function saveSubCategoriesForCat(cat: string, list: string[]) {
  try { localStorage.setItem(LS_SUB_CATEGORIES_PREFIX + cat, JSON.stringify(list)) } catch {}
}

export interface ItemPrefill {
  category?: string
  itemName?: string
  note?: string
}

interface Props {
  item?: QuotationItem | null
  prefill?: ItemPrefill
  onSave: (item: Omit<QuotationItem, 'id' | 'quotation_id' | 'sort_order'>) => void
  onUpdate?: (idx: number, item: Omit<QuotationItem, 'id' | 'quotation_id' | 'sort_order'>) => void
  onDelete?: () => void
  onClose: (addedCount?: number, totalCount?: number) => void
  items?: QuotationItem[]
  onAiAllResult?: (notes: string[]) => void  // 하위 호환성 유지
}

type Draft = { category: string; subCategory: string; itemName: string; unitPrice: number; note: string }

export default function ItemModal({ item, prefill, onSave, onUpdate, onDelete, onClose, items, onAiAllResult }: Props) {
  const isEdit = !!item

  // ── 폼 상태 ─────────────────────────────────────────────
  const [category, setCategory] = useState(item?.category ?? prefill?.category ?? '')
  const [subCategory, setSubCategory] = useState(item?.sub_category ?? '')
  const [itemName, setItemName] = useState(item?.item_name ?? prefill?.itemName ?? '')
  const [unitPrice, setUnitPrice] = useState(item?.unit_price ?? 0)
  const [note, setNote] = useState(item?.note ?? prefill?.note ?? '')

  // ── 키워드 관리 ─────────────────────────────────────────
  const [categories, setCategories] = useState<string[]>(DEFAULT_CATEGORIES)
  const [subCategoriesMap, setSubCategoriesMap] = useState<Record<string, string[]>>({})
  const [newCatInput, setNewCatInput] = useState('')
  const [newSubCatInput, setNewSubCatInput] = useState('')

  // 대분류 목록 Supabase에서 로드 (실패 시 localStorage 폴백)
  useEffect(() => {
    getCategories()
      .then(setCategories)
      .catch(() => setCategories(loadKeywords(LS_CATEGORIES, DEFAULT_CATEGORIES)))
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // 대분류가 선택되면 해당 대분류의 상세 분류를 map에 로드
  useEffect(() => {
    if (!category) return
    if (subCategoriesMap[category] !== undefined) return
    setSubCategoriesMap(prev => ({ ...prev, [category]: loadSubCategories(category) }))
  }, [category]) // eslint-disable-line react-hooks/exhaustive-deps

  const currentSubCategories = category ? (subCategoriesMap[category] ?? []) : []

  // ── 비고 템플릿 ─────────────────────────────────────────
  const [showTemplatePanel, setShowTemplatePanel] = useState(false)
  const [templateList, setTemplateList] = useState<NoteTemplate[]>([])
  const [templatesLoading, setTemplatesLoading] = useState(false)

  async function openTemplatePanel() {
    setShowTemplatePanel(v => !v)
    if (templateList.length > 0) return
    setTemplatesLoading(true)
    try {
      setTemplateList(await getNoteTemplates())
    } catch {
      alert('템플릿 불러오기 실패')
    } finally {
      setTemplatesLoading(false)
    }
  }

  const filteredTemplates = category
    ? templateList.filter(t => t.category === category)
    : templateList

  // ── AI 검증 에러 ────────────────────────────────────────
  const [aiErrors, setAiErrors] = useState<string[]>([])

  // ── 항목 목록 / 네비게이션 ──────────────────────────────
  const [aiLoading, setAiLoading] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [addedCount, setAddedCount] = useState(0)
  const [showList, setShowList] = useState(false)
  const [editingIdx, setEditingIdx] = useState<number | null>(null)  // 목록 항목 편집 중 인덱스
  const [draft, setDraft] = useState<Draft | null>(null)             // 새 항목 작성 draft

  const [existingCount] = useState(items?.length ?? 0)
  const displayCount = existingCount + addedCount
  const sessionItems = items ?? []
  const totalPrice = unitPrice

  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [])

  // ── 키워드 추가/삭제 ─────────────────────────────────────
  async function addCategory() {
    const v = newCatInput.trim()
    if (!v || categories.includes(v)) return
    const next = [...categories, v]
    setCategories(next)  // 낙관적 업데이트
    setNewCatInput('')
    try {
      await addCategoryToDb(v, next.length)
    } catch {
      setCategories(categories)  // 실패 시 롤백
    }
  }

  async function removeCategory(cat: string) {
    const next = categories.filter(c => c !== cat)
    setCategories(next)  // 낙관적 업데이트
    if (category === cat) setCategory('')
    try {
      await removeCategoryFromDb(cat)
    } catch {
      setCategories(categories)  // 실패 시 롤백
    }
  }

  function addSubCategory() {
    if (!category) return
    const v = newSubCatInput.trim()
    if (!v || currentSubCategories.includes(v)) return
    const next = [...currentSubCategories, v]
    setSubCategoriesMap(prev => ({ ...prev, [category]: next }))
    saveSubCategoriesForCat(category, next)
    setNewSubCatInput('')
  }

  function removeSubCategory(sub: string) {
    if (!category) return
    const next = currentSubCategories.filter(s => s !== sub)
    setSubCategoriesMap(prev => ({ ...prev, [category]: next }))
    saveSubCategoriesForCat(category, next)
    if (subCategory === sub) setSubCategory('')
  }

  // ── 이전 항목 편집 네비게이션 ────────────────────────────
  function enterEditItem(idx: number) {
    // 현재 작성 중인 내용을 draft로 저장
    setDraft({ category, subCategory, itemName, unitPrice, note })
    // 해당 항목 데이터 로드
    const it = sessionItems[idx]
    setCategory(it.category)
    setSubCategory(it.sub_category ?? '')
    setItemName(it.item_name)
    setUnitPrice(it.unit_price)
    setNote(it.note)
    setEditingIdx(idx)
    setShowList(false)
  }

  function exitEditItem() {
    // draft 복원
    if (draft) {
      setCategory(draft.category)
      setSubCategory(draft.subCategory)
      setItemName(draft.itemName)
      setUnitPrice(draft.unitPrice)
      setNote(draft.note)
    }
    setEditingIdx(null)
    setDraft(null)
  }

  function handleUpdateItem() {
    if (!category) { alert('대분류를 선택해주세요.'); return }
    if (!itemName.trim()) { alert('상품명을 입력해주세요.'); return }
    onUpdate?.(editingIdx!, {
      category, sub_category: subCategory, item_name: itemName.trim(),
      period: 1, unit_price: unitPrice, total_price: unitPrice, note,
    })
    exitEditItem()
  }

  // ── 폼 검증 / 저장 ──────────────────────────────────────
  function validate() {
    if (!category) { alert('대분류를 선택해주세요.'); return false }
    if (!itemName.trim()) { alert('상품명을 입력해주세요.'); return false }
    return true
  }

  function resetForm() {
    setCategory(''); setSubCategory(''); setItemName(''); setUnitPrice(0); setNote('')
  }

  function handleAddMore() {
    if (!validate()) return
    onSave({ category, sub_category: subCategory, item_name: itemName.trim(), period: 1, unit_price: unitPrice, total_price: totalPrice, note })
    resetForm()
    setAddedCount(c => c + 1)
  }

  function handleFinish() {
    const hasContent = category || itemName.trim()
    if (hasContent) {
      if (!validate()) return
      onSave({ category, sub_category: subCategory, item_name: itemName.trim(), period: 1, unit_price: unitPrice, total_price: totalPrice, note })
      const newCount = addedCount + 1
      onClose(newCount, existingCount + newCount)
    } else {
      onClose(addedCount > 0 ? addedCount : undefined, addedCount > 0 ? displayCount : undefined)
    }
  }

  function handleSave() {
    if (!validate()) return
    onSave({ category, sub_category: subCategory, item_name: itemName.trim(), period: 1, unit_price: unitPrice, total_price: totalPrice, note })
    onClose()
  }

  async function handleAiNote() {
    const missing: string[] = []
    if (!category) missing.push('대분류')
    if (!subCategory) missing.push('상세분류')
    if (!itemName.trim()) missing.push('상품명')
    if (missing.length > 0) { setAiErrors(missing); return }
    setAiErrors([])
    setAiLoading(true)
    try {
      const res = await fetch('/api/gemini', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ items: [{ category, sub_category: subCategory, item_name: itemName }] }) })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? 'AI 생성 실패')
      if (json.notes?.[0]) { setNote(json.notes[0]); setShowTemplatePanel(false) }
    } catch (e: any) { alert(e.message ?? 'AI 생성 실패') }
    finally { setAiLoading(false) }
  }

  function formatPrice(v: number) { return v ? v.toLocaleString() : '' }
  function parsePriceInput(raw: string): number { return parseInt(raw.replace(/[^0-9]/g, ''), 10) || 0 }

  const isEditingExisting = editingIdx !== null

  return (
    <div className="fixed inset-0 z-[60] flex items-end md:items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={() => onClose()} />
      <div
        className="relative z-10 w-full md:w-[500px] bg-white rounded-t-2xl md:rounded-2xl shadow-xl flex flex-col max-h-[calc(100dvh-3.5rem)] md:max-h-[85vh]"
        onTouchMove={e => e.stopPropagation()}
      >
        {/* 핸들 */}
        <div className="md:hidden flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 bg-gray-300 rounded-full" />
        </div>

        {/* 헤더 */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div>
            <h2 className="font-bold text-[#1e2a3a] text-lg">
              {isEdit ? '항목 수정' : isEditingExisting ? `${editingIdx! + 1}번째 항목 수정 중` : '항목 추가'}
            </h2>
            {!isEdit && !isEditingExisting && displayCount > 0 && (
              <button
                onClick={() => setShowList(v => !v)}
                className="text-xs text-[#2980b9] mt-0.5 flex items-center gap-0.5 hover:underline"
              >
                {displayCount}개 추가됨
                <span className="text-[10px]">{showList ? '▲' : '▼'}</span>
              </button>
            )}
            {isEditingExisting && (
              <button onClick={exitEditItem} className="text-xs text-[#718096] mt-0.5 hover:underline">
                ← 새 항목 작성으로 돌아가기
              </button>
            )}
          </div>
          <button onClick={() => onClose(addedCount > 0 ? addedCount : undefined, addedCount > 0 ? displayCount : undefined)}>
            <X size={20} className="text-gray-400" />
          </button>
        </div>

        {/* 추가된 항목 목록 패널 */}
        {!isEdit && !isEditingExisting && showList && sessionItems.length > 0 && (
          <div className="border-b border-gray-100 bg-[#f8fafc] px-5 py-3 space-y-1 max-h-40 overflow-y-auto">
            {sessionItems.map((it, i) => (
              <button
                key={i}
                onClick={() => enterEditItem(i)}
                className="w-full flex items-center justify-between text-xs py-1.5 px-2 rounded-lg hover:bg-[#ebf5fb] transition-colors text-left"
              >
                <div className="flex items-center gap-1.5 min-w-0">
                  {it.category && (
                    <span className="shrink-0 bg-[#ebf5fb] text-[#2980b9] px-1.5 py-0.5 rounded text-[10px] font-medium">
                      {it.category}
                    </span>
                  )}
                  {it.sub_category && (
                    <span className="shrink-0 bg-[#f0f9f4] text-[#27ae60] px-1.5 py-0.5 rounded text-[10px] font-medium">
                      {it.sub_category}
                    </span>
                  )}
                  <span className="text-[#1e2a3a] font-medium truncate">{it.item_name}</span>
                </div>
                <div className="flex items-center gap-2 shrink-0 ml-2">
                  <span className="text-[#718096]">{it.total_price.toLocaleString()}원</span>
                  <Pencil size={11} className="text-[#2980b9]" />
                </div>
              </button>
            ))}
          </div>
        )}

        {/* 폼 */}
        <div className="px-5 py-4 space-y-4 flex-1 overflow-y-auto">

          {/* 대분류 */}
          <div className={`space-y-1.5 rounded-xl transition-colors ${aiErrors.includes('대분류') ? 'outline outline-2 outline-red-400 p-2 -mx-2' : ''}`}>
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-[#4a5568]">대분류 *</label>
              {category && (
                <button
                  onClick={() => removeCategory(category)}
                  className="flex items-center gap-1 text-xs px-2 py-1 rounded-lg border border-red-200 text-red-500 bg-red-50 hover:bg-red-100 transition-colors"
                >
                  <Trash2 size={11} /> 삭제
                </button>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              {categories.map(cat => (
                <button
                  key={cat}
                  onClick={() => {
                    const next = cat === category ? '' : cat
                    setCategory(next)
                    setSubCategory('')
                    setAiErrors(prev => prev.filter(f => f !== '대분류'))
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                    category === cat
                      ? 'bg-[#2980b9] text-white border-[#2980b9]'
                      : 'bg-white text-[#4a5568] border-gray-200 hover:border-[#2980b9]'
                  }`}
                >
                  {cat}
                </button>
              ))}
              <div className="flex items-center gap-1">
                <input
                  type="text"
                  value={newCatInput}
                  onChange={e => setNewCatInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && addCategory()}
                  placeholder="새 키워드"
                  className="w-20 px-2 py-1.5 border border-gray-200 rounded-lg text-xs focus:outline-none focus:border-[#2980b9]"
                />
                <button onClick={addCategory} className="p-1.5 bg-[#2980b9] text-white rounded-lg">
                  <Plus size={12} />
                </button>
              </div>
            </div>
          </div>

          {/* 상세 분류 */}
          <div className={`space-y-1.5 rounded-xl transition-colors ${!category ? 'opacity-40 pointer-events-none' : ''} ${aiErrors.includes('상세분류') ? 'outline outline-2 outline-red-400 p-2 -mx-2' : ''}`}>
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-[#4a5568]">
                상세 분류
                {!category && <span className="ml-1.5 text-xs font-normal text-[#a0aec0]">(대분류를 먼저 선택하세요)</span>}
              </label>
              {subCategory && (
                <button
                  onClick={() => removeSubCategory(subCategory)}
                  className="flex items-center gap-1 text-xs px-2 py-1 rounded-lg border border-red-200 text-red-500 bg-red-50 hover:bg-red-100 transition-colors"
                >
                  <Trash2 size={11} /> 삭제
                </button>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              {currentSubCategories.map(sub => (
                <button
                  key={sub}
                  onClick={() => { setSubCategory(sub === subCategory ? '' : sub); setAiErrors(prev => prev.filter(f => f !== '상세분류')) }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                    subCategory === sub
                      ? 'bg-[#27ae60] text-white border-[#27ae60]'
                      : 'bg-white text-[#4a5568] border-gray-200 hover:border-[#27ae60]'
                  }`}
                >
                  {sub}
                </button>
              ))}
              <div className="flex items-center gap-1">
                <input
                  type="text"
                  value={newSubCatInput}
                  onChange={e => setNewSubCatInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && addSubCategory()}
                  placeholder="새 키워드"
                  className="w-20 px-2 py-1.5 border border-gray-200 rounded-lg text-xs focus:outline-none focus:border-[#27ae60]"
                />
                <button onClick={addSubCategory} className="p-1.5 bg-[#27ae60] text-white rounded-lg">
                  <Plus size={12} />
                </button>
              </div>
            </div>
          </div>

          {/* 상품명 */}
          <div className={`space-y-1.5 rounded-xl transition-colors ${aiErrors.includes('상품명') ? 'outline outline-2 outline-red-400 p-2 -mx-2' : ''}`}>
            <label className="text-sm font-medium text-[#4a5568]">상품명 *</label>
            <input
              type="text"
              value={itemName}
              onChange={e => { setItemName(e.target.value); setAiErrors(prev => prev.filter(f => f !== '상품명')) }}
              placeholder="예: 총괄 PM, 랜딩페이지 제작"
              className="input-base"
              autoFocus={!isEdit}
            />
          </div>

          {/* 단가 */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-[#4a5568]">단가 (원)</label>
            <input
              type="text"
              inputMode="numeric"
              value={formatPrice(unitPrice)}
              onChange={e => setUnitPrice(parsePriceInput(e.target.value))}
              placeholder="0"
              className="input-base text-right"
            />
          </div>

          {/* 총액 */}
          <div className="bg-[#f0f7fd] rounded-xl px-4 py-3 flex items-center justify-between">
            <span className="text-sm text-[#4a5568]">총액</span>
            <span className="font-bold text-[#1e2a3a] text-lg">{totalPrice.toLocaleString()}원</span>
          </div>

          {/* 비고 */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-[#4a5568]">비고</label>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={openTemplatePanel}
                  className={`flex items-center gap-1 text-xs font-medium border rounded-lg px-2.5 py-1.5 transition-colors ${
                    showTemplatePanel
                      ? 'bg-[#27ae60] text-white border-[#27ae60]'
                      : 'text-[#27ae60] border-[#27ae60]/30 bg-[#f0faf5] hover:bg-[#d5f0e3]'
                  }`}
                >
                  {templatesLoading ? <Loader2 size={12} className="animate-spin" /> : <ChevronDown size={12} className={showTemplatePanel ? 'rotate-180 transition-transform' : 'transition-transform'} />}
                  불러오기
                </button>
                <button
                  onClick={handleAiNote}
                  disabled={aiLoading}
                  className="flex items-center gap-1.5 text-xs text-[#8e44ad] font-medium border border-[#8e44ad]/30 rounded-lg px-2.5 py-1.5 bg-[#f9f0ff] hover:bg-[#f3e5ff] disabled:opacity-50 transition-colors"
                >
                  {aiLoading ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />}
                  AI 생성
                </button>
              </div>
            </div>

            {/* AI 검증 에러 메시지 */}
            {aiErrors.length > 0 && (
              <p className="text-xs text-red-500 bg-red-50 rounded-lg px-3 py-2">
                {aiErrors.join(', ')}을(를) 설정해주세요.
              </p>
            )}

            {/* 템플릿 선택 패널 */}
            {showTemplatePanel && (
              <div className="border border-[#27ae60]/30 rounded-xl bg-white shadow-sm overflow-hidden">
                {templatesLoading ? (
                  <div className="flex items-center justify-center py-4 text-xs text-[#718096]">
                    <Loader2 size={14} className="animate-spin mr-1.5" /> 불러오는 중...
                  </div>
                ) : filteredTemplates.length === 0 ? (
                  <div className="py-4 text-center text-xs text-[#718096]">
                    {category ? `'${category}' 대분류의 템플릿이 없습니다.` : '등록된 템플릿이 없습니다.'}
                    <span className="block mt-0.5 text-[#a0aec0]">비고 등록 메뉴에서 추가하세요.</span>
                  </div>
                ) : (
                  <div className="max-h-48 overflow-y-auto divide-y divide-gray-50">
                    {filteredTemplates.map(t => (
                      <button
                        key={t.id}
                        onClick={() => { setNote(t.content); setShowTemplatePanel(false) }}
                        className="w-full text-left px-3.5 py-2.5 hover:bg-[#f0faf5] transition-colors"
                      >
                        <div className="flex items-center gap-1.5 mb-0.5">
                          <span className="text-[10px] bg-[#ebf5fb] text-[#2980b9] px-1.5 py-0.5 rounded-full font-medium">
                            {t.category}
                          </span>
                          <span className="text-xs font-semibold text-[#1e2a3a]">{t.title}</span>
                        </div>
                        <p className="text-[11px] text-[#718096] line-clamp-2 leading-relaxed">{t.content}</p>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            <textarea
              value={note}
              onChange={e => setNote(e.target.value)}
              placeholder="• 세부 내용 입력&#10;• 불러오기 또는 AI 생성 버튼으로 자동 작성"
              rows={4}
              className="input-base resize-none"
            />
          </div>
        </div>

        {/* 버튼 */}
        <div className="px-5 py-4 border-t border-gray-100 space-y-2 shrink-0">
          {showDeleteConfirm ? (
            <div className="bg-red-50 rounded-xl p-3 space-y-2">
              <p className="text-sm text-red-700 font-medium">이 항목을 삭제하시겠습니까?</p>
              <div className="flex gap-2">
                <button onClick={() => setShowDeleteConfirm(false)} className="flex-1 py-2 rounded-lg bg-gray-100 text-gray-700 text-sm">취소</button>
                <button onClick={() => { onDelete?.(); onClose() }} className="flex-1 py-2 rounded-lg bg-red-500 text-white text-sm font-medium">삭제</button>
              </div>
            </div>
          ) : isEdit ? (
            <div className="flex gap-2">
              <button onClick={() => setShowDeleteConfirm(true)} className="py-3 px-4 rounded-xl bg-red-50 text-red-500 font-medium text-sm">삭제</button>
              <button onClick={handleSave} className="flex-1 py-3 rounded-xl bg-[#2980b9] text-white font-semibold text-sm">수정 완료</button>
            </div>
          ) : isEditingExisting ? (
            <div className="flex gap-2">
              <button onClick={exitEditItem} className="flex-1 py-3 rounded-xl border border-gray-200 text-[#4a5568] font-medium text-sm">취소</button>
              <button onClick={handleUpdateItem} className="flex-1 py-3 rounded-xl bg-[#27ae60] text-white font-semibold text-sm">수정 완료</button>
            </div>
          ) : (
            <div className="flex gap-2">
              <button onClick={handleAddMore} className="flex-1 py-3 rounded-xl border-2 border-[#2980b9] text-[#2980b9] font-semibold text-sm">+ 항목 추가</button>
              <button onClick={handleFinish} className="flex-1 py-3 rounded-xl bg-[#2980b9] text-white font-semibold text-sm">완료</button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
