'use client'

import { useEffect, useState, useRef } from 'react'
import { X, Download, Loader2, Smartphone } from 'lucide-react'
import dynamic from 'next/dynamic'
import { isInAppBrowser } from '@/lib/inAppBrowser'
const PdfViewerBase = dynamic(() => import('@/components/shared/PdfViewerBase'), { ssr: false })

interface ContractPdfPayload {
  contractDate: string
  startDate: string
  endDate: string
  recipient: string
  companyName: string
  companyAddress: string
  items: any[]
  totalAmount: number
  vatType: string
  specialTerms: string
  filename: string
}

interface Props {
  payload: ContractPdfPayload
  onClose: () => void
}

export default function ContractPdfViewerModal({ payload, onClose }: Props) {
  const [blobUrl, setBlobUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showInAppToast, setShowInAppToast] = useState(false)
  const [toastExiting, setToastExiting] = useState(false)
  const blobRef = useRef<string | null>(null)
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    async function generate() {
      try {
        const res = await fetch('/api/contract-pdf', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
        if (!res.ok) throw new Error('PDF 생성 실패')
        const blob = await res.blob()
        const url = URL.createObjectURL(blob)
        blobRef.current = url
        setBlobUrl(url)
      } catch (e: any) {
        setError(e.message ?? 'PDF 생성 실패')
      } finally {
        setLoading(false)
      }
    }
    generate()
    return () => { if (blobRef.current) URL.revokeObjectURL(blobRef.current) }
  }, [])

  function showInAppGuide() {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current)
    setToastExiting(false)
    setShowInAppToast(true)
    toastTimerRef.current = setTimeout(() => {
      setToastExiting(true)
      setTimeout(() => setShowInAppToast(false), 300)
    }, 3500)
  }

  function handleDownload() {
    if (isInAppBrowser()) { showInAppGuide(); return }
    if (!blobUrl) return
    const a = document.createElement('a')
    a.href = blobUrl
    a.download = payload.filename
    a.click()
  }

  return (
    <div className="fixed inset-0 z-[70] flex flex-col bg-white">
      {/* 인앱 브라우저 다운로드 안내 토스트 */}
      {showInAppToast && (
        <div className={`fixed bottom-0 left-0 right-0 z-[80] ${toastExiting ? 'animate-slide-down-out' : 'animate-slide-up-in'}`}>
          <div className="bg-[#1e2a3a] text-white shadow-2xl px-5 py-4 flex items-start gap-3">
            <Smartphone size={18} className="text-amber-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold mb-0.5">외부 브라우저에서 다운로드하세요</p>
              <p className="text-xs text-white/70 leading-relaxed">
                우측 하단 <span className="font-bold text-white">···</span> 버튼 →{' '}
                <span className="font-bold text-amber-400">다른 브라우저로 열기</span>
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 shrink-0">
        <h2 className="font-bold text-[#1e2a3a]">계약서 PDF 미리보기</h2>
        <div className="flex items-center gap-2">
          {blobUrl && (
            <button
              onClick={handleDownload}
              className="flex items-center gap-1.5 bg-[#e74c3c] text-white px-3 py-1.5 rounded-lg text-sm font-medium"
            >
              <Download size={14} />
              PDF 다운로드
            </button>
          )}
          <button onClick={onClose}>
            <X size={20} className="text-gray-400" />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-hidden">
        {loading && (
          <div className="flex items-center justify-center h-full gap-2 text-gray-400">
            <Loader2 size={20} className="animate-spin" />
            <span className="text-sm">PDF 생성 중...</span>
          </div>
        )}
        {error && (
          <div className="flex items-center justify-center h-full text-red-400 text-sm">{error}</div>
        )}
        {blobUrl && <PdfViewerBase blobUrl={blobUrl} />}
      </div>
    </div>
  )
}
