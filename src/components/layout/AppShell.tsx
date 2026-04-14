'use client'

import { useEffect, useState } from 'react'
import Sidebar from './Sidebar'
import BottomNav from './BottomNav'
import InAppBrowserBanner from '@/components/shared/InAppBrowserBanner'
import { supabase } from '@/lib/supabase'

export default function AppShell({ children }: { children: React.ReactNode }) {
  const [draftCount, setDraftCount] = useState(0)

  useEffect(() => {
    fetchDraftCount()

    const channel = supabase
      .channel('quotations-draft-count')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'quotations' }, fetchDraftCount)
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [])

  async function fetchDraftCount() {
    const { count } = await supabase
      .from('quotations')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'draft')
    setDraftCount(count ?? 0)
  }

  return (
    <div className="flex min-h-screen bg-[#f5f6fa]">
      <Sidebar draftCount={draftCount} />
      <main className="flex-1 pb-16 md:pb-0 min-w-0">
        <InAppBrowserBanner />
        {children}
      </main>
      <BottomNav draftCount={draftCount} />
    </div>
  )
}
