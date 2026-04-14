export function isInAppBrowser(): boolean {
  if (typeof window === 'undefined') return false
  const ua = navigator.userAgent
  if (/KAKAOTALK|KAKAO|Line\/|FBAN|FBAV|Instagram|NaverApp|Snapchat/i.test(ua)) return true
  if (/iPhone|iPod|iPad/.test(ua) && /WebKit/.test(ua) && !/Safari/.test(ua)) return true
  return false
}
