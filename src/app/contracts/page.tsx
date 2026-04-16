'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Plus, FileSignature, ChevronRight, Trash2, X } from 'lucide-react'
import type { Contract, ContractStatus } from '@/types'
import { getContracts, deleteContract } from '@/lib/contracts'

const STATUS_LABEL: Record<ContractStatus, string> = {
  draft: '임시저장',
  signed: '계약완료',
}

const STATUS_COLOR: Record<ContractStatus, string> = {
  draft: 'bg-orange-100 text-orange-600',
  signed: 'bg-green-100 text-green-700',
}

export default function ContractsPage() {
  const router = useRouter()
  const [contracts, setContracts] = useState<Contract[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<'all' | 'draft' | 'signed'>('all')
  const [selected, setSelected] = useState<Set<string>>(new Set())

  useEffect(() => {
    fetchContracts()
  }, [])

  async function fetchContracts() {
    setLoading(true)
    try {
      const data = await getContracts()
      setContracts(data)
    } catch (e) {
      console.error('계약서 목록 조회 실패:', e)
    } finally {
      setLoading(false)
    }
  }

  const filtered = contracts.filter(c => tab === 'all' || c.status === tab)

  const isAllSelected = filtered.length > 0 && filtered.every(c => selected.has(c.id))

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
      setSelected(new Set(filtered.map(c => c.id)))
    }
  }

  function clearSelection() {
    setSelected(new Set())
  }

  async function handleDelete(e: React.MouseEvent, contract: Contract) {
    e.stopPropagation()
    const companyName = contract.companies?.name ?? ''
    const label = companyName ? `${companyName} ` : ''
    if (!confirm(`${label}계약서를 삭제하시겠습니까?`)) return
    await deleteContract(contract.id)
    setSelected(prev => { const next = new Set(prev); next.delete(contract.id); return next })
    setContracts(prev => prev.filter(c => c.id !== contract.id))
  }

  async function handleBulkDelete() {
    const selectedItems = filtered.filter(c => selected.has(c.id))
    if (selectedItems.length === 0) return

    let message: string
    if (selectedItems.length === 1) {
      const companyName = selectedItems[0].companies?.name ?? ''
      const label = companyName ? `${companyName} ` : ''
      message = `${label}계약서를 삭제하시겠습니까?`
    } else {
      message = `${selectedItems.length}건의 계약서를 삭제하시겠습니까?`
    }

    if (!confirm(message)) return
    await Promise.all(selectedItems.map(c => deleteContract(c.id)))
    const deletedIds = new Set(selectedItems.map(c => c.id))
    setContracts(prev => prev.filter(c => !deletedIds.has(c.id)))
    setSelected(new Set())
  }

  const selectedCount = filtered.filter(c => selected.has(c.id)).length

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
            <div>
              <h1 className="text-xl font-bold text-[#1e2a3a]">계약서</h1>
              <p className="text-sm text-gray-400 mt-0.5">총 {contracts.length}건</p>
            </div>
            <Link
              href="/contracts/new"
              className="flex items-center gap-1.5 bg-[#2980b9] text-white px-4 py-2.5 rounded-xl text-sm font-semibold"
            >
              <Plus size={16} />
              새 계약서
            </Link>
          </div>
        )}
      </div>

      {/* 탭 */}
      <div className="bg-white border-b border-gray-100 px-4 md:px-8 flex gap-1">
        {(['all', 'draft', 'signed'] as const).map(t => (
          <button
            key={t}
            onClick={() => { setTab(t); setSelected(new Set()) }}
            className={`py-3 px-4 text-sm font-medium border-b-2 transition-colors ${
              tab === t
                ? 'border-[#2980b9] text-[#2980b9]'
                : 'border-transparent text-gray-400 hover:text-gray-600'
            }`}
          >
            {t === 'all' ? '전체' : t === 'draft' ? '임시저장' : '계약완료'}
          </button>
        ))}
      </div>

      {/* 목록 */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center h-40 text-gray-400 text-sm">불러오는 중...</div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 gap-3 text-gray-400">
            <FileSignature size={36} className="text-gray-300" />
            <p className="text-sm">계약서가 없습니다.</p>
            <Link
              href="/contracts/new"
              className="text-sm text-[#2980b9] font-medium"
            >
              새 계약서 작성 →
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
            <ul className="space-y-2 px-4 py-4 md:px-8">
              {filtered.map(contract => {
                const isSelected = selected.has(contract.id)
                return (
                  <li key={contract.id}>
                    <div className={`bg-white rounded-2xl border px-4 py-4 flex items-center gap-3 shadow-sm transition-all ${isSelected ? 'border-[#2980b9]/40 bg-blue-50' : 'border-gray-100'}`}>
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleSelect(contract.id)}
                        className="w-4 h-4 rounded accent-[#2980b9] cursor-pointer shrink-0"
                      />
                      <button
                        onClick={() => router.push(`/contracts/new?id=${contract.id}`)}
                        className="flex items-center gap-3 flex-1 min-w-0 text-left"
                      >
                        <div className="w-10 h-10 rounded-xl bg-[#ebf5fb] flex items-center justify-center shrink-0">
                          <FileSignature size={18} className="text-[#2980b9]" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-semibold text-sm text-[#1e2a3a] truncate">
                              {contract.companies?.name ?? '업체 미지정'}
                            </span>
                            <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${STATUS_COLOR[contract.status]}`}>
                              {STATUS_LABEL[contract.status]}
                            </span>
                          </div>
                          <p className="text-xs text-[#718096] mt-0.5">
                            수신: {contract.recipient || '-'}
                          </p>
                          <div className="flex items-center gap-2 mt-0.5 text-xs text-[#718096]">
                            <span>{contract.contract_date}</span>
                            {contract.start_date && contract.end_date && (
                              <span>· {contract.start_date} ~ {contract.end_date}</span>
                            )}
                            <span className="font-semibold text-[#1e2a3a]">
                              · {contract.total_amount.toLocaleString()}원
                            </span>
                          </div>
                        </div>
                      </button>
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          onClick={e => handleDelete(e, contract)}
                          className="p-1.5 text-gray-300 hover:text-red-400 transition-colors"
                        >
                          <Trash2 size={15} />
                        </button>
                        <ChevronRight size={16} className="text-gray-300" />
                      </div>
                    </div>
                  </li>
                )
              })}
            </ul>
          </>
        )}
      </div>
    </div>
  )
}
