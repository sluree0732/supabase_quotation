import { supabase } from './supabase'
import type { Quotation, QuotationItem, QuotationWithItems, VatType } from '@/types'

// ── 견적서 ────────────────────────────────────────────────

export async function createQuotation(
  companyId: string | null,
  quoteDate: string,
  recipient: string,
): Promise<Quotation> {
  const { data, error } = await supabase
    .from('quotations')
    .insert({ company_id: companyId, quote_date: quoteDate, recipient, status: 'draft' })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function updateQuotation(
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
  const { data, error } = await supabase
    .from('quotations')
    .update(fields)
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function getDraftQuotations(): Promise<Quotation[]> {
  const { data, error } = await supabase
    .from('quotations')
    .select('*, companies!company_id(name)')
    .eq('status', 'draft')
    .order('created_at', { ascending: false })
  if (error) throw error
  return data
}

export async function getAllQuotations(): Promise<Quotation[]> {
  const { data, error } = await supabase
    .from('quotations')
    .select('*, companies!company_id(name)')
    .order('created_at', { ascending: false })
  if (error) throw error
  return data
}

export async function getQuotationWithItems(id: string): Promise<QuotationWithItems | null> {
  const [{ data: q, error: qErr }, { data: items, error: iErr }] = await Promise.all([
    supabase.from('quotations').select('*, companies!company_id(*)').eq('id', id).single(),
    supabase.from('quotation_items').select('*').eq('quotation_id', id).order('sort_order'),
  ])
  if (qErr || !q) return null
  if (iErr) throw iErr
  return { ...q, items: items ?? [] }
}

export async function deleteQuotation(id: string): Promise<void> {
  const { error } = await supabase.from('quotations').delete().eq('id', id)
  if (error) throw error
}

// ── 견적 항목 ─────────────────────────────────────────────

export async function saveItems(quotationId: string, items: QuotationItem[]): Promise<void> {
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
