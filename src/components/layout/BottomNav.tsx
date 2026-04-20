'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
const NAV_ITEMS = [
  { href: '/', label: '홈', icon: '🏠' },
  { href: '/companies', label: '업체', icon: '🏢' },
  { href: '/quotations', label: '견적서', icon: '📄' },
  { href: '/contracts', label: '계약서', icon: '✍️' },
  { href: '/note-templates', label: '비고', icon: '📝' },
]

interface BottomNavProps {
  draftCount?: number
}

export default function BottomNav({ draftCount }: BottomNavProps) {
  const pathname = usePathname()

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-[#1e2a3a] border-t border-[#2c3e50] flex z-50">
      {NAV_ITEMS.map(({ href, label, icon }) => {
        const isActive = pathname === href
        return (
          <Link
            key={href}
            href={href}
            className={`flex-1 flex flex-col items-center justify-center py-2 gap-0.5 text-[10px] transition-colors relative ${
              isActive ? 'text-[#5dade2]' : 'text-[#a0aec0]'
            }`}
          >
            <span className="text-xl">{icon}</span>
            <span>{label}</span>
          </Link>
        )
      })}
    </nav>
  )
}
