import { supabase } from './supabase'
import { BACKEND } from './backend'
import type { Quotation, QuotationItem, QuotationWithItems, VatType } from '@/types'

// ════════════════════════════════════════════════════════════
// Supabase 구현 (롤백용 — NEXT_PUBLIC_BACKEND=supabase 로 활성화)
// ════════════════════════════════════════════════════════════

async function createQuotationSupabase(
  companyId: string | null, quoteDate: string, recipient: string,
): Promise<Quotation> {
  const { data, error } = await supabase
    .from('quotations')
    .insert({ company_id: companyId, quote_date: quoteDate, recipient, status: 'draft' })
    .select()
    .single()
  if (error) throw error
  return data
}

async function updateQuotationSupabase(id: string, fields: Record<string, unknown>): Promise<Quotation> {
  const { data, error } = await supabase
    .from('quotations')
    .update(fields)
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data
}

async function getDraftQuotationsSupabase(): Promise<Quotation[]> {
  const { data, error } = await supabase
    .from('quotations')
    .select('*, companies!company_id(name)')
    .eq('status', 'draft')
    .order('created_at', { ascending: false })
  if (error) throw error
  return data
}

async function getAllQuotationsSupabase(): Promise<Quotation[]> {
  const { data, error } = await supabase
    .from('quotations')
    .select('*, companies!company_id(name)')
    .order('created_at', { ascending: false })
  if (error) throw error
  return data
}

async function getQuotationWithItemsSupabase(id: string): Promise<QuotationWithItems | null> {
  const [{ data: q, error: qErr }, { data: items, error: iErr }] = await Promise.all([
    supabase.from('quotations').select('*, companies!company_id(*)').eq('id', id).single(),
    supabase.from('quotation_items').select('*').eq('quotation_id', id).order('sort_order'),
  ])
  if (qErr || !q) return null
  if (iErr) throw iErr
  return { ...q, items: items ?? [] }
}

async function deleteQuotationSupabase(id: string): Promise<void> {
  const { error } = await supabase.from('quotations').delete().eq('id', id)
  if (error) throw error
}

async function saveItemsSupabase(quotationId: string, items: QuotationItem[]): Promise<void> {
  await supabase.from('quotation_items').delete().eq('quotation_id', quotationId)
  if (!items.length) return
  const rows = items.map((item, i) => ({
    quotation_id: quotationId,
    sort_order: i,
    category: item.category,
    sub_category: item.sub_category ?? '',
    item_name: item.item_name,
    period: item.period,
    unit_price: item.unit_price,
    total_price: item.total_price,
    note: item.note,
  }))
  const { error } = await supabase.from('quotation_items').insert(rows)
  if (error) throw error
}

// ════════════════════════════════════════════════════════════
// Azure 구현 (기본값 — Next.js API Route + Azure PostgreSQL)
// ════════════════════════════════════════════════════════════

async function createQuotationAzure(
  companyId: string | null, quoteDate: string, recipient: string,
): Promise<Quotation> {
  const res = await fetch('/api/quotations', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ companyId, quoteDate, recipient }),
  })
  if (!res.ok) throw new Error('견적서 생성 실패')
  return res.json()
}

async function updateQuotationAzure(id: string, fields: Record<string, unknown>): Promise<Quotation> {
  const res = await fetch(`/api/quotations/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(fields),
  })
  if (!res.ok) throw new Error('견적서 수정 실패')
  return res.json()
}

async function getDraftQuotationsAzure(): Promise<Quotation[]> {
  const res = await fetch('/api/quotations?status=draft')
  if (!res.ok) throw new Error('임시저장 견적서 조회 실패')
  return res.json()
}

async function getAllQuotationsAzure(): Promise<Quotation[]> {
  const res = await fetch('/api/quotations')
  if (!res.ok) throw new Error('견적서 목록 조회 실패')
  return res.json()
}

async function getQuotationWithItemsAzure(id: string): Promise<QuotationWithItems | null> {
  const res = await fetch(`/api/quotations/${id}`)
  if (res.status === 404) return null
  if (!res.ok) throw new Error('견적서 조회 실패')
  return res.json()
}

async function deleteQuotationAzure(id: string): Promise<void> {
  const res = await fetch(`/api/quotations/${id}`, { method: 'DELETE' })
  if (!res.ok) throw new Error('견적서 삭제 실패')
}

async function saveItemsAzure(quotationId: string, items: QuotationItem[]): Promise<void> {
  const res = await fetch(`/api/quotations/${quotationId}/items`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(items),
  })
  if (!res.ok) throw new Error('견적 품목 저장 실패')
}

// ════════════════════════════════════════════════════════════
// 공개 API — BACKEND 값에 따라 분기 (함수 시그니처는 호출부 영향 없도록 그대로 유지)
// ════════════════════════════════════════════════════════════

export function createQuotation(companyId: string | null, quoteDate: string, recipient: string = ''): Promise<Quotation> {
  return BACKEND === 'supabase'
    ? createQuotationSupabase(companyId, quoteDate, recipient)
    : createQuotationAzure(companyId, quoteDate, recipient)
}

export function updateQuotation(
  id: string,
  fields: {
    total_amount?: number
    vat_type?: VatType
    status?: string
    recipient?: string
    quote_date?: string
    company_id?: string | null
    period?: number
    project_name?: string | null
    sender_company_id?: string | null
    sender_info?: object | null
    client_info?: object | null
  },
): Promise<Quotation> {
  return BACKEND === 'supabase' ? updateQuotationSupabase(id, fields) : updateQuotationAzure(id, fields)
}

export function getDraftQuotations(): Promise<Quotation[]> {
  return BACKEND === 'supabase' ? getDraftQuotationsSupabase() : getDraftQuotationsAzure()
}

export function getAllQuotations(): Promise<Quotation[]> {
  return BACKEND === 'supabase' ? getAllQuotationsSupabase() : getAllQuotationsAzure()
}

export function getQuotationWithItems(id: string): Promise<QuotationWithItems | null> {
  return BACKEND === 'supabase' ? getQuotationWithItemsSupabase(id) : getQuotationWithItemsAzure(id)
}

export function deleteQuotation(id: string): Promise<void> {
  return BACKEND === 'supabase' ? deleteQuotationSupabase(id) : deleteQuotationAzure(id)
}

export function saveItems(quotationId: string, items: QuotationItem[]): Promise<void> {
  return BACKEND === 'supabase' ? saveItemsSupabase(quotationId, items) : saveItemsAzure(quotationId, items)
}
