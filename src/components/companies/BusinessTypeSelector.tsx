'use client'

import { useState, useRef, useEffect } from 'react'
import { ChevronDown, Search, X, PencilLine } from 'lucide-react'
import ksicData from '@/data/ksic.json'

interface KsicEntry {
  code: string
  name: string
  items: string[]
}

const KSIC: KsicEntry[] = ksicData as KsicEntry[]

interface BusinessTypeSelectorProps {
  bizType: string
  bizItem: string
  onBizTypeChange: (value: string) => void
  onBizItemChange: (value: string) => void
}

export default function BusinessTypeSelector({
  bizType,
  bizItem,
  onBizTypeChange,
  onBizItemChange,
}: BusinessTypeSelectorProps) {
  const [typeOpen, setTypeOpen] = useState(false)
  const [itemOpen, setItemOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [directInput, setDirectInput] = useState(false)

  const typeRef = useRef<HTMLDivElement>(null)
  const itemRef = useRef<HTMLDivElement>(null)

  // 선택된 대분류의 업종 목록
  const selectedEntry = KSIC.find(e => e.name === bizType)
  const allItems = selectedEntry?.items ?? []

  const filteredItems = searchQuery.trim()
    ? allItems.filter(item =>
        item.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : allItems

  // 외부 클릭 시 드롭다운 닫기
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (typeRef.current && !typeRef.current.contains(e.target as Node)) {
        setTypeOpen(false)
      }
      if (itemRef.current && !itemRef.current.contains(e.target as Node)) {
        setItemOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  function handleSelectType(name: string) {
    onBizTypeChange(name)
    onBizItemChange('')
    setSearchQuery('')
    setDirectInput(false)
    setTypeOpen(false)
  }

  function handleSelectItem(item: string) {
    onBizItemChange(item)
    setSearchQuery('')
    setItemOpen(false)
    setDirectInput(false)
  }

  function handleClearType() {
    onBizTypeChange('')
    onBizItemChange('')
    setSearchQuery('')
    setDirectInput(false)
  }

  function handleClearItem() {
    onBizItemChange('')
    setSearchQuery('')
  }

  function handleToggleDirectInput() {
    const next = !directInput
    setDirectInput(next)
    if (next) {
      setItemOpen(false)
      setSearchQuery('')
    } else {
      onBizItemChange('')
    }
  }

  return (
    <div className="space-y-3">
      {/* 업태 드롭다운 */}
      <div className="space-y-1.5">
        <label className="text-sm font-medium text-[#4a5568]">업태</label>
        <div className="relative" ref={typeRef}>
          <button
            type="button"
            onClick={() => setTypeOpen(v => !v)}
            className="input-base w-full flex items-center justify-between text-left"
          >
            <span className={bizType ? 'text-[#1e2a3a]' : 'text-gray-400'}>
              {bizType || '업태 선택'}
            </span>
            <div className="flex items-center gap-1 shrink-0">
              {bizType && (
                <span
                  role="button"
                  onClick={e => { e.stopPropagation(); handleClearType() }}
                  className="p-0.5 text-gray-400 hover:text-gray-600 cursor-pointer"
                >
                  <X size={14} />
                </span>
              )}
              <ChevronDown
                size={16}
                className={`text-gray-400 transition-transform ${typeOpen ? 'rotate-180' : ''}`}
              />
            </div>
          </button>

          {typeOpen && (
            <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg max-h-56 overflow-y-auto">
              {KSIC.map(entry => (
                <button
                  key={entry.code}
                  type="button"
                  onClick={() => handleSelectType(entry.name)}
                  className={`w-full text-left px-4 py-2.5 text-sm hover:bg-gray-50 transition-colors ${
                    bizType === entry.name ? 'bg-[#ebf5fb] text-[#2980b9] font-medium' : 'text-[#1e2a3a]'
                  }`}
                >
                  <span className="text-xs text-gray-400 mr-2">{entry.code}</span>
                  {entry.name}
                  <span className="text-xs text-gray-400 ml-1">({entry.items.length})</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 업종 드롭다운 (업태 선택 후 활성화) */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium text-[#4a5568]">업종</label>
          <button
            type="button"
            onClick={handleToggleDirectInput}
            className={`flex items-center gap-1 text-xs font-medium transition-colors ${
              directInput
                ? 'text-[#2980b9]'
                : 'text-gray-400 hover:text-[#2980b9]'
            }`}
          >
            <PencilLine size={12} />
            직접 입력
          </button>
        </div>

        {directInput ? (
          <input
            type="text"
            value={bizItem}
            onChange={e => onBizItemChange(e.target.value)}
            placeholder="업종을 직접 입력하세요"
            className="input-base"
          />
        ) : (
          <div className="relative" ref={itemRef}>
            <button
              type="button"
              disabled={!bizType}
              onClick={() => { if (bizType) setItemOpen(v => !v) }}
              className={`input-base w-full flex items-center justify-between text-left ${
                !bizType ? 'opacity-50 cursor-not-allowed bg-gray-50' : ''
              }`}
            >
              <span className={bizItem ? 'text-[#1e2a3a]' : 'text-gray-400'}>
                {bizItem || (bizType ? '업종 검색 또는 선택' : '업태를 먼저 선택하세요')}
              </span>
              <div className="flex items-center gap-1 shrink-0">
                {bizItem && (
                  <span
                    role="button"
                    onClick={e => { e.stopPropagation(); handleClearItem() }}
                    className="p-0.5 text-gray-400 hover:text-gray-600 cursor-pointer"
                  >
                    <X size={14} />
                  </span>
                )}
                <ChevronDown
                  size={16}
                  className={`text-gray-400 transition-transform ${itemOpen ? 'rotate-180' : ''}`}
                />
              </div>
            </button>

            {itemOpen && (
              <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg">
                {/* 검색 입력 */}
                <div className="p-2 border-b border-gray-100 sticky top-0 bg-white">
                  <div className="relative">
                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                      placeholder="업종 검색..."
                      className="w-full pl-8 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-[#2980b9]"
                      autoFocus
                    />
                  </div>
                  <p className="text-xs text-gray-400 mt-1 px-1">
                    {filteredItems.length}개 결과
                  </p>
                </div>

                {/* 업종 목록 */}
                <div className="max-h-48 overflow-y-auto">
                  {filteredItems.length === 0 ? (
                    <div className="px-4 py-3 text-sm text-gray-400 text-center">
                      검색 결과가 없습니다
                    </div>
                  ) : (
                    filteredItems.map(item => (
                      <button
                        key={item}
                        type="button"
                        onClick={() => handleSelectItem(item)}
                        className={`w-full text-left px-4 py-2.5 text-sm hover:bg-gray-50 transition-colors ${
                          bizItem === item ? 'bg-[#ebf5fb] text-[#2980b9] font-medium' : 'text-[#1e2a3a]'
                        }`}
                      >
                        {searchQuery ? highlightMatch(item, searchQuery) : item}
                      </button>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

function highlightMatch(text: string, query: string) {
  const idx = text.toLowerCase().indexOf(query.toLowerCase())
  if (idx === -1) return <>{text}</>
  return (
    <>
      {text.slice(0, idx)}
      <mark className="bg-yellow-100 text-yellow-800 rounded">{text.slice(idx, idx + query.length)}</mark>
      {text.slice(idx + query.length)}
    </>
  )
}
