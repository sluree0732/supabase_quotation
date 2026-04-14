import { supabase } from './supabase'
import type { NoteTemplate } from '@/types'

export async function getNoteTemplates(category?: string): Promise<NoteTemplate[]> {
  let query = supabase
    .from('note_templates')
    .select('*')
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: true })

  if (category) query = query.eq('category', category)

  const { data, error } = await query
  if (error) throw error
  return data ?? []
}

export async function createNoteTemplate(
  data: Omit<NoteTemplate, 'id' | 'created_at'>
): Promise<NoteTemplate> {
  const { data: result, error } = await supabase
    .from('note_templates')
    .insert(data)
    .select()
    .single()
  if (error) throw error
  return result
}

export async function updateNoteTemplate(
  id: string,
  data: Partial<Omit<NoteTemplate, 'id' | 'created_at'>>
): Promise<NoteTemplate> {
  const { data: result, error } = await supabase
    .from('note_templates')
    .update(data)
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return result
}

export async function deleteNoteTemplate(id: string): Promise<void> {
  const { error } = await supabase.from('note_templates').delete().eq('id', id)
  if (error) throw error
}
