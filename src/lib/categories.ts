import { supabase } from './supabase'

export async function getCategories(): Promise<string[]> {
  const { data, error } = await supabase
    .from('categories')
    .select('name')
    .order('sort_order', { ascending: true })
  if (error) throw error
  return (data ?? []).map((c: { name: string }) => c.name)
}

export async function addCategory(name: string, sortOrder: number): Promise<void> {
  const { error } = await supabase
    .from('categories')
    .insert({ name, sort_order: sortOrder })
  if (error) throw error
}

export async function removeCategory(name: string): Promise<void> {
  const { error } = await supabase
    .from('categories')
    .delete()
    .eq('name', name)
  if (error) throw error
}
