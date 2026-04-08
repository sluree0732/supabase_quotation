'use client'

import { useState } from 'react'
import { Plus, Sparkles, Loader2, GripVertical, ChevronRight } from 'lucide-react'
import type { QuotationItem } from '@/types'
import ItemModal from './ItemModal'

interface Props {
  items: QuotationItem[]
  onChange: (items: QuotationItem[]) => void
  onNext: () => void
  onBack: () => void
}

export default function Step2Items({ items, onChange, onNext, onBack }: Props) {
  const [editIdx, setEditIdx] = useState<number | null>(null)
  const [showAdd, setShowAdd] = useState(false)
  const [aiAllLoading, setAiAllLoading] = useState(false)

  const total = items.reduce((s, i) => s + i.total_price, 0)

  function addItem(data: Omit<QuotationItem, 'id' | 'quotation_id' | 'sort_order'>) {
    onChange([...items, { ...data, sort_order: items.length }])
  }

  function updateItem(idx: number, data: Omit<QuotationItem, 'id' | 'quotation_id' | 'sort_order'>) {
    onChange(items.map((it, i) => i === idx ? { ...it, ...data } : it))
  }

  function deleteItem(idx: number) {
    onChange(items.filter((_, i) => i !== idx).map((it, i) => ({ ...it, sort_order: i })))
  }

  async function handleAiAll() {
    if (!items.length) { alert('항목을 먼저 추가해주세요.'); return }
    setAiAllLoading(true)
    try {
      const res = await fetch('/api/gemini', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: items.map(i => ({ category: i.category, item_name: i.item_name })) }),
      })
      const json = await res.json()
      if (json.notes) {
        onChange(items.map((it, i) => ({ ...it, note: json.notes[i] ?? it.note })))
      }
    } catch {
      alert('AI 생성 실패')
    } finally {
      setAiAllLoading(false)
    }
  }

  return (
    <div className="flex flex-col gap-4 px-4 py-5 md:px-8">
      {/* 툴바 */}
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-[#4a5568]">
          항목 <span className="text-[#2980b9] font-bold">{items.length}</span>개
          {total > 0 && <span className="ml-2 text-[#1e2a3a] font-semibold">· {total.toLocaleString()}원</span>}
        </p>
        <div className="flex items-center gap-2">
          <button
            onClick={handleAiAll}
            disabled={aiAllLoading || !items.length}
            className="flex items-center gap-1.5 text-xs text-[#8e44ad] font-medium disabled:opacity-40 border border-[#8e44ad]/30 rounded-lg px-2.5 py-1.5"
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
      </div>

      {/* 항목 목록 */}
      {items.length === 0 ? (
        <button
          onClick={() => setShowAdd(true)}
          className="flex flex-col items-center justify-center gap-3 py-12 border-2 border-dashed border-gray-200 rounded-2xl text-gray-400 hover:border-[#2980b9] hover:text-[#2980b9] transition-colors"
        >
          <Plus size={28} />
          <span className="text-sm">항목 추가 버튼을 눌러 시작하세요</span>
        </button>
      ) : (
        <ul className="space-y-2">
          {items.map((item, idx) => (
            <li key={idx}>
              <button
                onClick={() => setEditIdx(idx)}
                className="w-full bg-white rounded-2xl border border-gray-100 px-4 py-4 flex items-center gap-3 text-left shadow-sm active:scale-[0.99] transition-transform hover:border-[#2980b9]/30"
              >
                <GripVertical size={16} className="text-gray-300 shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    {item.category && (
                      <span className="text-[10px] bg-[#ebf5fb] text-[#2980b9] px-2 py-0.5 rounded-full font-medium">
                        {item.category}
                      </span>
                    )}
                    <span className="font-semibold text-sm text-[#1e2a3a] truncate">{item.item_name}</span>
                  </div>
                  <div className="flex items-center gap-3 mt-1 text-xs text-[#718096]">
                    <span>{item.period}개월 × {item.unit_price.toLocaleString()}원</span>
                    <span className="font-semibold text-[#1e2a3a]">= {item.total_price.toLocaleString()}원</span>
                  </div>
                  {item.note && (
                    <p className="text-xs text-[#a0aec0] mt-1 truncate">{item.note.replace(/•/g, '·')}</p>
                  )}
                </div>
                <ChevronRight size={16} className="text-gray-300 shrink-0" />
              </button>
            </li>
          ))}
        </ul>
      )}

      {/* 네비게이션 버튼 */}
      <div className="flex gap-3 mt-2">
        <button
          onClick={onBack}
          className="flex-1 py-3.5 rounded-xl border border-gray-200 text-[#4a5568] font-medium text-sm"
        >
          ← 이전
        </button>
        <button
          onClick={onNext}
          disabled={items.length === 0}
          className="flex-1 py-3.5 rounded-xl bg-[#2980b9] text-white font-semibold text-sm disabled:opacity-40"
        >
          다음 — 확인 및 저장
        </button>
      </div>

      {/* 모달 */}
      {showAdd && (
        <ItemModal
          onSave={addItem}
          onClose={() => setShowAdd(false)}
        />
      )}
      {editIdx !== null && (
        <ItemModal
          item={items[editIdx]}
          onSave={data => updateItem(editIdx, data)}
          onDelete={() => deleteItem(editIdx)}
          onClose={() => setEditIdx(null)}
        />
      )}
    </div>
  )
}
