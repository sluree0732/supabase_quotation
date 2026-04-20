'use client'

import { useState } from 'react'

const C = {
  blue: '#2980b9',
  green: '#27ae60',
  purple: '#8e44ad',
  orange: '#e67e22',
  dark: '#1e2a3a',
  gray: '#718096',
  light: '#e2e8f0',
  bg: '#f0f4f8',
}

const STEPS = [
  { id: 'overview',   icon: '🏠', title: '전체 메뉴',     color: C.dark,   short: '홈 화면' },
  { id: 'companies',  icon: '🏢', title: '업체 등록',     color: C.blue,   short: '1단계' },
  { id: 'quotations', icon: '📄', title: '견적서 작성',   color: C.green,  short: '2단계' },
  { id: 'contracts',  icon: '✍️', title: '계약서 작성',   color: C.purple, short: '3단계' },
  { id: 'notes',      icon: '📝', title: '비고 관리',     color: C.orange, short: '4단계' },
  { id: 'flow',       icon: '🔄', title: '전체 흐름',     color: '#e74c3c', short: '워크플로우' },
]

const NAV_MAP: Record<string, string> = {
  overview: 'home', companies: 'companies', quotations: 'quotations',
  contracts: 'contracts', notes: 'notes', flow: 'home',
}

// ── Phone Frame ────────────────────────────────────────────
function PhoneFrame({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ width: 300, background: '#fff', borderRadius: 32, border: `2px solid ${C.light}`, boxShadow: '0 20px 60px rgba(0,0,0,0.12)', overflow: 'hidden', flexShrink: 0 }}>
      <div style={{ background: C.dark, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 16px' }}>
        <span style={{ color: 'rgba(255,255,255,0.8)', fontSize: 11 }}>9:41</span>
        <div style={{ display: 'flex', gap: 4 }}>
          <span style={{ color: 'rgba(255,255,255,0.8)', fontSize: 10 }}>●●●</span>
          <span style={{ color: 'rgba(255,255,255,0.8)', fontSize: 10 }}>WiFi</span>
        </div>
      </div>
      {children}
    </div>
  )
}

function BottomNav({ active }: { active: string }) {
  const tabs = [
    { id: 'home', icon: '⌂', label: '홈' },
    { id: 'companies', icon: '🏢', label: '업체' },
    { id: 'quotations', icon: '📄', label: '견적서' },
    { id: 'contracts', icon: '✍️', label: '계약서' },
    { id: 'notes', icon: '📝', label: '비고' },
  ]
  return (
    <div style={{ display: 'flex', borderTop: `1px solid ${C.light}`, background: '#fff' }}>
      {tabs.map(t => (
        <div key={t.id} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '8px 0 10px', color: t.id === active ? C.blue : C.gray }}>
          <span style={{ fontSize: 16 }}>{t.icon}</span>
          <span style={{ fontSize: 10, marginTop: 2, fontWeight: t.id === active ? 700 : 400 }}>{t.label}</span>
        </div>
      ))}
    </div>
  )
}

// ── Mock Pages ─────────────────────────────────────────────
function OverviewMock() {
  const cards = [
    { icon: '🏢', color: C.blue,   label: '업체 등록',   desc: '거래처 정보 관리',       badge: '3개' },
    { icon: '📄', color: C.green,  label: '견적서 작성', desc: '견적서 작성 및 PDF 출력', badge: '임시저장 2건', red: true },
    { icon: '✍️', color: C.purple, label: '계약서 작성', desc: '계약서 작성 및 PDF 출력', badge: null },
    { icon: '📝', color: C.orange, label: '비고 관리',   desc: '비고 템플릿 등록 및 관리',badge: '5개' },
  ]
  return (
    <div style={{ padding: '20px 16px', flex: 1, overflowY: 'auto' }}>
      <div style={{ textAlign: 'center', marginBottom: 20 }}>
        <h2 style={{ fontSize: 18, fontWeight: 800, color: C.dark }}>견적서 / 계약서 관리</h2>
        <p style={{ fontSize: 12, color: C.gray, marginTop: 4 }}>문서 관리 시스템</p>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        {cards.map(card => (
          <div key={card.label} style={{ background: '#fff', borderRadius: 16, border: `2px solid ${C.light}`, padding: '12px 10px', display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ width: 40, height: 40, borderRadius: 12, background: `${card.color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>{card.icon}</div>
              <span style={{ color: C.gray, fontSize: 12 }}>›</span>
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 13, color: C.dark }}>{card.label}</div>
              <div style={{ fontSize: 11, color: C.gray, marginTop: 2 }}>{card.desc}</div>
            </div>
            {card.badge && (
              <span style={{ alignSelf: 'flex-start', fontSize: 10, color: '#fff', background: card.red ? '#e53e3e' : card.color, padding: '2px 8px', borderRadius: 999 }}>{card.badge}</span>
            )}
          </div>
        ))}
      </div>
      <p style={{ textAlign: 'center', fontSize: 11, color: '#a0aec0', marginTop: 16 }}>좌측 메뉴 또는 하단 탭을 선택하세요</p>
    </div>
  )
}

function CompaniesMock() {
  const [showForm, setShowForm] = useState(false)
  const list = ['거래업체 (주)', 'KBS 미디어', '롯데광고']
  return (
    <div style={{ flex: 1, overflowY: 'auto' }}>
      <div style={{ padding: '16px', borderBottom: `1px solid ${C.light}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontWeight: 700, color: C.dark }}>업체 등록</span>
        <button onClick={() => setShowForm(s => !s)} style={{ background: C.blue, color: '#fff', border: 'none', borderRadius: 8, padding: '6px 12px', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
          {showForm ? '← 목록' : '+ 업체 추가'}
        </button>
      </div>
      {!showForm ? (
        <div style={{ padding: 12 }}>
          <div style={{ fontSize: 11, color: C.gray, marginBottom: 8 }}>등록된 업체 {list.length}개</div>
          {list.map((c, i) => (
            <div key={i} style={{ background: '#fff', borderRadius: 12, border: `1px solid ${C.light}`, padding: '12px 14px', marginBottom: 8, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontWeight: 600, fontSize: 13, color: C.dark }}>{c}</div>
                <div style={{ fontSize: 11, color: C.gray, marginTop: 2 }}>사업자등록번호 · 주소 등록됨</div>
              </div>
              <span style={{ fontSize: 11, color: C.blue }}>›</span>
            </div>
          ))}
        </div>
      ) : (
        <div style={{ padding: 14 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: C.dark, marginBottom: 12 }}>새 업체 추가</div>
          {['업체명', '사업자등록번호', '대표자', '주소', '전화번호'].map(label => (
            <div key={label} style={{ marginBottom: 10 }}>
              <div style={{ fontSize: 11, color: C.gray, marginBottom: 4 }}>{label}</div>
              <div style={{ height: 34, borderRadius: 8, border: `1px solid ${C.light}`, background: '#f8fafc' }} />
            </div>
          ))}
          <div style={{ marginBottom: 10 }}>
            <div style={{ fontSize: 11, color: C.gray, marginBottom: 4 }}>업체 유형</div>
            <div style={{ display: 'flex', gap: 8 }}>
              {['공급사(발신)', '광고주(수신)'].map((t, i) => (
                <div key={i} style={{ flex: 1, textAlign: 'center', padding: '7px 0', borderRadius: 8, border: `1px solid ${i === 0 ? C.green : C.light}`, background: i === 0 ? `${C.green}18` : '#fff', fontSize: 11, fontWeight: 600, color: i === 0 ? C.green : C.gray }}>{t}</div>
              ))}
            </div>
          </div>
          <button style={{ width: '100%', background: C.blue, color: '#fff', border: 'none', borderRadius: 10, padding: '10px 0', fontWeight: 700, fontSize: 13 }}>저장</button>
        </div>
      )}
    </div>
  )
}

function QuotationsMock() {
  const [detail, setDetail] = useState(false)
  const list = [
    { name: '2026 상반기 캠페인', company: 'KBS 미디어', amount: '5,500,000', status: '임시저장', statusColor: C.orange },
    { name: '브랜드 마케팅', company: '롯데광고', amount: '12,000,000', status: '저장완료', statusColor: C.green },
  ]
  if (!detail) return (
    <div style={{ flex: 1, overflowY: 'auto' }}>
      <div style={{ padding: '16px', borderBottom: `1px solid ${C.light}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontWeight: 700, color: C.dark }}>견적서</span>
        <button onClick={() => setDetail(true)} style={{ background: C.green, color: '#fff', border: 'none', borderRadius: 8, padding: '6px 12px', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>+ 새 견적서</button>
      </div>
      <div style={{ padding: 12 }}>
        <div style={{ display: 'flex', gap: 6, marginBottom: 10 }}>
          {['전체', '임시저장', '저장완료'].map((t, i) => (
            <div key={i} style={{ padding: '5px 12px', borderRadius: 999, fontSize: 11, fontWeight: i === 0 ? 700 : 400, background: i === 0 ? C.green : '#f1f5f9', color: i === 0 ? '#fff' : C.gray, cursor: 'pointer' }}>{t}</div>
          ))}
        </div>
        {list.map((q, i) => (
          <div key={i} onClick={() => setDetail(true)} style={{ background: '#fff', borderRadius: 12, border: `1px solid ${C.light}`, padding: '12px 14px', marginBottom: 8, cursor: 'pointer' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div style={{ fontWeight: 600, fontSize: 13, color: C.dark }}>{q.name}</div>
              <span style={{ fontSize: 10, color: '#fff', background: q.statusColor, padding: '2px 7px', borderRadius: 999 }}>{q.status}</span>
            </div>
            <div style={{ fontSize: 11, color: C.gray, marginTop: 4 }}>{q.company}</div>
            <div style={{ fontSize: 13, fontWeight: 700, color: C.dark, marginTop: 4 }}>₩{q.amount}</div>
          </div>
        ))}
      </div>
    </div>
  )
  return (
    <div style={{ flex: 1, overflowY: 'auto' }}>
      <div style={{ padding: '12px 14px', borderBottom: `1px solid ${C.light}`, display: 'flex', alignItems: 'center', gap: 8 }}>
        <span onClick={() => setDetail(false)} style={{ cursor: 'pointer', color: C.gray, fontSize: 16 }}>←</span>
        <span style={{ fontWeight: 700, color: C.dark, fontSize: 14 }}>새 견적서 작성</span>
      </div>
      <div style={{ padding: 12, display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div style={{ background: '#fff', borderRadius: 14, border: `1px solid ${C.light}`, overflow: 'hidden' }}>
          <div style={{ padding: '10px 14px', borderBottom: `1px solid #f1f5f9`, fontWeight: 700, fontSize: 12, color: C.dark }}>기본 정보</div>
          <div style={{ padding: 12, display: 'flex', flexDirection: 'column', gap: 9 }}>
            {[['프로젝트명', '2026 상반기 마케팅'], ['견적일', '2026-04-20']].map(([l, v]) => (
              <div key={l}>
                <div style={{ fontSize: 11, color: C.gray, marginBottom: 3 }}>{l}</div>
                <div style={{ height: 33, borderRadius: 8, border: `1px solid ${C.light}`, background: '#f8fafc', display: 'flex', alignItems: 'center', padding: '0 10px', fontSize: 12, color: C.dark }}>{v}</div>
              </div>
            ))}
            <div>
              <div style={{ fontSize: 11, color: C.gray, marginBottom: 3 }}>부가세</div>
              <div style={{ display: 'flex', gap: 6 }}>
                {['별도', '포함', '없음'].map((t, i) => (
                  <div key={i} style={{ flex: 1, textAlign: 'center', padding: '7px 0', borderRadius: 8, border: `1px solid ${i === 0 ? C.blue : C.light}`, background: i === 0 ? C.blue : '#fff', fontSize: 11, fontWeight: 600, color: i === 0 ? '#fff' : C.gray }}>{t}</div>
                ))}
              </div>
            </div>
          </div>
        </div>
        <div style={{ background: C.dark, borderRadius: 14, padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: 11 }}>합계</div>
            <div style={{ color: '#fff', fontWeight: 800, fontSize: 20, marginTop: 2 }}>₩3,000,000</div>
          </div>
          <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: 11 }}>부가세 별도</span>
        </div>
        <button style={{ width: '100%', background: C.green, color: '#fff', border: 'none', borderRadius: 12, padding: '12px 0', fontWeight: 700, fontSize: 13 }}>💾 저장</button>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          <button style={{ padding: '10px 0', borderRadius: 10, background: '#fff', border: `1px solid ${C.light}`, color: '#217346', fontWeight: 600, fontSize: 12 }}>📊 미리보기/다운로드</button>
          <button style={{ padding: '10px 0', borderRadius: 10, background: `${C.purple}20`, border: 'none', color: C.purple, fontWeight: 600, fontSize: 12 }}>✍️ 계약서</button>
        </div>
      </div>
    </div>
  )
}

function ContractsMock() {
  const [detail, setDetail] = useState(false)
  if (!detail) return (
    <div style={{ flex: 1, overflowY: 'auto' }}>
      <div style={{ padding: '16px', borderBottom: `1px solid ${C.light}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontWeight: 700, color: C.dark }}>계약서</span>
        <button onClick={() => setDetail(true)} style={{ background: C.purple, color: '#fff', border: 'none', borderRadius: 8, padding: '6px 12px', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>+ 새 계약서</button>
      </div>
      <div style={{ padding: 12 }}>
        {[
          { name: '브랜드 마케팅 계약', company: '롯데광고', amount: '12,000,000', status: '계약완료', color: C.green },
          { name: '2026 캠페인', company: 'KBS 미디어', amount: '5,500,000', status: '임시저장', color: C.orange },
        ].map((c, i) => (
          <div key={i} onClick={() => setDetail(true)} style={{ background: '#fff', borderRadius: 12, border: `1px solid ${C.light}`, padding: '12px 14px', marginBottom: 8, cursor: 'pointer' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div style={{ fontWeight: 600, fontSize: 13, color: C.dark }}>{c.name}</div>
              <span style={{ fontSize: 10, color: '#fff', background: c.color, padding: '2px 7px', borderRadius: 999 }}>{c.status}</span>
            </div>
            <div style={{ fontSize: 11, color: C.gray, marginTop: 4 }}>{c.company}</div>
            <div style={{ fontSize: 13, fontWeight: 700, color: C.dark, marginTop: 4 }}>₩{c.amount}</div>
          </div>
        ))}
      </div>
    </div>
  )
  return (
    <div style={{ flex: 1, overflowY: 'auto' }}>
      <div style={{ padding: '12px 14px', borderBottom: `1px solid ${C.light}`, display: 'flex', alignItems: 'center', gap: 8 }}>
        <span onClick={() => setDetail(false)} style={{ cursor: 'pointer', color: C.gray, fontSize: 16 }}>←</span>
        <span style={{ fontWeight: 700, color: C.dark, fontSize: 14 }}>계약서 작성</span>
      </div>
      <div style={{ padding: 12, display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div style={{ background: '#fff', borderRadius: 14, border: `1px solid ${C.light}`, overflow: 'hidden' }}>
          <div style={{ padding: '10px 14px', borderBottom: `1px solid #f1f5f9`, fontWeight: 700, fontSize: 12, color: C.dark }}>기본 정보</div>
          <div style={{ padding: 12, display: 'flex', flexDirection: 'column', gap: 9 }}>
            {[['계약일', '2026-04-20'], ['계약 기간 시작', '2026-05-01'], ['계약 기간 종료', '2026-12-31']].map(([l, v]) => (
              <div key={l}>
                <div style={{ fontSize: 11, color: C.gray, marginBottom: 3 }}>{l}</div>
                <div style={{ height: 33, borderRadius: 8, border: `1px solid ${C.light}`, background: '#f8fafc', display: 'flex', alignItems: 'center', padding: '0 10px', fontSize: 12, color: C.dark }}>{v}</div>
              </div>
            ))}
          </div>
        </div>
        <div style={{ background: '#fff', borderRadius: 14, border: `1px solid ${C.light}`, overflow: 'hidden' }}>
          <div style={{ padding: '10px 14px', borderBottom: `1px solid #f1f5f9`, fontWeight: 700, fontSize: 12, color: C.dark }}>계약 조항</div>
          <div style={{ padding: 12 }}>
            {['제1조 계약의 목적', '제2조 계약 금액', '제3조 계약 이행', '제4조 특약 사항'].map((a, i) => (
              <div key={i} style={{ padding: '9px 0', borderBottom: i < 3 ? `1px solid #f1f5f9` : 'none', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 12, color: C.dark }}>{a}</span>
                <span style={{ fontSize: 11, color: C.blue }}>편집 ›</span>
              </div>
            ))}
          </div>
        </div>
        <button style={{ width: '100%', background: C.purple, color: '#fff', border: 'none', borderRadius: 12, padding: '12px 0', fontWeight: 700, fontSize: 13 }}>💾 계약서 저장</button>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          <button style={{ padding: '10px 0', borderRadius: 10, background: '#fff', border: `1px solid ${C.light}`, color: C.purple, fontWeight: 600, fontSize: 12 }}>📄 PDF 미리보기</button>
          <button style={{ padding: '10px 0', borderRadius: 10, background: '#fff', border: `1px solid ${C.light}`, color: '#217346', fontWeight: 600, fontSize: 12 }}>📊 Excel 다운로드</button>
        </div>
      </div>
    </div>
  )
}

function NotesMock() {
  const [showAdd, setShowAdd] = useState(false)
  const templates = [
    { category: '광고기획', title: '기획 범위 명시', content: '본 견적서는 기획, 전략 수립, 크리에이티브 방향 제시가 포함됩니다.' },
    { category: '영상제작', title: '촬영 조건', content: '실내 촬영 기준이며, 야외 촬영 시 별도 협의.' },
    { category: '공통', title: 'VAT 안내', content: '상기 금액은 부가세 별도 금액입니다.' },
  ]
  return (
    <div style={{ flex: 1, overflowY: 'auto' }}>
      <div style={{ padding: '16px', borderBottom: `1px solid ${C.light}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontWeight: 700, color: C.dark }}>비고 템플릿</span>
        <button onClick={() => setShowAdd(true)} style={{ background: C.orange, color: '#fff', border: 'none', borderRadius: 8, padding: '6px 12px', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>+ 템플릿 추가</button>
      </div>
      <div style={{ padding: 12 }}>
        <div style={{ fontSize: 11, color: C.gray, marginBottom: 8 }}>총 {templates.length}개 템플릿</div>
        {templates.map((t, i) => (
          <div key={i} style={{ background: '#fff', borderRadius: 12, border: `1px solid ${C.light}`, padding: '12px 14px', marginBottom: 8 }}>
            <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginBottom: 5 }}>
              <span style={{ fontSize: 10, color: '#fff', background: C.orange, padding: '2px 8px', borderRadius: 999, fontWeight: 600 }}>{t.category}</span>
              <span style={{ fontWeight: 600, fontSize: 13, color: C.dark }}>{t.title}</span>
            </div>
            <div style={{ fontSize: 12, color: C.gray, lineHeight: 1.5 }}>{t.content}</div>
          </div>
        ))}
      </div>
      {showAdd && (
        <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'flex-end', borderRadius: 32 }}>
          <div style={{ background: '#fff', width: '100%', borderRadius: '20px 20px 0 0', padding: 16 }}>
            <div style={{ fontWeight: 700, fontSize: 13, color: C.dark, marginBottom: 12 }}>새 비고 템플릿</div>
            {['카테고리', '제목', '내용'].map((l, i) => (
              <div key={l} style={{ marginBottom: 9 }}>
                <div style={{ fontSize: 11, color: C.gray, marginBottom: 3 }}>{l}</div>
                <div style={{ height: i === 2 ? 60 : 33, borderRadius: 8, border: `1px solid ${C.light}`, background: '#f8fafc' }} />
              </div>
            ))}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 4 }}>
              <button onClick={() => setShowAdd(false)} style={{ padding: '10px 0', borderRadius: 10, background: '#f1f5f9', border: 'none', color: C.gray, fontWeight: 600, fontSize: 12 }}>취소</button>
              <button onClick={() => setShowAdd(false)} style={{ padding: '10px 0', borderRadius: 10, background: C.orange, border: 'none', color: '#fff', fontWeight: 700, fontSize: 12 }}>저장</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function FlowMock() {
  const steps = [
    { num: '1', color: C.blue,   icon: '🏢', title: '업체 등록',    desc: '거래처(공급사/광고주) 사업자 정보를 먼저 등록합니다. 업체 목록에서 선택하면 견적서에 자동으로 채워집니다.' },
    { num: '2', color: C.green,  icon: '📄', title: '견적서 작성',  desc: '프로젝트명, 견적일, 발신/수신 업체를 선택하고 항목을 추가합니다. AI 비고 자동작성도 지원합니다.' },
    { num: '3', color: C.orange, icon: '💾', title: '저장 & 미리보기', desc: '임시저장으로 나중에 이어서 작업하거나, 저장 완료 후 Excel/PDF로 미리보기·다운로드합니다.' },
    { num: '4', color: C.purple, icon: '✍️', title: '계약서 작성',  desc: '저장된 견적서에서 바로 계약서를 작성합니다. 계약 기간, 조항, 특약 사항을 추가 편집합니다.' },
    { num: '5', color: '#e74c3c', icon: '📤', title: '최종 출력',   desc: 'PDF 또는 Excel로 다운로드하여 거래처에 전달합니다. 도장(스탬프)은 자동으로 삽입됩니다.' },
  ]
  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: '16px 14px' }}>
      <div style={{ fontWeight: 800, fontSize: 15, color: C.dark, marginBottom: 4 }}>전체 업무 흐름</div>
      <div style={{ fontSize: 12, color: C.gray, marginBottom: 16 }}>업무 순서에 따라 진행하세요</div>
      <div style={{ position: 'relative' }}>
        <div style={{ position: 'absolute', left: 20, top: 24, width: 2, height: 'calc(100% - 24px)', background: `linear-gradient(to bottom, ${C.blue}, ${C.purple})`, opacity: 0.25, borderRadius: 2 }} />
        {steps.map((s, i) => (
          <div key={i} style={{ display: 'flex', gap: 12, marginBottom: 14, position: 'relative' }}>
            <div style={{ width: 40, height: 40, borderRadius: 999, background: s.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0, zIndex: 1, boxShadow: `0 0 0 4px ${s.color}25` }}>
              {s.icon}
            </div>
            <div style={{ background: '#fff', borderRadius: 14, border: `1px solid ${C.light}`, padding: '10px 12px', flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                <span style={{ fontSize: 10, color: '#fff', background: s.color, padding: '1px 7px', borderRadius: 999, fontWeight: 700 }}>STEP {s.num}</span>
                <span style={{ fontWeight: 700, fontSize: 13, color: C.dark }}>{s.title}</span>
              </div>
              <div style={{ fontSize: 11, color: C.gray, lineHeight: 1.6 }}>{s.desc}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Explain Block ──────────────────────────────────────────
const EXPLAINS: Record<string, { title: string; points: { icon: string; text: string }[] }> = {
  overview: {
    title: '홈 화면 구성',
    points: [
      { icon: '🏢', text: '업체 등록 → 거래처(공급사/광고주) 정보를 등록합니다.' },
      { icon: '📄', text: '견적서 작성 → 프로젝트별 견적서를 작성하고 PDF/Excel로 출력합니다.' },
      { icon: '✍️', text: '계약서 작성 → 견적서 기반으로 계약서를 작성합니다.' },
      { icon: '📝', text: '비고 관리 → 자주 쓰는 비고 문구를 템플릿으로 저장합니다.' },
      { icon: '💡', text: '빨간 뱃지는 임시저장된 문서가 있다는 알림입니다.' },
    ],
  },
  companies: {
    title: '업체 등록 방법',
    points: [
      { icon: '➕', text: '우측 상단 "+ 업체 추가" 버튼을 눌러 새 거래처를 등록합니다.' },
      { icon: '🏷️', text: '업체 유형을 "공급사(발신)" 또는 "광고주(수신)"으로 구분합니다.' },
      { icon: '📷', text: 'OCR 기능으로 명함을 촬영하면 정보가 자동으로 입력됩니다.' },
      { icon: '🖋', text: '도장(스탬프) 이미지를 등록하면 PDF 출력 시 자동 삽입됩니다.' },
      { icon: '👤', text: '담당자 연락처를 여러 명 등록할 수 있습니다.' },
    ],
  },
  quotations: {
    title: '견적서 작성 방법',
    points: [
      { icon: '1️⃣', text: '프로젝트명과 견적일을 입력합니다.' },
      { icon: '2️⃣', text: '발신(공급사) 업체와 수신(광고주) 업체를 선택합니다.' },
      { icon: '3️⃣', text: '"+ 항목 추가"로 견적 항목(카테고리, 항목명, 단가 등)을 추가합니다.' },
      { icon: '✨', text: 'AI 버튼을 누르면 비고가 자동으로 작성됩니다.' },
      { icon: '💾', text: '임시저장으로 중간 저장, 저장 완료 후 PDF/Excel 출력 가능합니다.' },
    ],
  },
  contracts: {
    title: '계약서 작성 방법',
    points: [
      { icon: '📋', text: '견적서 화면에서 "계약서" 버튼을 눌러 바로 계약서를 작성합니다.' },
      { icon: '📅', text: '계약 기간(시작일~종료일)과 담당자 정보를 입력합니다.' },
      { icon: '📑', text: '계약 조항 템플릿을 선택하고 각 조항 내용을 편집합니다.' },
      { icon: '✏️', text: '특약 사항을 별도로 입력할 수 있습니다.' },
      { icon: '📤', text: '계약완료 상태로 저장 후 PDF/Excel로 출력합니다.' },
    ],
  },
  notes: {
    title: '비고 템플릿 관리',
    points: [
      { icon: '➕', text: '"+ 템플릿 추가"로 자주 쓰는 비고 문구를 카테고리별로 등록합니다.' },
      { icon: '⚡', text: '견적서 항목 입력 시 저장된 템플릿을 선택해 빠르게 입력합니다.' },
      { icon: '🗂️', text: '카테고리별로 분류하여 원하는 문구를 쉽게 찾을 수 있습니다.' },
      { icon: '✏️', text: '등록된 템플릿은 언제든지 수정·삭제 가능합니다.' },
    ],
  },
  flow: {
    title: '전체 업무 순서',
    points: [
      { icon: '🏢', text: 'STEP 1 → 거래처 업체 정보를 먼저 등록합니다.' },
      { icon: '📄', text: 'STEP 2 → 프로젝트별 견적서를 작성하고 저장합니다.' },
      { icon: '📊', text: 'STEP 3 → Excel 미리보기로 확인 후 PDF/Excel 다운로드합니다.' },
      { icon: '✍️', text: 'STEP 4 → 견적서에서 계약서를 바로 작성·편집합니다.' },
      { icon: '📤', text: 'STEP 5 → 최종 PDF를 다운로드해 거래처에 전달합니다.' },
    ],
  },
}

const PAGE_COMPONENTS: Record<string, React.FC> = {
  overview:   OverviewMock,
  companies:  CompaniesMock,
  quotations: QuotationsMock,
  contracts:  ContractsMock,
  notes:      NotesMock,
  flow:       FlowMock,
}

// ── Main Page ──────────────────────────────────────────────
export default function GuidePage() {
  const [active, setActive] = useState(0)
  const step = STEPS[active]
  const PageMock = PAGE_COMPONENTS[step.id]
  const explain = EXPLAINS[step.id]

  return (
    <div className="flex min-h-screen" style={{ background: C.bg, fontFamily: "'Pretendard', 'Apple SD Gothic Neo', 'Malgun Gothic', sans-serif" }}>

      {/* ── Left Sidebar ── */}
      <aside className="hidden md:flex flex-col" style={{ width: 280, background: '#fff', borderRight: `1px solid ${C.light}`, height: '100vh', position: 'sticky', top: 0, flexShrink: 0 }}>
        <div style={{ padding: '24px 20px 16px', borderBottom: `1px solid ${C.light}` }}>
          <div style={{ fontSize: 11, color: C.gray, fontWeight: 600, letterSpacing: '0.05em', marginBottom: 8 }}>사용법 가이드</div>
          <h1 style={{ fontSize: 17, fontWeight: 800, color: C.dark, lineHeight: 1.4 }}>견적서 / 계약서<br/>관리 시스템</h1>
        </div>
        <nav style={{ flex: 1, overflowY: 'auto', padding: '12px' }}>
          {STEPS.map((s, i) => (
            <button key={s.id} onClick={() => setActive(i)} style={{
              width: '100%', display: 'flex', alignItems: 'center', gap: 12,
              padding: '11px 12px', borderRadius: 12, border: 'none',
              background: active === i ? `${s.color}12` : 'transparent',
              cursor: 'pointer', textAlign: 'left', marginBottom: 4,
              outline: active === i ? `2px solid ${s.color}40` : 'none',
              transition: 'all 0.15s',
            }}>
              <span style={{ width: 36, height: 36, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, background: active === i ? s.color : '#f1f5f9', flexShrink: 0 }}>{s.icon}</span>
              <div>
                <div style={{ fontSize: 11, color: active === i ? s.color : C.gray, fontWeight: 600 }}>{s.short}</div>
                <div style={{ fontSize: 13, fontWeight: 700, color: active === i ? C.dark : '#4a5568' }}>{s.title}</div>
              </div>
              {active === i && <span style={{ marginLeft: 'auto', color: s.color }}>›</span>}
            </button>
          ))}
        </nav>
        <div style={{ padding: '14px 16px', borderTop: `1px solid ${C.light}`, background: '#fafafa' }}>
          <div style={{ fontSize: 11, color: C.gray, lineHeight: 1.7 }}>
            📱 <strong>모바일에서도</strong> 동일하게 사용 가능합니다.<br/>
            하단 탭 바로 빠르게 이동하세요.
          </div>
        </div>
      </aside>

      {/* ── Main Content ── */}
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '32px 20px', overflowY: 'auto' }}>

        {/* Mobile step tabs */}
        <div className="flex md:hidden gap-2 w-full overflow-x-auto pb-2 mb-6" style={{ scrollbarWidth: 'none' }}>
          {STEPS.map((s, i) => (
            <button key={s.id} onClick={() => setActive(i)} style={{
              flexShrink: 0, display: 'flex', alignItems: 'center', gap: 6,
              padding: '7px 14px', borderRadius: 999, border: 'none',
              background: active === i ? s.color : '#fff',
              color: active === i ? '#fff' : C.gray,
              fontWeight: active === i ? 700 : 400, fontSize: 12,
              boxShadow: active === i ? `0 2px 10px ${s.color}40` : '0 1px 4px rgba(0,0,0,0.06)',
              cursor: 'pointer',
            }}>
              <span>{s.icon}</span> {s.title}
            </button>
          ))}
        </div>

        {/* Header */}
        <div style={{ width: '100%', maxWidth: 720, marginBottom: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ width: 52, height: 52, borderRadius: 16, background: step.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26, boxShadow: `0 4px 20px ${step.color}40`, flexShrink: 0 }}>
              {step.icon}
            </div>
            <div>
              <div style={{ fontSize: 12, color: step.color, fontWeight: 700 }}>{step.short}</div>
              <h2 style={{ fontSize: 22, fontWeight: 800, color: C.dark }}>{step.title}</h2>
            </div>
          </div>
        </div>

        {/* Phone + Explain */}
        <div style={{ width: '100%', maxWidth: 720, display: 'flex', gap: 28, alignItems: 'flex-start', flexWrap: 'wrap' }}>

          {/* Phone mockup */}
          <div style={{ position: 'relative', flexShrink: 0 }}>
            <PhoneFrame>
              <div style={{ display: 'flex', flexDirection: 'column', height: 540, position: 'relative' }}>
                <PageMock />
                <BottomNav active={NAV_MAP[step.id]} />
              </div>
            </PhoneFrame>
            <div style={{ position: 'absolute', bottom: -20, left: '50%', transform: 'translateX(-50%)', width: 180, height: 28, background: step.color, filter: 'blur(22px)', opacity: 0.18, borderRadius: 999 }} />
          </div>

          {/* Explanation */}
          <div style={{ flex: 1, minWidth: 200 }}>
            <h3 style={{ fontSize: 16, fontWeight: 800, color: C.dark, marginBottom: 14 }}>{explain.title}</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
              {explain.points.map((p, i) => (
                <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', padding: '10px 12px', background: '#fff', borderRadius: 12, border: `1px solid ${C.light}` }}>
                  <span style={{ fontSize: 18, flexShrink: 0, marginTop: 1 }}>{p.icon}</span>
                  <span style={{ fontSize: 13, color: '#2d3748', lineHeight: 1.6 }}>{p.text}</span>
                </div>
              ))}
            </div>

            {/* Nav arrows */}
            <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
              {active > 0 && (
                <button onClick={() => setActive(a => a - 1)} style={{ flex: 1, padding: '10px 0', borderRadius: 10, border: `1px solid ${C.light}`, background: '#fff', color: C.gray, fontWeight: 600, fontSize: 13, cursor: 'pointer' }}>
                  ← 이전
                </button>
              )}
              {active < STEPS.length - 1 && (
                <button onClick={() => setActive(a => a + 1)} style={{ flex: 2, padding: '10px 0', borderRadius: 10, border: 'none', background: step.color, color: '#fff', fontWeight: 700, fontSize: 13, cursor: 'pointer', boxShadow: `0 4px 14px ${step.color}40` }}>
                  다음 →
                </button>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
