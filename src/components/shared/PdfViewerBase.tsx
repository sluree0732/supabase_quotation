'use client'

import { useState, useRef, useEffect } from 'react'
import { Document, Page, pdfjs } from 'react-pdf'
import { ChevronLeft, ChevronRight, Loader2 } from 'lucide-react'
import 'react-pdf/dist/Page/AnnotationLayer.css'
import 'react-pdf/dist/Page/TextLayer.css'

pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`

interface Props {
  blobUrl: string
}

export default function PdfViewerBase({ blobUrl }: Props) {
  const [numPages, setNumPages] = useState(0)
  const [pageNumber, setPageNumber] = useState(1)
  const [pageWidth, setPageWidth] = useState(0)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!containerRef.current) return
    const el = containerRef.current
    const update = () => setPageWidth(el.clientWidth - 32)
    update()
    const observer = new ResizeObserver(update)
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  return (
    <div ref={containerRef} className="flex flex-col items-center w-full h-full overflow-auto bg-gray-100 py-4">
      <Document
        file={blobUrl}
        onLoadSuccess={({ numPages }) => { setNumPages(numPages); setPageNumber(1) }}
        loading={
          <div className="flex items-center justify-center h-64 gap-2 text-gray-400">
            <Loader2 size={20} className="animate-spin" />
            <span className="text-sm">PDF 로딩 중...</span>
          </div>
        }
        error={
          <div className="flex items-center justify-center h-64 text-red-400 text-sm">
            PDF를 불러올 수 없습니다.
          </div>
        }
      >
        {pageWidth > 0 && (
          <Page
            pageNumber={pageNumber}
            width={pageWidth}
            renderTextLayer
            renderAnnotationLayer
            className="shadow-lg"
          />
        )}
      </Document>

      {numPages > 0 && (
        <div className="flex items-center gap-4 mt-4 mb-2 bg-white rounded-full px-5 py-2 shadow-sm">
          <button
            onClick={() => setPageNumber(p => Math.max(1, p - 1))}
            disabled={pageNumber <= 1}
            className="p-1 text-[#4a5568] disabled:opacity-30"
          >
            <ChevronLeft size={18} />
          </button>
          <span className="text-sm text-[#4a5568] min-w-[60px] text-center">
            {pageNumber} / {numPages}
          </span>
          <button
            onClick={() => setPageNumber(p => Math.min(numPages, p + 1))}
            disabled={pageNumber >= numPages}
            className="p-1 text-[#4a5568] disabled:opacity-30"
          >
            <ChevronRight size={18} />
          </button>
        </div>
      )}
    </div>
  )
}
