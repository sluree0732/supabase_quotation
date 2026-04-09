'use client'

import { useEffect, useRef, useState } from 'react'
import { X, MapPin } from 'lucide-react'

interface AddressModalProps {
  onSelect: (address: string) => void
  onClose: () => void
}

export default function AddressModal({ onSelect, onClose }: AddressModalProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [roadAddress, setRoadAddress] = useState<string | null>(null)
  const [detail, setDetail] = useState('')

  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [])

  useEffect(() => {
    if (roadAddress !== null) return // 주소 선택 후에는 스크립트 재실행 불필요
    const script = document.createElement('script')
    script.src = '//t1.daumcdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js'
    script.onload = () => {
      if (!containerRef.current) return
      new (window as any).daum.Postcode({
        oncomplete: (data: any) => {
          setRoadAddress(data.roadAddress || data.jibunAddress)
        },
        width: '100%',
        height: '100%',
      }).embed(containerRef.current)
    }
    document.head.appendChild(script)
    return () => {
      if (document.head.contains(script)) document.head.removeChild(script)
    }
  }, [roadAddress])

  function handleConfirm() {
    if (!roadAddress) return
    const full = detail.trim() ? `${roadAddress} ${detail.trim()}` : roadAddress
    onSelect(full)
    onClose()
  }

  // ── 세부주소 입력 단계 ──────────────────────────────
  if (roadAddress !== null) {
    return (
      <div className="fixed inset-0 z-[70] flex items-end md:items-center justify-center">
        <div className="absolute inset-0 bg-black/50" onClick={onClose} />
        <div
          className="relative z-10 w-full md:w-[540px] bg-white rounded-t-2xl md:rounded-2xl shadow-xl flex flex-col"
          onTouchMove={e => e.stopPropagation()}
        >
          {/* 핸들 (모바일) */}
          <div className="md:hidden flex justify-center pt-3 pb-1">
            <div className="w-10 h-1 bg-gray-300 rounded-full" />
          </div>

          {/* 헤더 */}
          <div className="flex items-center justify-between px-4 py-4 border-b border-gray-100 shrink-0">
            <span className="font-semibold text-[#1e2a3a]">세부 주소 입력</span>
            <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600">
              <X size={20} />
            </button>
          </div>

          {/* 선택된 기본 주소 */}
          <div className="px-5 py-4 space-y-4">
            <div className="bg-[#f0f7fd] rounded-xl px-4 py-3 flex items-start gap-2">
              <MapPin size={15} className="text-[#2980b9] mt-0.5 shrink-0" />
              <p className="text-sm text-[#1e2a3a] font-medium">{roadAddress}</p>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-[#4a5568]">
                세부 주소 <span className="text-gray-400 font-normal">(동, 호수 등 선택입력)</span>
              </label>
              <input
                type="text"
                value={detail}
                onChange={e => setDetail(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleConfirm()}
                placeholder="예: A동 101호, 3층"
                className="input-base"
                autoFocus
              />
            </div>
          </div>

          {/* 버튼 */}
          <div className="px-5 py-4 border-t border-gray-100 flex gap-2 shrink-0">
            <button
              onClick={() => setRoadAddress(null)}
              className="py-3 px-4 rounded-xl bg-gray-100 text-[#4a5568] text-sm font-medium"
            >
              재검색
            </button>
            <button
              onClick={handleConfirm}
              className="flex-1 py-3 rounded-xl bg-[#2980b9] text-white font-semibold text-sm"
            >
              확인
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ── 카카오 주소 검색 단계 ───────────────────────────
  return (
    <div className="fixed inset-0 z-[70] flex items-end md:items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div
        className="relative z-10 w-full md:w-[540px] bg-white rounded-t-2xl md:rounded-2xl overflow-hidden shadow-xl flex flex-col"
        style={{ height: 'min(560px, calc(100dvh - 3.5rem))' }}
        onTouchMove={e => e.stopPropagation()}
      >
        {/* 헤더 */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 shrink-0">
          <span className="font-semibold text-[#1e2a3a]">주소 검색</span>
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600">
            <X size={20} />
          </button>
        </div>

        {/* 카카오 우편번호 */}
        <div ref={containerRef} className="w-full flex-1 overflow-hidden" />
      </div>
    </div>
  )
}
