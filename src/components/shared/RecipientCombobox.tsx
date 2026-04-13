'use client'

import { useState, useEffect, useRef } from 'react'
import { ChevronDown, UserRound } from 'lucide-react'
import type { CompanyContact } from '@/types'
import { getContacts } from '@/lib/companies'

interface Props {
  companyId: string | null
  initialContacts?: CompanyContact[]
  value: string
  onChange: (v: string) => void
  placeholder?: string
}

export default function RecipientCombobox({
  companyId,
  initialContacts,
  value,
  onChange,
  placeholder,
}: Props) {
  const [contacts, setContacts] = useState<CompanyContact[]>(initialContacts ?? [])
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  // initialContacts가 바뀌면 즉시 반영 (picker에서 회사 선택 시)
  useEffect(() => {
    if (initialContacts !== undefined) {
      setContacts(initialContacts)
    }
  }, [initialContacts])

  // initialContacts가 없으면 companyId로 fetch (수정 모드 등)
  useEffect(() => {
    if (initialContacts !== undefined) return  // 이미 있으면 fetch 불필요
    if (!companyId) { setContacts([]); return }
    getContacts(companyId).then(setContacts).catch(() => setContacts([]))
  }, [companyId, initialContacts])

  // 외부 클릭 시 닫기
  useEffect(() => {
    function handleMouseDown(e: MouseEvent) {
      if (!containerRef.current?.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handleMouseDown)
    return () => document.removeEventListener('mousedown', handleMouseDown)
  }, [])

  const filtered = value.trim()
    ? contacts.filter(c => c.name.toLowerCase().includes(value.toLowerCase()))
    : contacts

  return (
    <div ref={containerRef} className="relative">
      <div className="relative">
        <input
          type="text"
          value={value}
          onChange={e => onChange(e.target.value)}
          onFocus={() => { if (contacts.length > 0) setOpen(true) }}
          placeholder={placeholder ?? '예: 홍길동 대표'}
          className="input-base w-full pr-8"
        />
        {contacts.length > 0 && (
          <button
            type="button"
            onMouseDown={e => { e.preventDefault(); setOpen(v => !v) }}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <ChevronDown
              size={16}
              className={`transition-transform duration-150 ${open ? 'rotate-180' : ''}`}
            />
          </button>
        )}
      </div>

      {open && filtered.length > 0 && (
        <ul className="absolute z-[100] left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg max-h-48 overflow-y-auto">
          {filtered.map(c => (
            <li key={c.id}>
              <button
                type="button"
                onMouseDown={e => {
                  e.preventDefault()
                  onChange(c.name)
                  setOpen(false)
                }}
                className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-[#ebf5fb] text-left transition-colors"
              >
                <UserRound size={14} className="text-[#2980b9] shrink-0" />
                <div className="min-w-0">
                  <p className="text-sm font-medium text-[#1e2a3a]">{c.name}</p>
                  {c.phone && <p className="text-xs text-[#718096]">{c.phone}</p>}
                </div>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
