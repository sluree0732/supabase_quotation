import { supabase } from './supabase'
import { BACKEND } from './backend'

// Supabase 구현 (롤백용)
async function getCategoriesSupabase(): Promise<string[]> {
  const { data, error } = await supabase.from('categories').select('name').order('sort_order', { ascending: true })
  if (error) throw error
  return (data ?? []).map((c: { name: string }) => c.name)
}
async function addCategorySupabase(name: string, sortOrder: number): Promise<void> {
  const { error } = await supabase.from('categories').insert({ name, sort_order: sortOrder })
  if (error) throw error
}
async function removeCategorySupabase(name: string): Promise<void> {
  const { error } = await supabase.from('categories').delete().eq('name', name)
  if (error) throw error
}

// Azure 구현 (기본값)
async function getCategoriesAzure(): Promise<string[]> {
  const res = await fetch('/api/categories')
  if (!res.ok) throw new Error('카테고리 조회 실패')
  return res.json()
}
async function addCategoryAzure(name: string, sortOrder: number): Promise<void> {
  const res = await fetch('/api/categories', {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name, sortOrder }),
  })
  if (!res.ok) throw new Error('카테고리 추가 실패')
}
async function removeCategoryAzure(name: string): Promise<void> {
  const res = await fetch(`/api/categories/${encodeURIComponent(name)}`, { method: 'DELETE' })
  if (!res.ok) throw new Error('카테고리 삭제 실패')
}

// 공개 API — BACKEND 값에 따라 분기
export const getCategories = () => BACKEND === 'supabase' ? getCategoriesSupabase() : getCategoriesAzure()
export const addCategory = (name: string, sortOrder: number) =>
  BACKEND === 'supabase' ? addCategorySupabase(name, sortOrder) : addCategoryAzure(name, sortOrder)
export const removeCategory = (name: string) =>
  BACKEND === 'supabase' ? removeCategorySupabase(name) : removeCategoryAzure(name)
