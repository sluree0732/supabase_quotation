'use client'

import { useEffect, useRef, useState } from 'react'
import Sidebar from './Sidebar'
import BottomNav from './BottomNav'
import { supabase } from '@/lib/supabase'
import { BACKEND } from '@/lib/backend'

interface DraftSummary {
  id: string
  recipient: string
  project_name: string | null
}

export default function AppShell({ children }: { children: React.ReactNode }) {
  const [draftCount, setDraftCount] = useState(0)
  const [toast, setToast] = useState<string | null>(null)
  const prevDraftsRef = useRef<DraftSummary[] | null>(null)

  useEffect(() => {
    if (BACKEND === 'supabase') {
      // ── Supabase 구현 (롤백용): Realtime 구독 ──
      fetchDraftCountSupabase()
      const channel = supabase
        .channel('quotations-draft-count')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'quotations' }, fetchDraftCountSupabase)
        .subscribe()
      return () => { supabase.removeChannel(channel) }
    }

    // ── Azure 구현 (기본값): 10초 폴링 + 변경 감지 토스트 ──
    fetchDraftSummaryAzure()
    const timer = setInterval(fetchDraftSummaryAzure, 10_000)
    return () => clearInterval(timer)
  }, [])

  async function fetchDraftCountSupabase() {
    const { count } = await supabase
      .from('quotations')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'draft')
    setDraftCount(count ?? 0)
  }

  async function fetchDraftSummaryAzure() {
    const res = await fetch('/api/quotations/draft-summary')
    if (!res.ok) return
    const { count, drafts } = await res.json() as { count: number; drafts: DraftSummary[] }

    const prev = prevDraftsRef.current
    if (prev) {
      const prevIds = new Set(prev.map(d => d.id))
      const added = drafts.filter(d => !prevIds.has(d.id))
      if (added.length === 1) {
        const d = added[0]
        showToast(
          d.project_name
            ? `${d.recipient || '(수신처 미입력)'} 앞 견적서 임시저장됨 (${d.project_name})`
            : `${d.recipient || '(수신처 미입력)'} 앞 견적서가 임시저장되었습니다`,
        )
      } else if (added.length > 1) {
        showToast(`임시저장 견적서 ${added.length}건이 추가되었습니다`)
      }
    }
    prevDraftsRef.current = drafts
    setDraftCount(count)
  }

  function showToast(msg: string) {
    setToast(msg)
    setTimeout(() => setToast(null), 3000)
  }

  return (
    <div className="flex min-h-screen bg-[#f5f6fa]">
      <Sidebar draftCount={draftCount} />
      <main className="flex-1 pb-16 md:pb-0 min-w-0">
        {children}
      </main>
      <BottomNav draftCount={draftCount} />

      {toast && (
        <div className="fixed bottom-24 md:bottom-8 left-1/2 -translate-x-1/2 z-[80] bg-[#1e2a3a] text-white text-sm font-medium px-5 py-3 rounded-2xl shadow-lg flex items-center gap-2 animate-fade-in">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="8" fill="#27ae60"/><path d="M4.5 8l2.5 2.5 4.5-4.5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
          {toast}
        </div>
      )}
    </div>
  )
}
