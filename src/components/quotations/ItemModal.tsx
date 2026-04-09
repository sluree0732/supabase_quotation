'use client'

import { useState, useEffect } from 'react'
import { X, Sparkles, Loader2 } from 'lucide-react'
import type { QuotationItem } from '@/types'

const CATEGORIES = ['', '기획', '디자인', '개발', '마케팅', '광고', '영상', '운영', '유지보수', '기타']

interface Props {
  item?: QuotationItem | null
  onSave: (item: Omit<QuotationItem, 'id' | 'quotation_id' | 'sort_order'>) => void
  onDelete?: () => void
  onClose: (addedCount?: number, totalCount?: number) => void
  // 신규 추가 모드 전용
  items?: QuotationItem[]
  onAiAllResult?: (notes: string[]) => void
}

export default function ItemModal({ item, onSave, onDelete, onClose, items, onAiAllResult }: Props) {
  const isEdit = !!item
  const [category, setCategory] = useState(item?.category ?? '')
  const [itemName, setItemName] = useState(item?.item_name ?? '')
  const [period, setPeriod] = useState(item?.period ?? 1)
  const [unitPrice, setUnitPrice] = useState(item?.unit_price ?? 0)
  const [note, setNote] = useState(item?.note ?? '')
  const [aiLoading, setAiLoading] = useState(false)
  const [aiAllLoading, setAiAllLoading] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [addedCount, setAddedCount] = useState(0)   // 이번 모달 오픈에서 새로 추가한 수
  const [showList, setShowList] = useState(false)

  const [existingCount] = useState(items?.length ?? 0) // 모달 열 때 한 번만 캡처
  const displayCount = existingCount + addedCount    // 헤더 표시용 전체 수
  const sessionItems = items ?? []                   // 목록 패널 + AI용 전체 항목

  const totalPrice = period * unitPrice

  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [])

  function validate() {
    if (!category) { alert('대분류를 선택해주세요.'); return false }
    if (!itemName.trim()) { alert('상품명을 입력해주세요.'); return false }
    return true
  }

  function resetForm() {
    setCategory('')
    setItemName('')
    setPeriod(1)
    setUnitPrice(0)
    setNote('')
  }

  // [항목 추가] — 저장 후 폼 초기화, 모달 유지
  function handleAddMore() {
    if (!validate()) return
    onSave({ category, item_name: itemName.trim(), period, unit_price: unitPrice, total_price: totalPrice, note })
    resetForm()
    setAddedCount(c => c + 1)
  }

  // [완료] — 폼에 내용 있으면 저장 후 닫기, 없으면 그냥 닫기
  function handleFinish() {
    const hasContent = category || itemName.trim()
    if (hasContent) {
      if (!validate()) return
      onSave({ category, item_name: itemName.trim(), period, unit_price: unitPrice, total_price: totalPrice, note })
      const newCount = addedCount + 1
      onClose(newCount, existingCount + newCount)
    } else {
      onClose(
        addedCount > 0 ? addedCount : undefined,
        addedCount > 0 ? displayCount : undefined,
      )
    }
  }

  // 수정 모드용 (기존 동작 유지)
  function handleSave() {
    if (!validate()) return
    onSave({ category, item_name: itemName.trim(), period, unit_price: unitPrice, total_price: totalPrice, note })
    onClose()
  }

  async function handleAiAll() {
    const currentHasContent = !!(category && itemName.trim())
    const allItems = [
      ...sessionItems.map(it => ({ category: it.category, item_name: it.item_name })),
      ...(currentHasContent ? [{ category, item_name: itemName.trim() }] : []),
    ]
    if (!allItems.length) return

    setAiAllLoading(true)
    try {
      const res = await fetch('/api/gemini', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: allItems }),
      })
      const json = await res.json()
      if (json.notes) {
        // 저장된 항목들 → 부모 콜백으로 업데이트 (index 0부터 매핑)
        const savedNotes = json.notes.slice(0, sessionItems.length)
        if (savedNotes.length > 0) onAiAllResult?.(savedNotes)
        // 현재 폼 항목 → 로컬 state 업데이트
        if (currentHasContent && json.notes[sessionItems.length]) {
          setNote(json.notes[sessionItems.length])
        }
      }
    } catch {
      alert('AI 생성 실패')
    } finally {
      setAiAllLoading(false)
    }
  }

  async function handleAiNote() {
    if (!itemName.trim()) { alert('상품명을 먼저 입력해주세요.'); return }
    setAiLoading(true)
    try {
      const res = await fetch('/api/gemini', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: [{ category, item_name: itemName }] }),
      })
      const json = await res.json()
      if (json.notes?.[0]) setNote(json.notes[0])
    } catch {
      alert('AI 생성 실패')
    } finally {
      setAiLoading(false)
    }
  }

  function formatPrice(v: number) {
    return v ? v.toLocaleString() : ''
  }

  function parsePriceInput(raw: string): number {
    return parseInt(raw.replace(/[^0-9]/g, ''), 10) || 0
  }

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
            <h2 className="font-bold text-[#1e2a3a] text-lg">{isEdit ? '항목 수정' : '항목 추가'}</h2>
            {!isEdit && displayCount > 0 && (
              <button
                onClick={() => setShowList(v => !v)}
                className="text-xs text-[#2980b9] mt-0.5 flex items-center gap-0.5 hover:underline"
              >
                {displayCount}개 추가됨
                <span className="text-[10px]">{showList ? '▲' : '▼'}</span>
              </button>
            )}
          </div>
          <button onClick={() => onClose(addedCount > 0 ? addedCount : undefined, addedCount > 0 ? displayCount : undefined)}>
            <X size={20} className="text-gray-400" />
          </button>
        </div>

        {/* 추가된 항목 목록 패널 */}
        {!isEdit && showList && sessionItems.length > 0 && (
          <div className="border-b border-gray-100 bg-[#f8fafc] px-5 py-3 space-y-2 max-h-40 overflow-y-auto">
            {sessionItems.map((it, i) => (
              <div key={i} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5 min-w-0">
                  {it.category && (
                    <span className="shrink-0 bg-[#ebf5fb] text-[#2980b9] px-1.5 py-0.5 rounded text-[10px] font-medium">
                      {it.category}
                    </span>
                  )}
                  <span className="text-[#1e2a3a] font-medium truncate">{it.item_name}</span>
                </div>
                <span className="shrink-0 text-[#718096] ml-2">{it.total_price.toLocaleString()}원</span>
              </div>
            ))}
          </div>
        )}

        {/* 폼 */}
        <div className="px-5 py-4 space-y-4 flex-1 overflow-y-auto">
          {/* 대분류 */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-[#4a5568]">대분류 *</label>
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.filter(c => c).map(cat => (
                <button
                  key={cat}
                  onClick={() => setCategory(cat)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                    category === cat
                      ? 'bg-[#2980b9] text-white border-[#2980b9]'
                      : 'bg-white text-[#4a5568] border-gray-200 hover:border-[#2980b9]'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* 상품명 */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-[#4a5568]">상품명 *</label>
            <input
              type="text"
              value={itemName}
              onChange={e => setItemName(e.target.value)}
              placeholder="예: 총괄 PM, 랜딩페이지 제작"
              className="input-base"
              autoFocus={!isEdit}
            />
          </div>

          {/* 기간 + 단가 */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-[#4a5568]">기간 (개월)</label>
              <div className="flex items-center border border-gray-200 rounded-xl overflow-hidden">
                <button
                  onClick={() => setPeriod(Math.max(1, period - 1))}
                  className="px-3 py-3 text-gray-500 hover:bg-gray-50 text-lg font-bold"
                >−</button>
                <span className="flex-1 text-center font-semibold text-[#1e2a3a]">{period}</span>
                <button
                  onClick={() => setPeriod(period + 1)}
                  className="px-3 py-3 text-gray-500 hover:bg-gray-50 text-lg font-bold"
                >+</button>
              </div>
            </div>
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
          </div>

          {/* 총액 자동계산 */}
          <div className="bg-[#f0f7fd] rounded-xl px-4 py-3 flex items-center justify-between">
            <span className="text-sm text-[#4a5568]">총액</span>
            <span className="font-bold text-[#1e2a3a] text-lg">
              {totalPrice.toLocaleString()}원
            </span>
          </div>

          {/* 비고 */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-[#4a5568]">비고</label>
              <div className="flex items-center gap-1.5">
                {/* 전체 AI 비고: 세션에 1개 이상 추가됐을 때만 표시 */}
                {!isEdit && displayCount >= 1 && (
                  <button
                    onClick={handleAiAll}
                    disabled={aiAllLoading}
                    className="flex items-center gap-1 text-xs text-[#2980b9] font-medium border border-[#2980b9]/30 rounded-lg px-2.5 py-1.5 bg-[#f0f7fd] hover:bg-[#dbeef8] disabled:opacity-50 transition-colors"
                  >
                    {aiAllLoading ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />}
                    전체 AI 비고
                  </button>
                )}
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
            <textarea
              value={note}
              onChange={e => setNote(e.target.value)}
              placeholder="• 세부 내용 입력&#10;• AI 생성 버튼으로 자동 작성"
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
            /* 수정 모드: 기존 UI 유지 */
            <div className="flex gap-2">
              <button onClick={() => setShowDeleteConfirm(true)} className="py-3 px-4 rounded-xl bg-red-50 text-red-500 font-medium text-sm">삭제</button>
              <button onClick={handleSave} className="flex-1 py-3 rounded-xl bg-[#2980b9] text-white font-semibold text-sm">
                수정 완료
              </button>
            </div>
          ) : (
            /* 신규 추가 모드: [항목 추가] [완료] */
            <div className="flex gap-2">
              <button
                onClick={handleAddMore}
                className="flex-1 py-3 rounded-xl border-2 border-[#2980b9] text-[#2980b9] font-semibold text-sm"
              >
                + 항목 추가
              </button>
              <button
                onClick={handleFinish}
                className="flex-1 py-3 rounded-xl bg-[#2980b9] text-white font-semibold text-sm"
              >
                완료
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
