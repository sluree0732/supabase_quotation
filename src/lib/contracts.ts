import { supabase } from './supabase'
import type { Contract, ContractItem, ContractStatus, VatType } from '@/types'

export async function getContracts(): Promise<Contract[]> {
  const { data, error } = await supabase
    .from('contracts')
    .select('*, companies(name)')
    .order('created_at', { ascending: false })
  if (error) throw new Error(error.message)
  return data ?? []
}

export async function getContractWithItems(id: string) {
  const { data, error } = await supabase
    .from('contracts')
    .select('*, companies(*), contract_items(*)')
    .eq('id', id)
    .single()
  if (error) throw new Error(error.message)
  return {
    ...data,
    items: (data.contract_items ?? []).sort((a: any, b: any) => a.sort_order - b.sort_order),
  }
}

export async function createContract(params: {
  quotation_id: string | null
  company_id: string | null
  contract_date: string
  recipient: string
}): Promise<Contract> {
  const { data, error } = await supabase
    .from('contracts')
    .insert(params)
    .select()
    .single()
  if (error) throw new Error(error.message)
  return data
}

export async function updateContract(id: string, patch: {
  quotation_id?: string | null
  company_id?: string | null
  contract_date?: string
  start_date?: string | null
  end_date?: string | null
  recipient?: string
  total_amount?: number
  vat_type?: VatType
  status?: ContractStatus
  special_terms?: string | null
}) {
  const { error } = await supabase.from('contracts').update(patch).eq('id', id)
  if (error) throw new Error(error.message)
}

export async function saveContractItems(contractId: string, items: ContractItem[]) {
  await supabase.from('contract_items').delete().eq('contract_id', contractId)
  if (!items.length) return
  const rows = items.map((it, i) => ({
    contract_id: contractId,
    sort_order: i,
    category: it.category,
    item_name: it.item_name,
    period: it.period,
    unit_price: it.unit_price,
    total_price: it.total_price,
    note: it.note,
  }))
  const { error } = await supabase.from('contract_items').insert(rows)
  if (error) throw new Error(error.message)
}

export async function deleteContract(id: string) {
  const { error } = await supabase.from('contracts').delete().eq('id', id)
  if (error) throw new Error(error.message)
}

export async function deleteDraftsByQuotationId(quotationId: string, exceptId: string) {
  const { error } = await supabase
    .from('contracts')
    .delete()
    .eq('quotation_id', quotationId)
    .eq('status', 'draft')
    .neq('id', exceptId)
  if (error) throw new Error(error.message)
}
