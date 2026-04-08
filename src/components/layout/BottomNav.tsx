'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, Building2, FileText, FileSignature } from 'lucide-react'

const NAV_ITEMS = [
  { href: '/', label: '홈', icon: Home },
  { href: '/companies', label: '업체', icon: Building2 },
  { href: '/quotations', label: '견적서', icon: FileText },
  { href: '/contracts', label: '계약서', icon: FileSignature },
]

interface BottomNavProps {
  draftCount: number
}

export default function BottomNav({ draftCount }: BottomNavProps) {
  const pathname = usePathname()

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-[#1e2a3a] border-t border-[#2c3e50] flex z-50">
      {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
        const isActive = pathname === href
        return (
          <Link
            key={href}
            href={href}
            className={`flex-1 flex flex-col items-center justify-center py-2 gap-1 text-xs transition-colors relative ${
              isActive ? 'text-[#5dade2]' : 'text-[#a0aec0]'
            }`}
          >
            <div className="relative">
              <Icon size={22} />
              {href === '/quotations' && draftCount > 0 && (
                <span className="absolute -top-1.5 -right-2 bg-red-500 text-white text-[10px] rounded-full px-1 min-w-[16px] text-center">
                  {draftCount}
                </span>
              )}
            </div>
            <span>{label}</span>
          </Link>
        )
      })}
    </nav>
  )
}
