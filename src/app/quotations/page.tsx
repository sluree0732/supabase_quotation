'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Plus, FileText, ChevronRight, Trash2 } from 'lucide-react'
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
  const [tab, setTab] = useState<'all' | 'draft'>('all')

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    try { setQuotations(await getAllQuotations()) }
    finally { setLoading(false) }
  }

  const filtered = tab === 'all' ? quotations : quotations.filter(q => q.status === tab)

  async function handleDelete(id: string, e: React.MouseEvent) {
    e.preventDefault()
    if (!confirm('견적서를 삭제하시겠습니까?')) return
    await deleteQuotation(id)
    await load()
  }

  return (
    <div className="flex flex-col h-full">
      {/* 헤더 */}
      <div className="bg-white border-b border-gray-100 px-4 py-4 md:px-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-[#1e2a3a]">견적서</h1>
            <p className="text-xs text-[#718096] mt-0.5">총 {quotations.length}건</p>
          </div>
          <Link
            href="/quotations/new"
            className="flex items-center gap-1.5 bg-[#2980b9] text-white px-4 py-2.5 rounded-xl text-sm font-semibold shadow-sm active:scale-95 transition-transform"
          >
            <Plus size={16} />
            새 견적서
          </Link>
        </div>
      </div>

      {/* 탭 */}
      <div className="bg-white border-b border-gray-100 px-4 md:px-8 flex gap-1">
        {(['all', 'draft'] as const).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`py-3 px-4 text-sm font-medium border-b-2 transition-colors ${
              tab === t
                ? 'border-[#2980b9] text-[#2980b9]'
                : 'border-transparent text-gray-400 hover:text-gray-600'
            }`}
          >
            {t === 'all' ? '전체' : '임시저장'}
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
            <p className="text-sm">{tab === 'draft' ? '임시저장된 견적서가 없습니다.' : '작성된 견적서가 없습니다.'}</p>
            <Link href="/quotations/new" className="text-[#2980b9] text-sm font-medium">
              + 첫 견적서 작성하기
            </Link>
          </div>
        ) : (
          <ul className="divide-y divide-gray-100">
            {filtered.map(q => {
              const companyName = (q.companies as any)?.name ?? '—'
              const total = q.total_amount ?? 0
              return (
                <li key={q.id}>
                  <Link href={`/quotations/new?id=${q.id}`} className="flex items-center gap-3 px-4 py-4 active:bg-gray-50 md:px-8">
                    <div className="w-10 h-10 rounded-xl bg-[#eaf4fb] flex items-center justify-center shrink-0">
                      <FileText size={18} className="text-[#2980b9]" />
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
                    <button
                      onClick={e => handleDelete(q.id, e)}
                      className="p-2 text-gray-300 hover:text-red-400 shrink-0"
                    >
                      <Trash2 size={16} />
                    </button>
                    <ChevronRight size={16} className="text-gray-300 shrink-0" />
                  </Link>
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </div>
  )
}
