'use client'

import { useEffect, useState } from 'react'
import { AlertTriangle, X, Copy, ExternalLink } from 'lucide-react'

function detectInAppBrowser(): boolean {
  if (typeof window === 'undefined') return false
  const ua = navigator.userAgent
  if (/KAKAOTALK|KAKAO|Line\/|FBAN|FBAV|Instagram|NaverApp|Snapchat/i.test(ua)) return true
  if (/iPhone|iPod|iPad/.test(ua) && /WebKit/.test(ua) && !/Safari/.test(ua)) return true
  return false
}

function isAndroid(): boolean {
  return /Android/i.test(navigator.userAgent)
}

export default function InAppBrowserBanner() {
  const [show, setShow] = useState(false)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (detectInAppBrowser()) setShow(true)
  }, [])

  if (!show) return null

  function handleOpenExternal() {
    const url = window.location.href

    if (isAndroid()) {
      // Android: intent:// 스킴으로 기본 브라우저(Chrome 등)에서 강제로 열기
      // S.browser_fallback_url: Chrome 미설치 시 폴백 URL
      const host = url.replace(/^https?:\/\//, '')
      const intentUrl = `intent://${host}#Intent;scheme=https;action=android.intent.action.VIEW;S.browser_fallback_url=${encodeURIComponent(url)};end`
      window.location.href = intentUrl
    } else {
      // iOS: window.open 시도 (동작 안 할 수 있음 → 링크 복사 안내)
      const opened = window.open(url, '_blank')
      if (!opened) handleCopy()
    }
  }

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(window.location.href)
      setCopied(true)
      setTimeout(() => setCopied(false), 2500)
    } catch {
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
