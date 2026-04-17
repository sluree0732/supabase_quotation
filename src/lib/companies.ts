import { supabase } from './supabase'
import type { Company, CompanyContact, CompanyType } from '@/types'

export async function getCompanies(): Promise<Company[]> {
  const { data, error } = await supabase
    .from('companies')
    .select('*, company_contacts(*)')
    .order('created_at', { ascending: false })
  if (error) throw error
  return (data ?? []).map(c => ({ ...c, contacts: c.company_contacts ?? [] }))
}

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

export async function uploadStamp(file: File, companyId?: string): Promise<string> {
  const formData = new FormData()
  formData.append('file', file)
  if (companyId) formData.append('companyId', companyId)

  const res = await fetch('/api/upload-stamp', {
    method: 'POST',
    body: formData,
  })
  if (!res.ok) {
    const { error } = await res.json()
    throw new Error(`도장 이미지 업로드 실패: ${error}`)
  }
  const { url } = await res.json()
  return url
}

export async function createCompany(payload: CompanyPayload): Promise<Company> {
  const { data, error } = await supabase
    .from('companies')
    .insert(payload)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function updateCompany(id: string, payload: CompanyPayload): Promise<Company> {
  const { data, error } = await supabase
    .from('companies')
    .update(payload)
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function deleteCompany(id: string): Promise<void> {
  const { error } = await supabase.from('companies').delete().eq('id', id)
  if (error) throw error
}

export async function getCompany(id: string): Promise<Company | null> {
  const { data, error } = await supabase
    .from('companies')
    .select('*, company_contacts(*)')
    .eq('id', id)
    .single()
  if (error) return null
  return { ...data, contacts: data.company_contacts ?? [] }
}

export async function getContacts(companyId: string): Promise<CompanyContact[]> {
  const { data, error } = await supabase
    .from('company_contacts')
    .select('*')
    .eq('company_id', companyId)
    .order('created_at', { ascending: true })
  if (error) throw error
  return data ?? []
}

export async function addContact(companyId: string, name: string, phone: string): Promise<CompanyContact> {
  const { data, error } = await supabase
    .from('company_contacts')
    .insert({ company_id: companyId, name, phone })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function deleteContact(contactId: string): Promise<void> {
  const { error } = await supabase.from('company_contacts').delete().eq('id', contactId)
  if (error) throw error
}

export async function getSenderStampUrl(companyId?: string | null): Promise<string | null> {
  let query = supabase
    .from('companies')
    .select('stamp_url')
    .not('stamp_url', 'is', null)

  if (companyId) {
    query = query.eq('id', companyId)
  } else {
    query = query.eq('company_type', 'sender').order('created_at', { ascending: false })
  }

  const { data, error } = await query.limit(1)
  if (error || !data?.length) return null
  return data[0].stamp_url
}
