'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, Building2, FileText, FileSignature } from 'lucide-react'

const NAV_ITEMS = [
  { href: '/', label: '홈', icon: Home },
  { href: '/companies', label: '업체 등록', icon: Building2 },
  { href: '/quotations', label: '견적서 작성', icon: FileText },
  { href: '/contracts', label: '계약서 작성', icon: FileSignature },
]

interface SidebarProps {
  draftCount?: number
}

export default function Sidebar({ draftCount }: SidebarProps) {
  const pathname = usePathname()

  return (
    <aside className="hidden md:flex flex-col w-52 min-h-screen bg-[#1e2a3a] shrink-0">
      {/* 로고 */}
      <div className="flex items-center justify-center h-18 bg-[#16212e] border-b border-[#2c3e50]">
        <span className="text-white font-bold text-base py-6">견적서 관리</span>
      </div>

      {/* 메뉴 */}
      <nav className="flex flex-col flex-1 pt-2">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const isActive = pathname === href
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 px-6 h-12 text-sm transition-colors ${
                isActive
                  ? 'bg-[#2980b9] text-white font-semibold border-l-4 border-[#5dade2]'
                  : 'text-[#a0aec0] hover:bg-[#2c3e50] hover:text-white'
              }`}
            >
              <Icon size={18} />
              <span>{label}</span>
            </Link>
          )
        })}
      </nav>

      {/* 버전 */}
      <div className="text-center text-[#4a5568] text-xs py-3">v1.0.0</div>
    </aside>
  )
}
