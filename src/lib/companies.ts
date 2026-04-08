import { supabase } from './supabase'
import type { Company } from '@/types'

export async function getCompanies(): Promise<Company[]> {
  const { data, error } = await supabase
    .from('companies')
    .select('*')
    .order('created_at', { ascending: false })
  if (error) throw error
  return data
}

export async function createCompany(
  name: string,
  address: string,
  phone: string,
  business_type: string,
): Promise<Company> {
  const { data, error } = await supabase
    .from('companies')
    .insert({ name, address, phone, business_type })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function updateCompany(
  id: string,
  name: string,
  address: string,
  phone: string,
  business_type: string,
): Promise<Company> {
  const { data, error } = await supabase
    .from('companies')
    .update({ name, address, phone, business_type })
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
