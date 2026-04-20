'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Plus, FileText, Trash2, X } from 'lucide-react'
import type { Quotation } from '@/types'
import { getAllQuotations, deleteQuotation } from '@/lib/quotations'

const STATUS_LABEL: Record<string, string> = { draft: '임시저장', saved: '저장완료' }
const STATUS_COLOR: Record<string, string> = {
  draft: 'bg-orange-100 text-orange-600',
  saved: 'bg-green-100 text-green-600',
}

export default function QuotationsPage() {
  const [quotations, setQuotations] = useState<Quotation[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<'all' | 'draft' | 'saved'>('all')
  const [selected, setSelected] = useState<Set<string>>(new Set())

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    try { setQuotations(await getAllQuotations()) }
    finally { setLoading(false) }
  }

  const filtered = tab === 'all' ? quotations : quotations.filter(q => q.status === (tab as string))

  const isAllSelected = filtered.length > 0 && filtered.every(q => selected.has(q.id))

  function toggleSelect(id: string) {
    setSelected(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  function toggleSelectAll() {
    if (isAllSelected) {
      setSelected(new Set())
    } else {
      setSelected(new Set(filtered.map(q => q.id)))
    }
  }

  function clearSelection() {
    setSelected(new Set())
  }

  async function handleDelete(q: Quotation, e: React.MouseEvent) {
    e.preventDefault()
    const companyName = (q.companies as any)?.name ?? ''
    const label = companyName ? `${companyName} ` : ''
    if (!confirm(`${label}견적서를 삭제하시겠습니까?`)) return
    await deleteQuotation(q.id)
    setSelected(prev => { const next = new Set(prev); next.delete(q.id); return next })
    await load()
  }

  async function handleBulkDelete() {
    const selectedItems = filtered.filter(q => selected.has(q.id))
    if (selectedItems.length === 0) return

    let message: string
    if (selectedItems.length === 1) {
      const companyName = (selectedItems[0].companies as any)?.name ?? ''
      const label = companyName ? `${companyName} ` : ''
      message = `${label}견적서를 삭제하시겠습니까?`
    } else {
      message = `${selectedItems.length}건의 견적서를 삭제하시겠습니까?`
    }

    if (!confirm(message)) return
    await Promise.all(selectedItems.map(q => deleteQuotation(q.id)))
    setSelected(new Set())
    await load()
  }

  const selectedCount = filtered.filter(q => selected.has(q.id)).length

  return (
    <div className="flex flex-col h-full">
      {/* 헤더 */}
      <div className="bg-white border-b border-gray-100 px-4 py-4 md:px-8">
        {selectedCount > 0 ? (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button onClick={clearSelection} className="p-1 text-gray-400 hover:text-gray-600">
                <X size={18} />
              </button>
              <span className="text-sm font-semibold text-[#1e2a3a]">{selectedCount}건 선택됨</span>
            </div>
            <button
              onClick={handleBulkDelete}
              className="flex items-center gap-1.5 bg-red-500 text-white px-4 py-2.5 rounded-xl text-sm font-semibold shadow-sm active:scale-95 transition-transform"
            >
              <Trash2 size={15} />
              선택 삭제
            </button>
          </div>
        ) : (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl shrink-0" style={{ background: '#27ae6018' }}>📄</div>
              <div>
                <h1 className="text-xl font-bold text-[#1e2a3a]">견적서</h1>
                <p className="text-xs text-[#718096] mt-0.5">총 {quotations.length}건</p>
              </div>
            </div>
            <Link
              href="/quotations/new"
              className="flex items-center gap-1.5 bg-[#2980b9] text-white px-4 py-2.5 rounded-xl text-sm font-semibold shadow-sm active:scale-95 transition-transform"
            >
              <Plus size={16} />
              새 견적서
            </Link>
          </div>
        )}
      </div>

      {/* 탭 */}
      <div className="bg-white border-b border-gray-100 px-4 md:px-8 flex gap-1">
        {(['all', 'draft', 'saved'] as const).map(t => (
          <button
            key={t}
            onClick={() => { setTab(t); setSelected(new Set()) }}
            className={`py-3 px-4 text-sm font-medium border-b-2 transition-colors ${
              tab === t
                ? 'border-[#2980b9] text-[#2980b9]'
                : 'border-transparent text-gray-400 hover:text-gray-600'
            }`}
          >
            {t === 'all' ? '전체' : t === 'draft' ? '임시저장' : '저장완료'}
          </button>
        ))}
      </div>

      {/* 목록 */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center h-40 text-gray-400 text-sm">불러오는 중...</div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 gap-3 text-gray-400">
            <FileText size={32} className="opacity-30" />
            <p className="text-sm">{tab === 'draft' ? '임시저장된 견적서가 없습니다.' : tab === 'saved' ? '저장완료된 견적서가 없습니다.' : '작성된 견적서가 없습니다.'}</p>
            <Link href="/quotations/new" className="text-[#2980b9] text-sm font-medium">
              + 첫 견적서 작성하기
            </Link>
          </div>
        ) : (
          <>
            {/* 전체선택 바 */}
            <div className="flex items-center gap-3 px-4 py-2.5 md:px-8 border-b border-gray-100 bg-gray-50">
              <input
                type="checkbox"
                checked={isAllSelected}
                onChange={toggleSelectAll}
                className="w-4 h-4 rounded accent-[#2980b9] cursor-pointer"
              />
              <span className="text-xs text-gray-500">전체선택</span>
            </div>
            <div className="px-4 py-3 md:px-8 flex flex-col gap-2">
              {filtered.map(q => {
                const companyName = (q.companies as any)?.name ?? '—'
                const total = q.total_amount ?? 0
                const isSelected = selected.has(q.id)
                return (
                  <div key={q.id} className={`bg-white rounded-2xl border shadow-sm flex items-center gap-3 px-4 py-3.5 transition-all ${isSelected ? 'border-[#2980b9] bg-blue-50' : 'border-[#e2e8f0]'}`}>
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleSelect(q.id)}
                      onClick={e => e.stopPropagation()}
                      className="w-4 h-4 rounded accent-[#2980b9] cursor-pointer shrink-0"
                    />
                    <Link href={`/quotations/new?id=${q.id}`} className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-[#eaf4fb] flex items-center justify-center text-lg shrink-0">
                        📄
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-semibold text-[#1e2a3a] text-sm truncate">{companyName}</p>
                          <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium shrink-0 ${STATUS_COLOR[q.status]}`}>
                            {STATUS_LABEL[q.status]}
                          </span>
                        </div>
                        <p className="text-xs text-[#718096] mt-0.5">수신: {q.recipient || '—'}</p>
                        <p className="text-xs text-[#a0aec0]">
                          {q.quote_date} · {total ? `${total.toLocaleString()}원` : '미계산'}
                        </p>
                      </div>
                    </Link>
                    <button
                      onClick={e => handleDelete(q, e)}
                      className="p-2 text-gray-300 hover:text-red-400 shrink-0"
                    >
                      <Trash2 size={16} />
                    </button>
                    <span className="text-[#a0aec0] text-sm shrink-0">›</span>
                  </div>
                )
              })}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
