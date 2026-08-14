import { supabase } from './supabase'
import { BACKEND } from './backend'
import type { NoteTemplate } from '@/types'

// Supabase 구현 (롤백용)
async function getNoteTemplatesSupabase(category?: string): Promise<NoteTemplate[]> {
  let query = supabase.from('note_templates').select('*').order('sort_order', { ascending: true }).order('created_at', { ascending: true })
  if (category) query = query.eq('category', category)
  const { data, error } = await query
  if (error) throw error
  return data ?? []
}
async function createNoteTemplateSupabase(data: Omit<NoteTemplate, 'id' | 'created_at'>): Promise<NoteTemplate> {
  const { data: result, error } = await supabase.from('note_templates').insert(data).select().single()
  if (error) throw error
  return result
}
async function updateNoteTemplateSupabase(id: string, data: Partial<Omit<NoteTemplate, 'id' | 'created_at'>>): Promise<NoteTemplate> {
  const { data: result, error } = await supabase.from('note_templates').update(data).eq('id', id).select().single()
  if (error) throw error
  return result
}
async function deleteNoteTemplateSupabase(id: string): Promise<void> {
  const { error } = await supabase.from('note_templates').delete().eq('id', id)
  if (error) throw error
}

// Azure 구현 (기본값)
async function getNoteTemplatesAzure(category?: string): Promise<NoteTemplate[]> {
  const res = await fetch(`/api/note-templates${category ? `?category=${encodeURIComponent(category)}` : ''}`)
  if (!res.ok) throw new Error('비고 템플릿 조회 실패')
  return res.json()
}
async function createNoteTemplateAzure(data: Omit<NoteTemplate, 'id' | 'created_at'>): Promise<NoteTemplate> {
  const res = await fetch('/api/note-templates', {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data),
  })
  if (!res.ok) throw new Error('비고 템플릿 생성 실패')
  return res.json()
}
async function updateNoteTemplateAzure(id: string, data: Partial<Omit<NoteTemplate, 'id' | 'created_at'>>): Promise<NoteTemplate> {
  const res = await fetch(`/api/note-templates/${id}`, {
    method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data),
  })
  if (!res.ok) throw new Error('비고 템플릿 수정 실패')
  return res.json()
}
async function deleteNoteTemplateAzure(id: string): Promise<void> {
  const res = await fetch(`/api/note-templates/${id}`, { method: 'DELETE' })
  if (!res.ok) throw new Error('비고 템플릿 삭제 실패')
}

// 공개 API — BACKEND 값에 따라 분기
export const getNoteTemplates = (category?: string) =>
  BACKEND === 'supabase' ? getNoteTemplatesSupabase(category) : getNoteTemplatesAzure(category)
export const createNoteTemplate = (data: Omit<NoteTemplate, 'id' | 'created_at'>) =>
  BACKEND === 'supabase' ? createNoteTemplateSupabase(data) : createNoteTemplateAzure(data)
export const updateNoteTemplate = (id: string, data: Partial<Omit<NoteTemplate, 'id' | 'created_at'>>) =>
  BACKEND === 'supabase' ? updateNoteTemplateSupabase(id, data) : updateNoteTemplateAzure(id, data)
export const deleteNoteTemplate = (id: string) =>
  BACKEND === 'supabase' ? deleteNoteTemplateSupabase(id) : deleteNoteTemplateAzure(id)
