'use client'

import { useState } from 'react'
import { BookText, FileSignature } from 'lucide-react'
import NoteTemplateList from '@/components/note-templates/NoteTemplateList'
import ContractTemplateManager from '@/components/note-templates/ContractTemplateManager'

type TabType = 'notes' | 'contracts'

export default function NoteTemplatesPage() {
  const [activeTab, setActiveTab] = useState<TabType>('notes')

  return (
    <div className="flex-1 min-h-screen bg-[#f8fafc] p-6">
      {/* 헤더 */}
      <div className="flex items-center gap-2 mb-5">
        <BookText size={22} className="text-[#2980b9]" />
        <h1 className="text-xl font-bold text-[#1e2a3a]">비고 등록</h1>
      </div>

      {/* 탭 */}
      <div className="flex gap-1 mb-6 bg-gray-100 p-1 rounded-xl w-fit">
        <button
          onClick={() => setActiveTab('notes')}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            activeTab === 'notes'
              ? 'bg-white text-[#1e2a3a] shadow-sm'
              : 'text-[#718096] hover:text-[#1e2a3a]'
          }`}
        >
          <BookText size={14} />
          AI 생성 리스트 관리
        </button>
        <button
          onClick={() => setActiveTab('contracts')}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            activeTab === 'contracts'
              ? 'bg-white text-[#1e2a3a] shadow-sm'
              : 'text-[#718096] hover:text-[#1e2a3a]'
          }`}
        >
          <FileSignature size={14} />
          계약서 관리
        </button>
      </div>

      {activeTab === 'notes' && <NoteTemplateList />}
      {activeTab === 'contracts' && <ContractTemplateManager />}
    </div>
  )
}
