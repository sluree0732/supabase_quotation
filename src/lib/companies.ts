import { supabase } from './supabase'
import { BACKEND } from './backend'
import type { Company, CompanyContact, CompanyType } from '@/types'

export interface CompanyPayload {
  company_type: CompanyType
  name: string
  address: string
  phone: string
  business_no: string
  business_type: string
  business_item: string
  email: string
  fax: string
  ceo?: string
  bank?: string
  stamp_url?: string | null
}

// ════════════════════════════════════════════════════════════
// Supabase 구현 (롤백용)
// ════════════════════════════════════════════════════════════

async function getCompaniesSupabase(): Promise<Company[]> {
  const { data, error } = await supabase
    .from('companies')
    .select('*, company_contacts(*)')
    .order('created_at', { ascending: false })
  if (error) throw error
  return (data ?? []).map(c => ({ ...c, contacts: c.company_contacts ?? [] }))
}

async function createCompanySupabase(payload: CompanyPayload): Promise<Company> {
  const { data, error } = await supabase.from('companies').insert(payload).select().single()
  if (error) throw error
  return data
}

async function updateCompanySupabase(id: string, payload: CompanyPayload): Promise<Company> {
  const { data, error } = await supabase.from('companies').update(payload).eq('id', id).select().single()
  if (error) throw error
  return data
}

async function deleteCompanySupabase(id: string): Promise<void> {
  const { error } = await supabase.from('companies').delete().eq('id', id)
  if (error) throw error
}

async function getCompanySupabase(id: string): Promise<Company | null> {
  const { data, error } = await supabase
    .from('companies').select('*, company_contacts(*)').eq('id', id).single()
  if (error) return null
  return { ...data, contacts: data.company_contacts ?? [] }
}

async function getContactsSupabase(companyId: string): Promise<CompanyContact[]> {
  const { data, error } = await supabase
    .from('company_contacts').select('*').eq('company_id', companyId).order('created_at', { ascending: true })
  if (error) throw error
  return data ?? []
}

async function addContactSupabase(companyId: string, name: string, phone: string): Promise<CompanyContact> {
  const { data, error } = await supabase
    .from('company_contacts').insert({ company_id: companyId, name, phone }).select().single()
  if (error) throw error
  return data
}

async function deleteContactSupabase(contactId: string): Promise<void> {
  const { error } = await supabase.from('company_contacts').delete().eq('id', contactId)
  if (error) throw error
}

async function updateContactSupabase(contactId: string, name: string, phone: string): Promise<CompanyContact> {
  const { data, error } = await supabase
    .from('company_contacts').update({ name, phone }).eq('id', contactId).select().single()
  if (error) throw error
  return data
}

async function getSenderStampUrlSupabase(companyId?: string | null): Promise<string | null> {
  let query = supabase.from('companies').select('stamp_url').not('stamp_url', 'is', null)
  query = companyId
    ? query.eq('id', companyId)
    : query.eq('company_type', 'sender').order('created_at', { ascending: false })
  const { data, error } = await query.limit(1)
  if (error || !data?.length) return null
  return data[0].stamp_url
}

// ════════════════════════════════════════════════════════════
// Azure 구현 (기본값)
// ════════════════════════════════════════════════════════════

async function getCompaniesAzure(): Promise<Company[]> {
  const res = await fetch('/api/companies')
  if (!res.ok) throw new Error('업체 목록 조회 실패')
  return res.json()
}

async function createCompanyAzure(payload: CompanyPayload): Promise<Company> {
  const res = await fetch('/api/companies', {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload),
  })
  if (!res.ok) throw new Error('업체 등록 실패')
  return res.json()
}

async function updateCompanyAzure(id: string, payload: CompanyPayload): Promise<Company> {
  const res = await fetch(`/api/companies/${id}`, {
    method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload),
  })
  if (!res.ok) throw new Error('업체 수정 실패')
  return res.json()
}

async function deleteCompanyAzure(id: string): Promise<void> {
  const res = await fetch(`/api/companies/${id}`, { method: 'DELETE' })
  if (!res.ok) throw new Error('업체 삭제 실패')
}

async function getCompanyAzure(id: string): Promise<Company | null> {
  const res = await fetch(`/api/companies/${id}`)
  if (res.status === 404) return null
  if (!res.ok) throw new Error('업체 조회 실패')
  return res.json()
}

async function getContactsAzure(companyId: string): Promise<CompanyContact[]> {
  const res = await fetch(`/api/companies/${companyId}/contacts`)
  if (!res.ok) throw new Error('담당자 조회 실패')
  return res.json()
}

async function addContactAzure(companyId: string, name: string, phone: string): Promise<CompanyContact> {
  const res = await fetch(`/api/companies/${companyId}/contacts`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name, phone }),
  })
  if (!res.ok) throw new Error('담당자 추가 실패')
  return res.json()
}

async function deleteContactAzure(contactId: string): Promise<void> {
  const res = await fetch(`/api/companies/_/contacts/${contactId}`, { method: 'DELETE' })
  if (!res.ok) throw new Error('담당자 삭제 실패')
}

async function updateContactAzure(contactId: string, name: string, phone: string): Promise<CompanyContact> {
  const res = await fetch(`/api/companies/_/contacts/${contactId}`, {
    method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name, phone }),
  })
  if (!res.ok) throw new Error('담당자 수정 실패')
  return res.json()
}

async function getSenderStampUrlAzure(companyId?: string | null): Promise<string | null> {
  const res = await fetch(`/api/companies?stampFor=${companyId ?? 'sender'}`)
  if (!res.ok) return null
  const { stamp_url } = await res.json()
  return stamp_url
}

// ════════════════════════════════════════════════════════════
// 공개 API — BACKEND 값에 따라 분기
// ════════════════════════════════════════════════════════════

export const getCompanies = () => BACKEND === 'supabase' ? getCompaniesSupabase() : getCompaniesAzure()

export async function uploadStamp(file: File, companyId?: string): Promise<string> {
  const formData = new FormData()
  formData.append('file', file)
  if (companyId) formData.append('companyId', companyId)
  const res = await fetch('/api/upload-stamp', { method: 'POST', body: formData })
  if (!res.ok) {
    const { error } = await res.json()
    throw new Error(`도장 이미지 업로드 실패: ${error}`)
  }
  const { url } = await res.json()
  return url
}

export const createCompany = (payload: CompanyPayload) =>
  BACKEND === 'supabase' ? createCompanySupabase(payload) : createCompanyAzure(payload)

export const updateCompany = (id: string, payload: CompanyPayload) =>
  BACKEND === 'supabase' ? updateCompanySupabase(id, payload) : updateCompanyAzure(id, payload)

export const deleteCompany = (id: string) =>
  BACKEND === 'supabase' ? deleteCompanySupabase(id) : deleteCompanyAzure(id)

export const getCompany = (id: string) =>
  BACKEND === 'supabase' ? getCompanySupabase(id) : getCompanyAzure(id)

export const getContacts = (companyId: string) =>
  BACKEND === 'supabase' ? getContactsSupabase(companyId) : getContactsAzure(companyId)

export const addContact = (companyId: string, name: string, phone: string) =>
  BACKEND === 'supabase' ? addContactSupabase(companyId, name, phone) : addContactAzure(companyId, name, phone)

export const deleteContact = (contactId: string) =>
  BACKEND === 'supabase' ? deleteContactSupabase(contactId) : deleteContactAzure(contactId)

export const updateContact = (contactId: string, name: string, phone: string) =>
  BACKEND === 'supabase' ? updateContactSupabase(contactId, name, phone) : updateContactAzure(contactId, name, phone)

export const getSenderStampUrl = (companyId?: string | null) =>
  BACKEND === 'supabase' ? getSenderStampUrlSupabase(companyId) : getSenderStampUrlAzure(companyId)
