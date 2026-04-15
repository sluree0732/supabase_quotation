'use client'

import { useState, useRef, useEffect } from 'react'
import { ChevronDown } from 'lucide-react'
import ksicData from '@/data/ksic.json'

interface KsicEntry {
  code: string
  name: string
  items: string[]
}

const KSIC: KsicEntry[] = ksicData as KsicEntry[]
const ALL_TYPE_NAMES = KSIC.map(e => e.name)

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

  const typeRef = useRef<HTMLDivElement>(null)
  const itemRef = useRef<HTMLDivElement>(null)

  // 업태 입력값으로 목록 필터링
  const filteredTypes = bizType.trim()
    ? ALL_TYPE_NAMES.filter(name =>
        name.toLowerCase().includes(bizType.toLowerCase())
      )
    : ALL_TYPE_NAMES

  // 선택된 업태의 업종 목록 (업태가 정확히 일치하는 경우)
  const selectedEntry = KSIC.find(e => e.name === bizType)
  const allItems = selectedEntry?.items ?? []

  // 업종 입력값으로 목록 필터링
  const filteredItems = bizItem.trim()
    ? allItems.filter(item =>
        item.toLowerCase().includes(bizItem.toLowerCase())
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

  function handleTypeInput(value: string) {
    onBizTypeChange(value)
    onBizItemChange('')
    setTypeOpen(true)
  }

  function handleSelectType(name: string) {
    onBizTypeChange(name)
    onBizItemChange('')
    setTypeOpen(false)
  }

  function handleItemInput(value: string) {
    onBizItemChange(value)
    setItemOpen(true)
  }

  function handleSelectItem(item: string) {
    onBizItemChange(item)
    setItemOpen(false)
  }

  return (
    <div className="space-y-3">
      {/* 업태 콤보박스 */}
      <div className="space-y-1.5">
        <label className="text-sm font-medium text-[#4a5568]">업태</label>
        <div className="relative" ref={typeRef}>
          <input
            type="text"
            value={bizType}
            onChange={e => handleTypeInput(e.target.value)}
            onFocus={() => setTypeOpen(true)}
            placeholder="예: 서비스업, 제조업 (입력하거나 선택)"
            className="input-base w-full pr-8"
          />
          <button
            type="button"
            tabIndex={-1}
            onClick={() => setTypeOpen(v => !v)}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            <ChevronDown
              size={16}
              className={`transition-transform ${typeOpen ? 'rotate-180' : ''}`}
            />
          </button>

          {typeOpen && filteredTypes.length > 0 && (
            <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg max-h-56 overflow-y-auto">
              {filteredTypes.map(name => {
                const entry = KSIC.find(e => e.name === name)!
                return (
                  <button
                    key={entry.code}
                    type="button"
                    onMouseDown={e => e.preventDefault()}
                    onClick={() => handleSelectType(name)}
                    className={`w-full text-left px-4 py-2.5 text-sm hover:bg-gray-50 transition-colors ${
                      bizType === name ? 'bg-[#ebf5fb] text-[#2980b9] font-medium' : 'text-[#1e2a3a]'
                    }`}
                  >
                    <span className="text-xs text-gray-400 mr-2">{entry.code}</span>
                    {name}
                    <span className="text-xs text-gray-400 ml-1">({entry.items.length})</span>
                  </button>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* 업종 콤보박스 */}
      <div className="space-y-1.5">
        <label className="text-sm font-medium text-[#4a5568]">업종</label>
        <div className="relative" ref={itemRef}>
          <input
            type="text"
            value={bizItem}
            onChange={e => handleItemInput(e.target.value)}
            onFocus={() => { if (allItems.length > 0) setItemOpen(true) }}
            placeholder={
              selectedEntry
                ? `예: ${allItems[0] ?? '업종 입력 또는 선택'}`
                : '예: 광고대행업, IT (직접 입력 가능)'
            }
            className="input-base w-full pr-8"
          />
          {allItems.length > 0 && (
            <button
              type="button"
              tabIndex={-1}
              onClick={() => setItemOpen(v => !v)}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <ChevronDown
                size={16}
                className={`transition-transform ${itemOpen ? 'rotate-180' : ''}`}
              />
            </button>
          )}

          {itemOpen && filteredItems.length > 0 && (
            <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg">
              <div className="px-3 py-1.5 border-b border-gray-100">
                <p className="text-xs text-gray-400">{filteredItems.length}개 항목</p>
              </div>
              <div className="max-h-48 overflow-y-auto">
                {filteredItems.map(item => (
                  <button
                    key={item}
                    type="button"
                    onMouseDown={e => e.preventDefault()}
                    onClick={() => handleSelectItem(item)}
                    className={`w-full text-left px-4 py-2.5 text-sm hover:bg-gray-50 transition-colors ${
                      bizItem === item ? 'bg-[#ebf5fb] text-[#2980b9] font-medium' : 'text-[#1e2a3a]'
                    }`}
                  >
                    {bizItem.trim() ? highlightMatch(item, bizItem) : item}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
        {!selectedEntry && (
          <p className="text-xs text-gray-400">
            업태를 먼저 선택하면 업종 목록을 불러올 수 있습니다.
          </p>
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
      <mark className="bg-yellow-100 text-yellow-800 rounded">
        {text.slice(idx, idx + query.length)}
      </mark>
      {text.slice(idx + query.length)}
    </>
  )
}
