'use client'

import { useEffect, useState, useRef } from 'react'
import { X, Download, Loader2 } from 'lucide-react'
import type { QuotationFormState } from './QuotationForm'

interface Props {
  state: QuotationFormState
  onClose: () => void
}

export default function PdfViewerModal({ state, onClose }: Props) {
  const [blobUrl, setBlobUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const blobRef = useRef<string | null>(null)

  useEffect(() => {
    async function generate() {
      try {
        const total = state.items.reduce((s, i) => s + i.total_price, 0)
        const res = await fetch('/api/pdf', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            projectName: state.projectName,
            quoteDate: state.quoteDate,
            recipient: state.recipient,
            senderInfo: state.senderInfo,
            clientInfo: state.clientInfo,
            items: state.items,
            totalAmount: total,
            vatType: state.vatType,
          }),
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

  function handleDownload() {
    if (!blobUrl) return
    const a = document.createElement('a')
    a.href = blobUrl
    const dateStr = state.quoteDate.replace(/-/g, '')
    const prefix = state.company?.name ?? state.clientInfo?.name ?? ''
    a.download = prefix ? `${prefix}_견적서(${dateStr}).pdf` : `견적서(${dateStr}).pdf`
    a.click()
  }

  return (
    <div className="fixed inset-0 z-[70] flex flex-col bg-white">
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 shrink-0">
        <h2 className="font-bold text-[#1e2a3a]">PDF 미리보기</h2>
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

      <div className="flex-1 bg-gray-100">
        {loading && (
          <div className="flex items-center justify-center h-full gap-2 text-gray-400">
            <Loader2 size={20} className="animate-spin" />
            <span className="text-sm">PDF 생성 중...</span>
          </div>
        )}
        {error && (
          <div className="flex items-center justify-center h-full text-red-400 text-sm">{error}</div>
        )}
        {blobUrl && (
          <iframe src={blobUrl} className="w-full h-full border-0" title="PDF 미리보기" />
        )}
      </div>
    </div>
  )
}
