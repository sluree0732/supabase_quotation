'use client'

import { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import type { VatType } from '@/types'
import { createQuotation, updateQuotation, saveItems, getQuotationWithItems } from '@/lib/quotations'
import { getCompany } from '@/lib/companies'
import QuotationForm, { type QuotationFormState } from '@/components/quotations/QuotationForm'
import type { ItemPrefill } from '@/components/quotations/ItemModal'

function today() {
  return new Date().toISOString().slice(0, 10)
}

const INITIAL: QuotationFormState = {
  projectName: '',
  recipient: '',
  quoteDate: today(),
  senderCompany: null,
  senderCompanyId: null,
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
  const [loading, setLoading] = useState(!!editId)
  const [savedQuotationId, setSavedQuotationId] = useState<string | null>(null)
  const [itemPrefill, setItemPrefill] = useState<ItemPrefill | undefined>(undefined)

  useEffect(() => {
    if (!editId) {
      const raw = sessionStorage.getItem('note_prefill')
      if (raw) {
        try { setItemPrefill(JSON.parse(raw)) } catch {}
        sessionStorage.removeItem('note_prefill')
      }
      setFormState({ ...INITIAL, quoteDate: today() })
      setSavedQuotationId(null)
      setLoading(false)
      return
    }
    setLoading(true)
    getQuotationWithItems(editId).then(async data => {
      if (!data) return
      const senderCompanyId = data.sender_company_id ?? null
      const senderCompany = senderCompanyId ? await getCompany(senderCompanyId) : null
      setFormState({
        projectName: data.project_name ?? '',
        recipient: data.recipient,
        quoteDate: data.quote_date,
        senderCompany,
        senderCompanyId,
        senderInfo: data.sender_info ?? null,
        company: data.companies ?? null,
        clientInfo: data.client_info ?? null,
        vatType: data.vat_type,
        items: data.items,
        status: data.status,
      })
    }).finally(() => setLoading(false))
  }, [editId])

  async function handleSave(state: QuotationFormState, status: 'draft' | 'saved', silent = false) {
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

      const existingId = editId ?? savedQuotationId
      if (existingId) {
        await Promise.all([
          updateQuotation(existingId, {
            company_id: state.company?.id ?? null,
            quote_date: state.quoteDate,
            recipient: state.recipient,
            ...extraFields,
          }),
          saveItems(existingId, state.items),
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
      if (!silent) alert(e.message ?? '저장 실패')
      throw e
    } finally {
      setSaving(false)
    }
  }

  function handleSaveSuccess(_status: 'draft' | 'saved') {}

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
        onSave={handleSave}
        onSaveSuccess={handleSaveSuccess}
        quotationId={editId ?? savedQuotationId ?? undefined}
        itemPrefill={itemPrefill}
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
