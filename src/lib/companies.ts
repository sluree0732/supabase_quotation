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
