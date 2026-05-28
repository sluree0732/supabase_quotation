'use client'

import { useState, useEffect, useRef } from 'react'
import { Building2, ChevronDown, X, Loader2, Plus } from 'lucide-react'
import type { Company, CompanyType } from '@/types'
import { getCompanies, createCompany } from '@/lib/companies'

interface Props {
  typeFilter: CompanyType
  selected: Company | null
  onSelect: (c: Company | null) => void
  placeholder?: string
}

export default function CompanyCombobox({ typeFilter, selected, onSelect, placeholder }: Props) {
  const [companies, setCompanies] = useState<Company[]>([])
  const [inputValue, setInputValue] = useState(selected?.name ?? '')
  const [open, setOpen] = useState(false)
  const [creating, setCreating] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const iconColor = typeFilter === 'sender' ? 'text-[#27ae60]' : 'text-[#2980b9]'

  useEffect(() => {
    getCompanies()
      .then(all => setCompanies(all.filter(c => c.company_type === typeFilter)))
      .catch(() => {})
  }, [typeFilter])

  useEffect(() => {
    setInputValue(selected?.name ?? '')
  }, [selected])

  useEffect(() => {
    function handleMouseDown(e: MouseEvent) {
      if (!containerRef.current?.contains(e.target as Node)) {
        setOpen(false)
        setInputValue(selected?.name ?? '')
      }
    }
    document.addEventListener('mousedown', handleMouseDown)
    return () => document.removeEventListener('mousedown', handleMouseDown)
  }, [selected])

  const filtered = inputValue.trim()
    ? companies.filter(c => c.name.toLowerCase().includes(inputValue.toLowerCase()))
    : companies

  const exactMatch = companies.some(c => c.name.toLowerCase() === inputValue.toLowerCase().trim())
  const canCreate = inputValue.trim().length > 0 && !exactMatch

  async function handleCreate() {
    if (!inputValue.trim()) return
    setCreating(true)
    try {
      const newCompany = await createCompany({
        company_type: typeFilter,
        name: inputValue.trim(),
        address: '',
        phone: '',
        business_no: '',
        business_type: '',
        business_item: '',
        email: '',
        fax: '',
      })
      setCompanies(prev => [...prev, { ...newCompany, contacts: [] }])
      onSelect({ ...newCompany, contacts: [] })
      setOpen(false)
    } catch {
      // ignore
    } finally {
      setCreating(false)
    }
  }

  return (
    <div ref={containerRef} className="relative">
      <div className="relative">
        <div className={`absolute left-3 top-1/2 -translate-y-1/2 ${iconColor}`}>
          <Building2 size={16} />
        </div>
        <input
          type="text"
          value={inputValue}
          onChange={e => { setInputValue(e.target.value); setOpen(true) }}
          onFocus={() => setOpen(true)}
          placeholder={placeholder ?? '업체명 입력 또는 검색'}
          className="input-base w-full pl-9 pr-14"
        />
        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-0.5">
          {selected && (
            <button
              type="button"
              onMouseDown={e => { e.preventDefault(); onSelect(null); setInputValue('') }}
              className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X size={14} />
            </button>
          )}
          <button
            type="button"
            onMouseDown={e => { e.preventDefault(); setOpen(v => !v) }}
            className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <ChevronDown size={16} className={`transition-transform duration-150 ${open ? 'rotate-180' : ''}`} />
          </button>
        </div>
      </div>

      {open && (filtered.length > 0 || canCreate) && (
        <ul className="absolute z-[100] left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg max-h-52 overflow-y-auto">
          {filtered.map(c => (
            <li key={c.id}>
              <button
                type="button"
                onMouseDown={e => {
                  e.preventDefault()
                  onSelect(c)
                  setInputValue(c.name)
                  setOpen(false)
                }}
                className={`w-full flex items-center gap-3 px-4 py-2.5 hover:bg-[#ebf5fb] text-left transition-colors ${
                  selected?.id === c.id ? 'bg-[#ebf5fb]' : ''
                }`}
              >
                <Building2 size={14} className="text-[#2980b9] shrink-0" />
                <span className="text-sm text-[#1e2a3a]">{c.name}</span>
              </button>
            </li>
          ))}
          {canCreate && (
            <li>
              <button
                type="button"
                onMouseDown={e => { e.preventDefault(); handleCreate() }}
                disabled={creating}
                className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-[#f0fdf4] text-left transition-colors text-[#27ae60] border-t border-gray-100 disabled:opacity-60"
              >
                {creating
                  ? <Loader2 size={14} className="animate-spin shrink-0" />
                  : <Plus size={14} className="shrink-0" />
                }
                <span className="text-sm font-medium">
                  {creating ? '등록 중...' : `"${inputValue.trim()}" 새 업체로 등록`}
                </span>
              </button>
            </li>
          )}
        </ul>
      )}
    </div>
  )
}
