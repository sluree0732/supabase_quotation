'use client'

import { useEffect, useState } from 'react'
import { AlertTriangle, X, Copy, ExternalLink } from 'lucide-react'

function detectInAppBrowser(): boolean {
  if (typeof window === 'undefined') return false
  const ua = navigator.userAgent
  // KakaoTalk, Facebook, Instagram, Line, Naver 앱 등
  if (/KAKAOTALK|KAKAO|Line\/|FBAN|FBAV|Instagram|NaverApp|Snapchat/i.test(ua)) return true
  // iOS에서 Safari 없이 WebKit만 있는 경우 (일반적인 인앱 브라우저 패턴)
  if (/iPhone|iPod|iPad/.test(ua) && /WebKit/.test(ua) && !/Safari/.test(ua)) return true
  return false
}

export default function InAppBrowserBanner() {
  const [show, setShow] = useState(false)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (detectInAppBrowser()) setShow(true)
  }, [])

  if (!show) return null

  function handleOpenExternal() {
    // _blank 타겟으로 열기 시도 (Android 대부분, iOS 일부 환경에서 동작)
    const opened = window.open(window.location.href, '_blank')
    // 팝업이 차단되거나 실패한 경우 URL 복사로 안내
    if (!opened) handleCopy()
  }

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(window.location.href)
      setCopied(true)
      setTimeout(() => setCopied(false), 2500)
    } catch {
      // clipboard API 미지원 시 수동 선택 가능하도록 prompt 사용
      window.prompt('아래 링크를 복사하세요:', window.location.href)
    }
  }

  return (
    <div className="sticky top-0 z-[70] bg-amber-50 border-b border-amber-200 px-4 py-2.5 flex items-center gap-3">
      <AlertTriangle size={15} className="text-amber-500 shrink-0" />
      <p className="text-xs text-amber-800 flex-1 leading-relaxed">
        파일 다운로드는 <span className="font-semibold">외부 브라우저</span>에서 정상 동작합니다.
      </p>
      <div className="flex items-center gap-1.5 shrink-0">
        <button
          onClick={handleOpenExternal}
          className="flex items-center gap-1 px-2.5 py-1.5 bg-amber-500 text-white text-[11px] font-medium rounded-lg hover:bg-amber-600 transition-colors"
        >
          <ExternalLink size={11} />
          브라우저로 열기
        </button>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1 px-2.5 py-1.5 bg-white border border-amber-300 text-amber-700 text-[11px] font-medium rounded-lg hover:bg-amber-50 transition-colors"
        >
          <Copy size={11} />
          {copied ? '복사됨!' : '링크 복사'}
        </button>
        <button
          onClick={() => setShow(false)}
          className="p-1 text-amber-400 hover:text-amber-600 transition-colors"
        >
          <X size={14} />
        </button>
      </div>
    </div>
  )
}
