import { supabase } from './supabase'
import type { ContractTemplate } from '@/types'

export async function getContractTemplates(): Promise<ContractTemplate[]> {
  const { data, error } = await supabase
    .from('contract_templates')
    .select('*')
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: true })
  if (error) throw error
  return data ?? []
}

export async function createContractTemplate(
  data: Omit<ContractTemplate, 'id' | 'created_at'>
): Promise<ContractTemplate> {
  const { data: result, error } = await supabase
    .from('contract_templates')
    .insert(data)
    .select()
    .single()
  if (error) throw error
  return result
}

export async function updateContractTemplate(
  id: string,
  data: Partial<Omit<ContractTemplate, 'id' | 'created_at'>>
): Promise<ContractTemplate> {
  const { data: result, error } = await supabase
    .from('contract_templates')
    .update(data)
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return result
}

export async function deleteContractTemplate(id: string): Promise<void> {
  const { error } = await supabase.from('contract_templates').delete().eq('id', id)
  if (error) throw error
}
