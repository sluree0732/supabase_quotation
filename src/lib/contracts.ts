import { supabase } from './supabase'
import { BACKEND } from './backend'
import type { Contract, ContractItem, ContractStatus, VatType } from '@/types'

// ════════════════════════════════════════════════════════════
// Supabase 구현 (롤백용)
// ════════════════════════════════════════════════════════════

async function getContractsSupabase(): Promise<Contract[]> {
  const { data, error } = await supabase
    .from('contracts').select('*, companies!company_id(name)').order('created_at', { ascending: false })
  if (error) throw new Error(error.message)
  return data ?? []
}

async function getContractWithItemsSupabase(id: string) {
  const { data, error } = await supabase
    .from('contracts').select('*, companies!company_id(*), contract_items(*)').eq('id', id).single()
  if (error) throw new Error(error.message)
  return { ...data, items: (data.contract_items ?? []).sort((a: any, b: any) => a.sort_order - b.sort_order) }
}

async function createContractSupabase(params: {
  quotation_id: string | null; company_id: string | null; sender_company_id?: string | null
  contract_date: string; recipient: string
}): Promise<Contract> {
  const { data, error } = await supabase.from('contracts').insert(params).select().single()
  if (error) throw new Error(error.message)
  return data
}

async function updateContractSupabase(id: string, patch: Record<string, unknown>) {
  const { error } = await supabase.from('contracts').update(patch).eq('id', id)
  if (error) throw new Error(error.message)
}

async function saveContractItemsSupabase(contractId: string, items: ContractItem[]) {
  await supabase.from('contract_items').delete().eq('contract_id', contractId)
  if (!items.length) return
  const rows = items.map((it, i) => ({
    contract_id: contractId, sort_order: i, category: it.category, sub_category: it.sub_category ?? '',
    item_name: it.item_name, period: it.period, unit_price: it.unit_price, total_price: it.total_price, note: it.note,
  }))
  const { error } = await supabase.from('contract_items').insert(rows)
  if (error) throw new Error(error.message)
}

async function deleteContractSupabase(id: string) {
  const { error } = await supabase.from('contracts').delete().eq('id', id)
  if (error) throw new Error(error.message)
}

async function deleteDraftsByQuotationIdSupabase(quotationId: string, exceptId: string) {
  const { error } = await supabase
    .from('contracts').delete().eq('quotation_id', quotationId).eq('status', 'draft').neq('id', exceptId)
  if (error) throw new Error(error.message)
}

// ════════════════════════════════════════════════════════════
// Azure 구현 (기본값)
// ════════════════════════════════════════════════════════════

async function getContractsAzure(): Promise<Contract[]> {
  const res = await fetch('/api/contracts')
  if (!res.ok) throw new Error('계약서 목록 조회 실패')
  return res.json()
}

async function getContractWithItemsAzure(id: string) {
  const res = await fetch(`/api/contracts/${id}`)
  if (!res.ok) throw new Error('계약서 조회 실패')
  return res.json()
}

async function createContractAzure(params: {
  quotation_id: string | null; company_id: string | null; sender_company_id?: string | null
  contract_date: string; recipient: string
}): Promise<Contract> {
  const res = await fetch('/api/contracts', {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(params),
  })
  if (!res.ok) throw new Error('계약서 생성 실패')
  return res.json()
}

async function updateContractAzure(id: string, patch: Record<string, unknown>) {
  const res = await fetch(`/api/contracts/${id}`, {
    method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(patch),
  })
  if (!res.ok) throw new Error('계약서 수정 실패')
}

async function saveContractItemsAzure(contractId: string, items: ContractItem[]) {
  const res = await fetch(`/api/contracts/${contractId}/items`, {
    method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(items),
  })
  if (!res.ok) throw new Error('계약 품목 저장 실패')
}

async function deleteContractAzure(id: string) {
  const res = await fetch(`/api/contracts/${id}`, { method: 'DELETE' })
  if (!res.ok) throw new Error('계약서 삭제 실패')
}

async function deleteDraftsByQuotationIdAzure(quotationId: string, exceptId: string) {
  const res = await fetch(`/api/contracts/drafts?quotationId=${quotationId}&exceptId=${exceptId}`, { method: 'DELETE' })
  if (!res.ok) throw new Error('임시저장 계약서 정리 실패')
}

// ════════════════════════════════════════════════════════════
// 공개 API — BACKEND 값에 따라 분기
// ════════════════════════════════════════════════════════════

export const getContracts = () => BACKEND === 'supabase' ? getContractsSupabase() : getContractsAzure()
export const getContractWithItems = (id: string) =>
  BACKEND === 'supabase' ? getContractWithItemsSupabase(id) : getContractWithItemsAzure(id)
export const createContract = (params: {
  quotation_id: string | null; company_id: string | null; sender_company_id?: string | null
  contract_date: string; recipient: string
}) => BACKEND === 'supabase' ? createContractSupabase(params) : createContractAzure(params)
export const updateContract = (id: string, patch: {
  quotation_id?: string | null; company_id?: string | null; sender_company_id?: string | null
  contract_date?: string; start_date?: string | null; end_date?: string | null; recipient?: string
  total_amount?: number; vat_type?: VatType; status?: ContractStatus
  special_terms?: string | null; articles?: Record<string, string> | null
}) => BACKEND === 'supabase' ? updateContractSupabase(id, patch) : updateContractAzure(id, patch)
export const saveContractItems = (contractId: string, items: ContractItem[]) =>
  BACKEND === 'supabase' ? saveContractItemsSupabase(contractId, items) : saveContractItemsAzure(contractId, items)
export const deleteContract = (id: string) =>
  BACKEND === 'supabase' ? deleteContractSupabase(id) : deleteContractAzure(id)
export const deleteDraftsByQuotationId = (quotationId: string, exceptId: string) =>
  BACKEND === 'supabase'
    ? deleteDraftsByQuotationIdSupabase(quotationId, exceptId)
    : deleteDraftsByQuotationIdAzure(quotationId, exceptId)
