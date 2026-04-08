'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Suspense } from 'react'
import type { Company, QuotationItem, VatType } from '@/types'
import {
  createQuotation, updateQuotation, saveItems, getQuotationWithItems,
} from '@/lib/quotations'
import Step1BasicInfo from '@/components/quotations/Step1BasicInfo'
import Step2Items from '@/components/quotations/Step2Items'
import Step3Review from '@/components/quotations/Step3Review'

// 오늘 날짜 YYYY-MM-DD
function today() {
  return new Date().toISOString().slice(0, 10)
}

interface WizardState {
  recipient: string
  quoteDate: string
  company: Company | null
  vatType: VatType
}

function QuotationWizard() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const editId = searchParams.get('id')

  const [step, setStep] = useState<1 | 2 | 3>(1)
  const [quotationId, setQuotationId] = useState<string | null>(editId)
  const [info, setInfo] = useState<WizardState>({
    recipient: '',
    quoteDate: today(),
    company: null,
    vatType: 'excluded',
  })
  const [items, setItems] = useState<QuotationItem[]>([])
  const [step1Loading, setStep1Loading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [initLoading, setInitLoading] = useState(!!editId)

  // 편집 모드: 기존 데이터 로드
  useEffect(() => {
    if (!editId) return
    getQuotationWithItems(editId).then(data => {
      if (!data) return
      setInfo({
        recipient: data.recipient,
        quoteDate: data.quote_date,
        company: data.companies ?? null,
        vatType: data.vat_type,
      })
      setItems(data.items)
    }).finally(() => setInitLoading(false))
  }, [editId])

  // Step1 → Step2: quotation 생성 또는 업데이트
  async function handleStep1Next() {
    setStep1Loading(true)
    try {
      if (!quotationId) {
        const q = await createQuotation(
          info.company?.id ?? null,
          info.quoteDate,
          info.recipient,
        )
        setQuotationId(q.id)
      } else {
        await updateQuotation(quotationId, {
          company_id: info.company?.id ?? null,
          quote_date: info.quoteDate,
          recipient: info.recipient,
        })
      }
      setStep(2)
    } catch (e: any) {
      alert(e.message ?? '오류 발생')
    } finally {
      setStep1Loading(false)
    }
  }

  // 공통 저장
  async function persist(status: 'draft' | 'saved') {
    if (!quotationId) return
    setSaving(true)
    try {
      const total = items.reduce((s, i) => s + i.total_price, 0)
      await Promise.all([
        updateQuotation(quotationId, { total_amount: total, vat_type: info.vatType, status }),
        saveItems(quotationId, items),
      ])
      router.push('/quotations')
    } catch (e: any) {
      alert(e.message ?? '저장 실패')
    } finally {
      setSaving(false)
    }
  }

  if (initLoading) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-400 text-sm">
        불러오는 중...
      </div>
    )
  }

  const STEPS = ['기본 정보', '항목 입력', '확인 및 저장']

  return (
    <div className="flex flex-col min-h-full">
      {/* 헤더 + 스텝 인디케이터 */}
      <div className="bg-white border-b border-gray-100 px-4 py-4 md:px-8">
        <h1 className="text-xl font-bold text-[#1e2a3a] mb-3">
          {editId ? '견적서 수정' : '새 견적서'}
        </h1>
        {/* 스텝 바 */}
        <div className="flex items-center gap-0">
          {STEPS.map((label, i) => {
            const n = i + 1
            const isActive = step === n
            const isDone = step > n
            return (
              <div key={i} className="flex items-center flex-1 last:flex-none">
                <div className="flex flex-col items-center gap-1">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                    isDone ? 'bg-[#27ae60] text-white'
                    : isActive ? 'bg-[#2980b9] text-white'
                    : 'bg-gray-100 text-gray-400'
                  }`}>
                    {isDone ? '✓' : n}
                  </div>
                  <span className={`text-[10px] whitespace-nowrap ${isActive ? 'text-[#2980b9] font-semibold' : 'text-gray-400'}`}>
                    {label}
                  </span>
                </div>
                {i < STEPS.length - 1 && (
                  <div className={`flex-1 h-0.5 mx-1 mb-4 ${isDone ? 'bg-[#27ae60]' : 'bg-gray-100'}`} />
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* 스텝 컨텐츠 */}
      <div className="flex-1 overflow-y-auto">
        {step === 1 && (
          <Step1BasicInfo
            state={info}
            onChange={setInfo}
            onNext={handleStep1Next}
            loading={step1Loading}
          />
        )}
        {step === 2 && (
          <Step2Items
            items={items}
            onChange={setItems}
            onNext={() => setStep(3)}
            onBack={() => setStep(1)}
          />
        )}
        {step === 3 && (
          <Step3Review
            recipient={info.recipient}
            quoteDate={info.quoteDate}
            company={info.company}
            vatType={info.vatType}
            items={items}
            onBack={() => setStep(2)}
            onSaveDraft={() => persist('draft')}
            onSave={() => persist('saved')}
            saving={saving}
          />
        )}
      </div>
    </div>
  )
}

export default function NewQuotationPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center h-64 text-gray-400 text-sm">로딩 중...</div>}>
      <QuotationWizard />
    </Suspense>
  )
}
