'use client'

import { useState, useEffect } from 'react'
import { X, Sparkles, Loader2 } from 'lucide-react'
import type { QuotationItem } from '@/types'

const CATEGORIES = ['', '기획', '디자인', '개발', '마케팅', '광고', '영상', '운영', '유지보수', '기타']

interface Props {
  item?: QuotationItem | null
  onSave: (item: Omit<QuotationItem, 'id' | 'quotation_id' | 'sort_order'>) => void
  onDelete?: () => void
  onClose: () => void
}

export default function ItemModal({ item, onSave, onDelete, onClose }: Props) {
  const isEdit = !!item
  const [category, setCategory] = useState(item?.category ?? '')
  const [itemName, setItemName] = useState(item?.item_name ?? '')
  const [period, setPeriod] = useState(item?.period ?? 1)
  const [unitPrice, setUnitPrice] = useState(item?.unit_price ?? 0)
  const [note, setNote] = useState(item?.note ?? '')
  const [aiLoading, setAiLoading] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  const totalPrice = period * unitPrice

  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [])

  function handleSave() {
    if (!itemName.trim()) { alert('상품명을 입력해주세요.'); return }
    onSave({ category, item_name: itemName.trim(), period, unit_price: unitPrice, total_price: totalPrice, note })
    onClose()
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
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
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
          <h2 className="font-bold text-[#1e2a3a] text-lg">{isEdit ? '항목 수정' : '항목 추가'}</h2>
          <button onClick={onClose}><X size={20} className="text-gray-400" /></button>
        </div>

        {/* 폼 */}
        <div className="px-5 py-4 space-y-4 flex-1 overflow-y-auto">
          {/* 대분류 */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-[#4a5568]">대분류</label>
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
              <button
                onClick={handleAiNote}
                disabled={aiLoading}
                className="flex items-center gap-1.5 text-xs text-[#8e44ad] font-medium border border-[#8e44ad]/30 rounded-lg px-2.5 py-1.5 bg-[#f9f0ff] hover:bg-[#f3e5ff] disabled:opacity-50 transition-colors"
              >
                {aiLoading ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />}
                AI 생성
              </button>
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
          ) : (
            <div className="flex gap-2">
              {isEdit && (
                <button onClick={() => setShowDeleteConfirm(true)} className="py-3 px-4 rounded-xl bg-red-50 text-red-500 font-medium text-sm">삭제</button>
              )}
              <button onClick={handleSave} className="flex-1 py-3 rounded-xl bg-[#2980b9] text-white font-semibold text-sm">
                {isEdit ? '수정 완료' : '추가'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
