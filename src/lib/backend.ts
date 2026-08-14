// 백엔드 스위치 — Azure ↔ Supabase 롤백 안전장치
// NEXT_PUBLIC_BACKEND=supabase 로 설정하면 즉시 기존 Supabase 코드로 되돌아감 (재배포만 필요, 코드 수정 불필요)
// 값을 지정하지 않으면 기본값은 'azure' (이관 후 기본 상태)
export const BACKEND = (process.env.NEXT_PUBLIC_BACKEND === 'supabase' ? 'supabase' : 'azure') as
  | 'azure'
  | 'supabase'
