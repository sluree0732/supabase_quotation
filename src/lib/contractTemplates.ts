import { supabase } from './supabase'
import { BACKEND } from './backend'
import type { ContractTemplate } from '@/types'

// Supabase 구현 (롤백용)
async function getContractTemplatesSupabase(): Promise<ContractTemplate[]> {
  const { data, error } = await supabase
    .from('contract_templates').select('*').order('sort_order', { ascending: true }).order('created_at', { ascending: true })
  if (error) throw error
  return data ?? []
}
async function createContractTemplateSupabase(data: Omit<ContractTemplate, 'id' | 'created_at'>): Promise<ContractTemplate> {
  const { data: result, error } = await supabase.from('contract_templates').insert(data).select().single()
  if (error) throw error
  return result
}
async function updateContractTemplateSupabase(id: string, data: Partial<Omit<ContractTemplate, 'id' | 'created_at'>>): Promise<ContractTemplate> {
  const { data: result, error } = await supabase.from('contract_templates').update(data).eq('id', id).select().single()
  if (error) throw error
  return result
}
async function deleteContractTemplateSupabase(id: string): Promise<void> {
  const { error } = await supabase.from('contract_templates').delete().eq('id', id)
  if (error) throw error
}

// Azure 구현 (기본값)
async function getContractTemplatesAzure(): Promise<ContractTemplate[]> {
  const res = await fetch('/api/contract-templates')
  if (!res.ok) throw new Error('계약서 템플릿 조회 실패')
  return res.json()
}
async function createContractTemplateAzure(data: Omit<ContractTemplate, 'id' | 'created_at'>): Promise<ContractTemplate> {
  const res = await fetch('/api/contract-templates', {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data),
  })
  if (!res.ok) throw new Error('계약서 템플릿 생성 실패')
  return res.json()
}
async function updateContractTemplateAzure(id: string, data: Partial<Omit<ContractTemplate, 'id' | 'created_at'>>): Promise<ContractTemplate> {
  const res = await fetch(`/api/contract-templates/${id}`, {
    method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data),
  })
  if (!res.ok) throw new Error('계약서 템플릿 수정 실패')
  return res.json()
}
async function deleteContractTemplateAzure(id: string): Promise<void> {
  const res = await fetch(`/api/contract-templates/${id}`, { method: 'DELETE' })
  if (!res.ok) throw new Error('계약서 템플릿 삭제 실패')
}

// 공개 API — BACKEND 값에 따라 분기
export const getContractTemplates = () => BACKEND === 'supabase' ? getContractTemplatesSupabase() : getContractTemplatesAzure()
export const createContractTemplate = (data: Omit<ContractTemplate, 'id' | 'created_at'>) =>
  BACKEND === 'supabase' ? createContractTemplateSupabase(data) : createContractTemplateAzure(data)
export const updateContractTemplate = (id: string, data: Partial<Omit<ContractTemplate, 'id' | 'created_at'>>) =>
  BACKEND === 'supabase' ? updateContractTemplateSupabase(id, data) : updateContractTemplateAzure(id, data)
export const deleteContractTemplate = (id: string) =>
  BACKEND === 'supabase' ? deleteContractTemplateSupabase(id) : deleteContractTemplateAzure(id)
