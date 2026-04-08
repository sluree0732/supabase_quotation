'use client'

import { useEffect, useState, useMemo } from 'react'
import { Plus, Search, Building2, Phone, MapPin, ChevronRight } from 'lucide-react'
import type { Company } from '@/types'
import { getCompanies } from '@/lib/companies'
import CompanyModal from '@/components/companies/CompanyModal'

export default function CompaniesPage() {
  const [companies, setCompanies] = useState<Company[]>([])
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<Company | null | undefined>(undefined)
  // undefined = 모달 닫힘, null = 신규, Company = 수정

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    try {
      setCompanies(await getCompanies())
    } finally {
      setLoading(false)
    }
  }

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return q ? companies.filter(c => c.name.toLowerCase().includes(q)) : companies
  }, [companies, query])

  return (
    <div className="flex flex-col h-full">
      {/* 헤더 */}
      <div className="bg-white border-b border-gray-100 px-4 py-4 md:px-8">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h1 className="text-xl font-bold text-[#1e2a3a]">업체 등록</h1>
            <p className="text-xs text-[#718096] mt-0.5">총 {companies.length}개 업체</p>
          </div>
          <button
            onClick={() => setSelected(null)}
            className="flex items-center gap-1.5 bg-[#2980b9] text-white px-4 py-2.5 rounded-xl text-sm font-semibold shadow-sm active:scale-95 transition-transform"
          >
            <Plus size={16} />
            업체 추가
          </button>
        </div>

        {/* 검색 */}
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="업체명 검색..."
            className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm bg-gray-50 focus:outline-none focus:border-[#2980b9] focus:bg-white transition-colors"
          />
        </div>
      </div>

      {/* 목록 */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center h-40 text-gray-400 text-sm">
            불러오는 중...
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 text-gray-400 gap-2">
            <Building2 size={32} className="opacity-30" />
            <p className="text-sm">
              {query ? '검색 결과가 없습니다.' : '등록된 업체가 없습니다.'}
            </p>
          </div>
        ) : (
          <>
            {/* 모바일: 카드 목록 */}
            <ul className="md:hidden divide-y divide-gray-100">
              {filtered.map(company => (
                <li key={company.id}>
                  <button
                    onClick={() => setSelected(company)}
                    className="w-full text-left px-4 py-4 flex items-center gap-3 active:bg-gray-50"
                  >
                    <div className="w-10 h-10 rounded-xl bg-[#ebf5fb] flex items-center justify-center shrink-0">
                      <Building2 size={18} className="text-[#2980b9]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-[#1e2a3a] text-sm truncate">{company.name}</p>
                      {company.phone && (
                        <p className="text-xs text-[#718096] flex items-center gap-1 mt-0.5">
                          <Phone size={10} />
                          {company.phone}
                        </p>
                      )}
                      {company.address && (
                        <p className="text-xs text-[#a0aec0] flex items-center gap-1 mt-0.5 truncate">
                          <MapPin size={10} className="shrink-0" />
                          {company.address}
                        </p>
                      )}
                    </div>
                    <ChevronRight size={16} className="text-gray-300 shrink-0" />
                  </button>
                </li>
              ))}
            </ul>

            {/* PC: 테이블 */}
            <div className="hidden md:block p-6">
              <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-100">
                      <th className="text-left px-5 py-3 font-semibold text-[#4a5568]">업체명</th>
                      <th className="text-left px-5 py-3 font-semibold text-[#4a5568]">전화번호</th>
                      <th className="text-left px-5 py-3 font-semibold text-[#4a5568]">주소</th>
                      <th className="text-left px-5 py-3 font-semibold text-[#4a5568]">업태</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {filtered.map(company => (
                      <tr
                        key={company.id}
                        onClick={() => setSelected(company)}
                        className="hover:bg-[#f0f7fd] cursor-pointer transition-colors"
                      >
                        <td className="px-5 py-3.5 font-medium text-[#1e2a3a]">{company.name}</td>
                        <td className="px-5 py-3.5 text-[#718096]">{company.phone || '—'}</td>
                        <td className="px-5 py-3.5 text-[#718096] max-w-xs truncate">{company.address || '—'}</td>
                        <td className="px-5 py-3.5 text-[#718096]">{company.business_type || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>

      {/* 모달 */}
      {selected !== undefined && (
        <CompanyModal
          company={selected}
          onClose={() => setSelected(undefined)}
          onSaved={load}
        />
      )}
    </div>
  )
}
