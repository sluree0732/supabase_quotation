'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Building2, FileText, FileSignature, BookText, ChevronRight } from 'lucide-react'
import { supabase } from '@/lib/supabase'

export default function HomePage() {
  const [draftCount, setDraftCount] = useState(0)
  const [companyCount, setCompanyCount] = useState(0)
  const [contractDraftCount, setContractDraftCount] = useState(0)
  const [noteTemplateCount, setNoteTemplateCount] = useState(0)

  useEffect(() => {
    async function fetchCounts() {
      const [draftRes, companyRes, contractDraftRes, noteRes] = await Promise.all([
        supabase
          .from('quotations')
          .select('id', { count: 'exact', head: true })
          .eq('status', 'draft'),
        supabase
          .from('companies')
          .select('id', { count: 'exact', head: true }),
        supabase
          .from('contracts')
          .select('id', { count: 'exact', head: true })
          .eq('status', 'draft'),
        supabase
          .from('note_templates')
          .select('id', { count: 'exact', head: true }),
      ])
      setDraftCount(draftRes.count ?? 0)
      setCompanyCount(companyRes.count ?? 0)
      setContractDraftCount(contractDraftRes.count ?? 0)
      setNoteTemplateCount(noteRes.count ?? 0)
    }
    fetchCounts()
  }, [])

  const cards = [
    {
      href: '/companies',
      icon: Building2,
      color: '#2980b9',
      label: '업체 등록',
      desc: '거래처 정보 관리',
      badge: companyCount > 0 ? `${companyCount}개` : null,
    },
    {
      href: '/quotations',
      icon: FileText,
      color: '#27ae60',
      label: '견적서 작성',
      desc: '견적서 작성 및 PDF 출력',
      badge: draftCount > 0 ? `임시저장 ${draftCount}건` : null,
      badgeColor: 'bg-red-500',
    },
    {
      href: '/contracts',
      icon: FileSignature,
      color: '#8e44ad',
      label: '계약서 작성',
      desc: '계약서 작성 및 PDF 출력',
      badge: contractDraftCount > 0 ? `임시저장 ${contractDraftCount}건` : null,
      badgeColor: 'bg-red-500',
    },
    {
      href: '/note-templates',
      icon: BookText,
      color: '#e67e22',
      label: '비고 관리',
      desc: '비고 템플릿 등록 및 관리',
      badge: noteTemplateCount > 0 ? `${noteTemplateCount}개` : null,
      badgeColor: 'bg-[#e67e22]',
    },
  ]

  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-4rem)] md:min-h-screen px-6 py-12">
      {/* 헤더 */}
      <div className="text-center mb-10">
        <h1 className="text-3xl font-bold text-[#1e2a3a] mb-2">
          견적서 / 계약서 관리
        </h1>

      </div>

      {/* 카드 */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 w-full max-w-3xl">
        {cards.map(({ href, icon: Icon, color, label, desc, badge, badgeColor }) => (
          <Link
            key={href}
            href={href}
            className="bg-white rounded-2xl border-2 border-[#e2e8f0] p-3 md:p-5 flex flex-col gap-1.5 md:gap-3 hover:border-[#2980b9] transition-colors shadow-sm active:scale-95"
          >
            <div className="flex items-center justify-between">
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center"
                style={{ backgroundColor: `${color}18` }}
              >
                <Icon size={24} style={{ color }} />
              </div>
              <ChevronRight size={18} className="text-[#a0aec0]" />
            </div>
            <div>
              <div className="font-semibold text-[#1e2a3a] text-base">{label}</div>
              <div className="text-[#718096] text-xs mt-0.5">{desc}</div>
            </div>
            {badge && (
              <span
                className={`self-start text-xs text-white px-2 py-0.5 rounded-full ${
                  badgeColor ?? 'bg-[#2980b9]'
                }`}
              >
                {badge}
              </span>
            )}
          </Link>
        ))}
      </div>

      <p className="mt-10 text-[#a0aec0] text-xs">좌측 메뉴 또는 하단 탭을 선택하세요</p>
    </div>
  )
}
