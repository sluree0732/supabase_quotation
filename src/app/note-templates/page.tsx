'use client'

import { useEffect, useState } from 'react'
import { Plus, Trash2, Pencil, BookText, X, Check } from 'lucide-react'
import type { NoteTemplate } from '@/types'
import {
  getNoteTemplates,
  createNoteTemplate,
  updateNoteTemplate,
  deleteNoteTemplate,
} from '@/lib/noteTemplates'

const CATEGORIES = ['기획', '디자인', '개발', '마케팅', '광고', '영상', '운영', '유지보수', '기타']

type FormState = { category: string; title: string; content: string }
const EMPTY_FORM: FormState = { category: '', title: '', content: '' }

export default function NoteTemplatesPage() {
  const [templates, setTemplates] = useState<NoteTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const [activeCategory, setActiveCategory] = useState<string>('전체')

  // 폼 상태
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<FormState>(EMPTY_FORM)
  const [saving, setSaving] = useState(false)

  // 삭제 확인
  const [deleteTarget, setDeleteTarget] = useState<NoteTemplate | null>(null)

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    try {
      setTemplates(await getNoteTemplates())
    } catch {
      alert('불러오기 실패')
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

  async function handleDelete(t: NoteTemplate) {
    try {
      await deleteNoteTemplate(t.id)
      setDeleteTarget(null)
      await load()
    } catch {
      alert('삭제 실패')
    }
  }

  const categoryTabs = ['전체', ...CATEGORIES]

  return (
    <div className="flex-1 min-h-screen bg-[#f8fafc] p-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <BookText size={22} className="text-[#2980b9]" />
          <h1 className="text-xl font-bold text-[#1e2a3a]">비고 등록</h1>
          <span className="text-sm text-[#718096] ml-1">({templates.length}개)</span>
        </div>
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
      ) : displayed.length === 0 ? (
        <div className="text-center py-20">
          <BookText size={40} className="text-gray-300 mx-auto mb-3" />
          <p className="text-[#718096] text-sm">등록된 비고 템플릿이 없습니다.</p>
          <button
            onClick={openAdd}
            className="mt-3 text-[#2980b9] text-sm underline"
          >
            첫 템플릿 추가하기
          </button>
        </div>
      ) : (
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {displayed.map(t => (
            <div
              key={t.id}
              className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex flex-col gap-2 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="shrink-0 bg-[#ebf5fb] text-[#2980b9] text-[10px] font-medium px-2 py-0.5 rounded-full">
                    {t.category}
                  </span>
                  <span className="font-semibold text-[#1e2a3a] text-sm truncate">{t.title}</span>
                </div>
                <div className="flex items-center gap-1 shrink-0">
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
              <p className="text-xs text-[#4a5568] whitespace-pre-wrap leading-relaxed line-clamp-4 bg-[#f8fafc] rounded-lg px-3 py-2">
                {t.content}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* 추가/수정 모달 */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={closeForm} />
          <div className="relative z-10 w-full md:w-[500px] bg-white rounded-t-2xl md:rounded-2xl shadow-xl flex flex-col max-h-[90vh]">
            {/* 핸들 (모바일) */}
            <div className="md:hidden flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 bg-gray-300 rounded-full" />
            </div>

            {/* 헤더 */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <h2 className="font-bold text-[#1e2a3a] text-base">
                {editingId ? '템플릿 수정' : '새 템플릿'}
              </h2>
              <button onClick={closeForm}>
                <X size={20} className="text-gray-400" />
              </button>
            </div>

            {/* 폼 */}
            <div className="px-5 py-4 space-y-4 overflow-y-auto">
              {/* 대분류 선택 */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-[#4a5568]">대분류 *</label>
                <div className="flex flex-wrap gap-2">
                  {CATEGORIES.map(cat => (
                    <button
                      key={cat}
                      onClick={() => setForm(prev => ({ ...prev, category: cat }))}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                        form.category === cat
                          ? 'bg-[#2980b9] text-white border-[#2980b9]'
                          : 'bg-white text-[#4a5568] border-gray-200 hover:border-[#2980b9]'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              {/* 제목 */}
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

              {/* 비고 내용 */}
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

            {/* 버튼 */}
            <div className="px-5 py-4 border-t border-gray-100 flex gap-2">
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
        <div className="fixed inset-0 z-50 flex items-center justify-center">
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
