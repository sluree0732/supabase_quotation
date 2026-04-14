'use client'

import { useEffect, useState, useRef } from 'react'
import { X, Download, Loader2 } from 'lucide-react'
import dynamic from 'next/dynamic'
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
  const blobRef = useRef<string | null>(null)

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

  async function handleDownload() {
    try {
      const { filename, ...pdfPayload } = payload
      const res = await fetch('/api/download-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'contract-pdf', payload: pdfPayload, filename }),
      })
      if (!res.ok) throw new Error('다운로드 토큰 생성 실패')
      const { token } = await res.json()
      const a = document.createElement('a')
      a.href = `/api/download?token=${token}`
      a.click()
    } catch (e: any) {
      alert(e.message ?? 'PDF 다운로드 실패')
    }
  }

  return (
    <div className="fixed inset-0 z-[70] flex flex-col bg-white">
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
