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
      <div className="flex items-center gap-3 mb-5">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl shrink-0" style={{ background: '#e67e2218' }}>📝</div>
        <div>
          <h1 className="text-xl font-bold text-[#1e2a3a]">비고 등록</h1>
        </div>
      </div>

      {/* 탭 */}
      <div className="flex border-b border-gray-200 mb-6">
        <button
          onClick={() => setActiveTab('notes')}
          className={`flex items-center gap-1.5 px-5 py-3 text-sm font-semibold border-b-2 transition-colors ${
            activeTab === 'notes'
              ? 'border-[#2980b9] text-[#2980b9]'
              : 'border-transparent text-[#718096] hover:text-[#1e2a3a] hover:border-gray-300'
          }`}
        >
          <BookText size={15} />
          AI 생성 비고 관리
        </button>
        <button
          onClick={() => setActiveTab('contracts')}
          className={`flex items-center gap-1.5 px-5 py-3 text-sm font-semibold border-b-2 transition-colors ${
            activeTab === 'contracts'
              ? 'border-[#8e44ad] text-[#8e44ad]'
              : 'border-transparent text-[#718096] hover:text-[#1e2a3a] hover:border-gray-300'
          }`}
        >
          <FileSignature size={15} />
          계약서 조항 관리
        </button>
      </div>

      {activeTab === 'notes' && <NoteTemplateList />}
      {activeTab === 'contracts' && <ContractTemplateManager />}
    </div>
  )
}
