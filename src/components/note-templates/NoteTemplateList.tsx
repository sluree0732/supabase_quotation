'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Trash2, Pencil, X, Check, FileText, FileSignature } from 'lucide-react'
import type { NoteTemplate } from '@/types'
import {
  getNoteTemplates,
  createNoteTemplate,
  updateNoteTemplate,
  deleteNoteTemplate,
} from '@/lib/noteTemplates'
import { getCategories, addCategory as addCategoryToDb, removeCategory as removeCategoryFromDb } from '@/lib/categories'

const DEFAULT_CATEGORIES = ['기획', '디자인', '개발', '마케팅', '광고', '영상', '운영', '유지보수', '기타']

type FormState = { category: string; title: string; content: string }
const EMPTY_FORM: FormState = { category: '', title: '', content: '' }

export default function NoteTemplateList() {
  const router = useRouter()
  const [templates, setTemplates] = useState<NoteTemplate[]>([])
  const [categories, setCategories] = useState<string[]>(DEFAULT_CATEGORIES)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [activeCategory, setActiveCategory] = useState<string>('전체')
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<FormState>(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [newCatInput, setNewCatInput] = useState('')
  const [deleteTarget, setDeleteTarget] = useState<NoteTemplate | null>(null)

  useEffect(() => {
    getCategories()
      .then(cats => setCategories(cats.length > 0 ? cats : DEFAULT_CATEGORIES))
      .catch(() => setCategories(DEFAULT_CATEGORIES))
    load()
  }, [])

  useEffect(() => {
    document.body.style.overflow = showForm ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [showForm])

  async function load() {
    setLoading(true)
    try {
      setTemplates(await getNoteTemplates())
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err)
      if (msg.includes('relation') || msg.includes('does not exist') || msg.includes('42P01')) {
        setLoadError('note_templates 테이블이 존재하지 않습니다.\nSupabase SQL Editor에서 테이블을 먼저 생성해주세요.')
      } else {
        setLoadError('데이터를 불러오지 못했습니다. 잠시 후 다시 시도해주세요.')
      }
    } finally {
      setLoading(false)
    }
  }

  const displayed = activeCategory === '전체'
    ? templates
    : templates.filter(t => t.category === activeCategory)

  function openAdd() {
    setEditingId(null)
    setForm({ ...EMPTY_FORM, category: activeCategory === '전체' ? '' : activeCategory })
    setShowForm(true)
  }

  function openEdit(t: NoteTemplate) {
    setEditingId(t.id)
    setForm({ category: t.category, title: t.title, content: t.content })
    setShowForm(true)
  }

  function closeForm() {
    setShowForm(false)
    setEditingId(null)
    setForm(EMPTY_FORM)
  }

  async function handleSave() {
    if (!form.category) { alert('대분류를 선택해주세요.'); return }
    if (!form.title.trim()) { alert('제목을 입력해주세요.'); return }
    if (!form.content.trim()) { alert('비고 내용을 입력해주세요.'); return }

    setSaving(true)
    try {
      if (editingId) {
        await updateNoteTemplate(editingId, {
          category: form.category,
          title: form.title.trim(),
          content: form.content.trim(),
        })
      } else {
        await createNoteTemplate({
          category: form.category,
          title: form.title.trim(),
          content: form.content.trim(),
          sort_order: 0,
        })
      }
      await load()
      closeForm()
    } catch {
      alert('저장 실패')
    } finally {
      setSaving(false)
    }
  }

  async function addCategory() {
    const v = newCatInput.trim()
    if (!v || categories.includes(v)) return
    const next = [...categories, v]
    setCategories(next)
    setNewCatInput('')
    try { await addCategoryToDb(v, next.length) }
    catch { setCategories(categories) }
  }

  async function removeCategory(cat: string) {
    const next = categories.filter(c => c !== cat)
    setCategories(next)
    if (form.category === cat) setForm(prev => ({ ...prev, category: '' }))
    try { await removeCategoryFromDb(cat) }
    catch { setCategories(categories) }
  }

  async function handleDelete(t: NoteTemplate) {
    try {
      await deleteNoteTemplate(t.id)
      setDeleteTarget(null)
      await load()
    } catch {
      alert('삭제 실패')
    }
  }

  function handleUseTemplate(t: NoteTemplate, type: 'quotation' | 'contract') {
    sessionStorage.setItem('note_prefill', JSON.stringify({
      category: t.category,
      itemName: t.title,
      note: t.content,
    }))
    router.push(type === 'quotation' ? '/quotations/new' : '/contracts/new')
  }

  const categoryTabs = ['전체', ...categories]

  return (
    <div>
      {/* 서브 헤더 */}
      <div className="flex items-center justify-between mb-6">
        <span className="text-sm text-[#718096]">총 {templates.length}개</span>
        <button
          onClick={openAdd}
          className="flex items-center gap-1.5 px-4 py-2 bg-[#2980b9] text-white rounded-xl text-sm font-medium hover:bg-[#2471a3] transition-colors"
        >
          <Plus size={15} />
          새 템플릿
        </button>
      </div>

      {/* 카테고리 탭 */}
      <div className="flex gap-1.5 flex-wrap mb-5">
        {categoryTabs.map(cat => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
              activeCategory === cat
                ? 'bg-[#2980b9] text-white border-[#2980b9]'
                : 'bg-white text-[#4a5568] border-gray-200 hover:border-[#2980b9]'
            }`}
          >
            {cat}
            {cat !== '전체' && (
              <span className="ml-1 text-[10px] opacity-70">
                ({templates.filter(t => t.category === cat).length})
              </span>
            )}
          </button>
        ))}
      </div>

      {/* 템플릿 목록 */}
      {loading ? (
        <div className="text-center text-[#718096] py-20">불러오는 중...</div>
      ) : loadError ? (
        <div className="flex flex-col items-center py-20">
          <div className="bg-red-50 border border-red-200 rounded-2xl px-6 py-5 max-w-md text-center">
            <p className="text-red-600 font-semibold text-sm mb-2">테이블 연결 오류</p>
            <p className="text-red-500 text-xs whitespace-pre-line leading-relaxed">{loadError}</p>
            <code className="block mt-3 bg-red-100 rounded-lg px-3 py-2 text-[11px] text-red-700 text-left">
              {`create table note_templates (\n  id uuid primary key default gen_random_uuid(),\n  category text not null,\n  title text not null,\n  content text not null,\n  sort_order int default 0,\n  created_at timestamptz default now()\n);`}
            </code>
            <button
              onClick={() => { setLoadError(null); load() }}
              className="mt-4 px-4 py-2 bg-red-500 text-white rounded-xl text-xs font-medium hover:bg-red-600 transition-colors"
            >
              다시 시도
            </button>
          </div>
        </div>
      ) : displayed.length === 0 ? (
        <div className="text-center py-20">
          <span className="text-4xl opacity-30">📝</span>
          <p className="text-[#718096] text-sm">등록된 비고 템플릿이 없습니다.</p>
          <button onClick={openAdd} className="mt-3 text-[#2980b9] text-sm underline">
            첫 템플릿 추가하기
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {displayed.map(t => (
            <div
              key={t.id}
              className={`bg-white rounded-2xl border shadow-sm transition-all ${
                t.id === selectedId ? 'border-[#2980b9]' : 'border-[#e2e8f0]'
              }`}
            >
              <div
                onClick={() => setSelectedId(t.id === selectedId ? null : t.id)}
                className="px-4 py-3.5 cursor-pointer"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2 flex-wrap flex-1 min-w-0">
                    <span className="shrink-0 bg-[#ebf5fb] text-[#2980b9] text-[10px] font-medium px-2.5 py-1 rounded-full">
                      {t.category}
                    </span>
                    <p className="text-sm font-semibold text-[#1e2a3a] truncate">{t.title}</p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0" onClick={e => e.stopPropagation()}>
                    <button
                      onClick={() => openEdit(t)}
                      className="p-1.5 text-[#718096] hover:text-[#2980b9] hover:bg-[#ebf5fb] rounded-lg transition-colors"
                    >
                      <Pencil size={13} />
                    </button>
                    <button
                      onClick={() => setDeleteTarget(t)}
                      className="p-1.5 text-[#718096] hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
                <p className="text-xs text-[#718096] mt-1.5 truncate">
                  {t.content.replace(/\n/g, ' ')}
                </p>
              </div>

              {t.id === selectedId && (
                <div className="flex items-center gap-2 px-4 py-3 border-t border-[#e2e8f0] bg-[#f0f7fd] rounded-b-2xl">
                  <span className="text-xs text-[#718096] mr-1">사용할 문서:</span>
                  <button
                    onClick={() => handleUseTemplate(t, 'quotation')}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-[#27ae60] text-white text-xs font-medium rounded-lg hover:bg-[#219a52] transition-colors"
                  >
                    <FileText size={12} />
                    견적서
                  </button>
                  <button
                    onClick={() => handleUseTemplate(t, 'contract')}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-[#8e44ad] text-white text-xs font-medium rounded-lg hover:bg-[#7d3c98] transition-colors"
                  >
                    <FileSignature size={12} />
                    계약서
                  </button>
                  <button
                    onClick={() => setSelectedId(null)}
                    className="ml-auto p-1.5 text-[#718096] hover:text-gray-900 transition-colors"
                  >
                    <X size={13} />
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* 추가/수정 모달 */}
      {showForm && (
        <div className="fixed inset-0 z-[60] flex items-end md:items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={closeForm} />
          <div
            className="relative z-10 w-full md:w-[500px] bg-white rounded-t-2xl md:rounded-2xl shadow-xl flex flex-col max-h-[calc(100dvh-3.5rem)] md:max-h-[85vh]"
            onTouchMove={e => e.stopPropagation()}
          >
            <div className="md:hidden flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 bg-gray-300 rounded-full" />
            </div>
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <h2 className="font-bold text-[#1e2a3a] text-base">
                {editingId ? '템플릿 수정' : '새 템플릿'}
              </h2>
              <button onClick={closeForm}>
                <X size={20} className="text-gray-400" />
              </button>
            </div>
            <div className="px-5 py-4 space-y-4 overflow-y-auto flex-1 min-h-0">
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-[#4a5568]">대분류 *</label>
                  {form.category && (
                    <button
                      onClick={() => removeCategory(form.category)}
                      className="flex items-center gap-1 text-xs px-2 py-1 rounded-lg border border-red-200 text-red-500 bg-red-50 hover:bg-red-100 transition-colors"
                    >
                      <Trash2 size={11} /> 삭제
                    </button>
                  )}
                </div>
                <div className="flex flex-wrap gap-2">
                  {categories.map(cat => (
                    <button
                      key={cat}
                      onClick={() => setForm(prev => ({ ...prev, category: prev.category === cat ? '' : cat }))}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                        form.category === cat
                          ? 'bg-[#2980b9] text-white border-[#2980b9]'
                          : 'bg-white text-[#4a5568] border-gray-200 hover:border-[#2980b9]'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                  <div className="flex items-center gap-1">
                    <input
                      type="text"
                      value={newCatInput}
                      onChange={e => setNewCatInput(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && addCategory()}
                      placeholder="새 키워드"
                      className="w-20 px-2 py-1.5 border border-gray-200 rounded-lg text-xs focus:outline-none focus:border-[#2980b9]"
                    />
                    <button onClick={addCategory} className="p-1.5 bg-[#2980b9] text-white rounded-lg">
                      <Plus size={12} />
                    </button>
                  </div>
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-[#4a5568]">제목 *</label>
                <input
                  type="text"
                  value={form.title}
                  onChange={e => setForm(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="예: 랜딩페이지 기획 기본안"
                  className="input-base"
                  autoFocus
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-[#4a5568]">비고 내용 *</label>
                <textarea
                  value={form.content}
                  onChange={e => setForm(prev => ({ ...prev, content: e.target.value }))}
                  placeholder="• 항목별 세부 내용을 입력하세요&#10;• 예: 수정 횟수, 산출물, 포함 사항 등"
                  rows={6}
                  className="input-base resize-none"
                />
              </div>
            </div>
            <div className="px-5 py-4 border-t border-gray-100 flex gap-2 shrink-0">
              <button
                onClick={closeForm}
                className="flex-1 py-3 rounded-xl border border-gray-200 text-[#4a5568] font-medium text-sm"
              >
                취소
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex-1 py-3 rounded-xl bg-[#2980b9] text-white font-semibold text-sm disabled:opacity-50 flex items-center justify-center gap-1.5"
              >
                <Check size={15} />
                {saving ? '저장 중...' : editingId ? '수정 완료' : '저장'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 삭제 확인 모달 */}
      {deleteTarget && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={() => setDeleteTarget(null)} />
          <div className="relative z-10 bg-white rounded-2xl shadow-xl p-6 w-80">
            <h3 className="font-bold text-[#1e2a3a] mb-2">템플릿 삭제</h3>
            <p className="text-sm text-[#4a5568] mb-4">
              <span className="font-medium text-[#1e2a3a]">"{deleteTarget.title}"</span>을 삭제하시겠습니까?
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setDeleteTarget(null)}
                className="flex-1 py-2.5 rounded-xl border border-gray-200 text-[#4a5568] text-sm font-medium"
              >
                취소
              </button>
              <button
                onClick={() => handleDelete(deleteTarget)}
                className="flex-1 py-2.5 rounded-xl bg-red-500 text-white text-sm font-semibold"
              >
                삭제
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
