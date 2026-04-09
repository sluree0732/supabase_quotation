'use client'

import { useEffect, useState, useMemo } from 'react'
import { X, Search, Building2, Check } from 'lucide-react'
import type { Company } from '@/types'
import { getCompanies } from '@/lib/companies'

interface Props {
  selected: Company | null
  onSelect: (company: Company) => void
  onClose: () => void
}

export default function CompanyPickerModal({ selected, onSelect, onClose }: Props) {
  const [companies, setCompanies] = useState<Company[]>([])
  const [query, setQuery] = useState('')

  useEffect(() => {
    getCompanies().then(setCompanies).catch(() => {})
  }, [])

  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return q ? companies.filter(c => c.name.toLowerCase().includes(q)) : companies
  }, [companies, query])

  return (
    <div className="fixed inset-0 z-[60] flex items-end md:items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div
        className="relative z-10 w-full md:w-[480px] bg-white rounded-t-2xl md:rounded-2xl shadow-xl flex flex-col max-h-[calc(100dvh-3.5rem)] md:max-h-[75vh]"
        onTouchMove={e => e.stopPropagation()}
      >
        <div className="md:hidden flex justify-center pt-3 pb-1 shrink-0">
          <div className="w-10 h-1 bg-gray-300 rounded-full" />
        </div>
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 shrink-0">
          <h2 className="font-bold text-[#1e2a3a]">업체 선택</h2>
          <button onClick={onClose}><X size={20} className="text-gray-400" /></button>
        </div>
        <div className="px-4 py-3 shrink-0">
          <div className="relative">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              autoFocus
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="업체명 검색..."
              className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm bg-gray-50 focus:outline-none focus:border-[#2980b9]"
            />
          </div>
        </div>
        <ul className="flex-1 overflow-y-auto divide-y divide-gray-50 px-2 pb-4 min-h-[200px]">
          {filtered.length === 0 ? (
            <li className="py-8 text-center text-sm text-gray-400">업체가 없습니다.</li>
          ) : filtered.map(c => (
            <li key={c.id}>
              <button
                onClick={() => { onSelect(c); onClose() }}
                className="w-full flex items-center gap-3 px-3 py-3.5 rounded-xl hover:bg-gray-50 active:bg-gray-100 text-left"
              >
                <div className="w-9 h-9 rounded-lg bg-[#ebf5fb] flex items-center justify-center shrink-0">
                  <Building2 size={16} className="text-[#2980b9]" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm text-[#1e2a3a] truncate">{c.name}</p>
                  {c.phone && <p className="text-xs text-gray-400 mt-0.5">{c.phone}</p>}
                </div>
                {selected?.id === c.id && <Check size={18} className="text-[#2980b9] shrink-0" />}
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
