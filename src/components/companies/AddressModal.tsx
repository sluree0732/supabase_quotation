'use client'

import { useEffect, useRef } from 'react'
import { X } from 'lucide-react'

interface AddressModalProps {
  onSelect: (address: string) => void
  onClose: () => void
}

export default function AddressModal({ onSelect, onClose }: AddressModalProps) {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const script = document.createElement('script')
    script.src = '//t1.daumcdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js'
    script.onload = () => {
      if (!containerRef.current) return
      new (window as any).daum.Postcode({
        oncomplete: (data: any) => {
          const address = data.roadAddress || data.jibunAddress
          onSelect(address)
          onClose()
        },
        onresize: (size: any) => {
          if (containerRef.current) {
            containerRef.current.style.height = size.height + 'px'
          }
        },
        width: '100%',
        height: '100%',
      }).embed(containerRef.current)
    }
    document.head.appendChild(script)
    return () => {
      document.head.removeChild(script)
    }
  }, [onSelect, onClose])

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center">
      {/* 배경 */}
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      {/* 모달 */}
      <div className="relative z-10 w-full md:w-[540px] bg-white rounded-t-2xl md:rounded-2xl overflow-hidden shadow-xl">
        {/* 헤더 */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
          <span className="font-semibold text-[#1e2a3a]">주소 검색</span>
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600">
            <X size={20} />
          </button>
        </div>

        {/* 카카오 우편번호 */}
        <div ref={containerRef} className="w-full" style={{ height: 460 }} />
      </div>
    </div>
  )
}
