'use client'

import { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import type { VatType } from '@/types'
import { createQuotation, updateQuotation, saveItems, getQuotationWithItems } from '@/lib/quotations'
import QuotationForm, { type QuotationFormState } from '@/components/quotations/QuotationForm'

function today() {
  return new Date().toISOString().slice(0, 10)
}

const INITIAL: QuotationFormState = {
  projectName: '',
  recipient: '',
  quoteDate: today(),
  senderCompany: null,
  senderInfo: null,
  company: null,
  clientInfo: null,
  vatType: 'excluded',
  items: [],
  status: null,
}

function QuotationPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const editId = searchParams.get('id')

  const [formState, setFormState] = useState<QuotationFormState>(INITIAL)
  const [saving, setSaving] = useState(false)
  const [pdfLoading, setPdfLoading] = useState(false)
  const [excelLoading, setExcelLoading] = useState(false)
  const [loading, setLoading] = useState(!!editId)
  const [savedQuotationId, setSavedQuotationId] = useState<string | null>(null)

  useEffect(() => {
    if (!editId) return
    getQuotationWithItems(editId).then(data => {
      if (!data) return
      setFormState({
        projectName: data.project_name ?? '',
        recipient: data.recipient,
        quoteDate: data.quote_date,
        senderCompany: null,
        senderInfo: data.sender_info ?? null,
        company: data.companies ?? null,
        clientInfo: data.client_info ?? null,
        vatType: data.vat_type,
        items: data.items,
        status: data.status,
      })
    }).finally(() => setLoading(false))
  }, [editId])

  async function handleSave(state: QuotationFormState, status: 'draft' | 'saved') {
    setSaving(true)
    try {
      const total = state.items.reduce((s, i) => s + i.total_price, 0)
      const extraFields = {
        total_amount: total,
        vat_type: state.vatType,
        status,
        project_name: state.projectName || null,
        sender_company_id: state.senderCompany?.id ?? null,
        sender_info: state.senderInfo ?? null,
        client_info: state.clientInfo ?? null,
      }

      if (editId) {
        await Promise.all([
          updateQuotation(editId, {
            company_id: state.company?.id ?? null,
            quote_date: state.quoteDate,
            recipient: state.recipient,
            ...extraFields,
          }),
          saveItems(editId, state.items),
        ])
      } else {
        const q = await createQuotation(
          state.company?.id ?? null,
          state.quoteDate,
          state.recipient,
        )
        setSavedQuotationId(q.id)
        await Promise.all([
          updateQuotation(q.id, extraFields),
          saveItems(q.id, state.items),
        ])
      }
    } catch (e: any) {
      alert(e.message ?? '저장 실패')
      throw e
    } finally {
      setSaving(false)
    }
  }

  function handleSaveSuccess(_status: 'draft' | 'saved') {}

  async function handleExcel(state: QuotationFormState) {
    if (!state.items.length) { alert('항목을 먼저 추가해주세요.'); return }
    setExcelLoading(true)
    try {
      const total = state.items.reduce((s, i) => s + i.total_price, 0)
      const res = await fetch('/api/excel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectName: state.projectName,
          quoteDate: state.quoteDate,
          recipient: state.recipient,
          senderInfo: state.senderInfo,
          clientInfo: state.clientInfo,
          items: state.items,
          totalAmount: total,
          vatType: state.vatType,
        }),
      })
      if (!res.ok) throw new Error('엑셀 생성 실패')
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      const dateStr = state.quoteDate.replace(/-/g, '')
      const prefix = state.company?.name ?? state.clientInfo?.name ?? ''
      a.download = prefix ? `${prefix}_견적서(${dateStr}).xlsx` : `견적서(${dateStr}).xlsx`
      a.click()
      URL.revokeObjectURL(url)
    } catch (e: any) {
      alert(e.message ?? '엑셀 생성 실패')
    } finally {
      setExcelLoading(false)
    }
  }

  async function handlePdf(state: QuotationFormState) {
    if (!state.items.length) { alert('항목을 먼저 추가해주세요.'); return }
    setPdfLoading(true)
    try {
      const total = state.items.reduce((s, i) => s + i.total_price, 0)
      const res = await fetch('/api/pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectName: state.projectName,
          quoteDate: state.quoteDate,
          recipient: state.recipient,
          senderInfo: state.senderInfo,
          clientInfo: state.clientInfo,
          items: state.items,
          totalAmount: total,
          vatType: state.vatType,
        }),
      })
      if (!res.ok) throw new Error('PDF 생성 실패')
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      const dateStr = state.quoteDate.replace(/-/g, '')
      const prefix = state.company?.name ?? state.clientInfo?.name ?? ''
      a.download = prefix ? `${prefix}_견적서(${dateStr}).pdf` : `견적서(${dateStr}).pdf`
      a.click()
      URL.revokeObjectURL(url)
    } catch (e: any) {
      alert(e.message ?? 'PDF 생성 실패')
    } finally {
      setPdfLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-400 text-sm">
        불러오는 중...
      </div>
    )
  }

  return (
    <div className="flex flex-col min-h-full">
      <div className="bg-white border-b border-gray-100 px-4 py-4 md:px-8 sticky top-0 z-10">
        <h1 className="text-xl font-bold text-[#1e2a3a]">
          {editId ? '견적서 수정' : '새 견적서'}
        </h1>
      </div>

      <QuotationForm
        initial={formState}
        isEdit={!!editId}
        saving={saving}
        pdfLoading={pdfLoading}
        onSave={handleSave}
        onPdf={handlePdf}
        onExcel={handleExcel}
        excelLoading={excelLoading}
        onSaveSuccess={handleSaveSuccess}
        quotationId={editId ?? savedQuotationId ?? undefined}
      />
    </div>
  )
}

export default function NewQuotationPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center h-64 text-gray-400 text-sm">
        로딩 중...
      </div>
    }>
      <QuotationPage />
    </Suspense>
  )
}
