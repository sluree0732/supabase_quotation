'use client'

import { useEffect, useState } from 'react'
import { Plus, X, Check } from 'lucide-react'
import type { ContractTemplate } from '@/types'
import {
  getContractTemplates,
  createContractTemplate,
  updateContractTemplate,
  deleteContractTemplate,
} from '@/lib/contractTemplates'
import { DEFAULT_ARTICLES } from '@/lib/contractArticles'
import type { ContractArticles } from '@/lib/contractArticles'

const ARTICLE_FIELDS: { key: keyof ContractArticles; label: string; rows: number }[] = [
  { key: 'a1', label: '제1조 목적', rows: 3 },
  { key: 'a4_payment', label: '제4조 지급 방법', rows: 3 },
  { key: 'a5', label: '제5조 광고물 승인', rows: 3 },
  { key: 'a6', label: '제6조 저작권', rows: 3 },
  { key: 'a7', label: '제7조 비밀유지', rows: 2 },
  { key: 'a8', label: '제8조 계약의 해지', rows: 3 },
  { key: 'a9', label: '제9조 관할법원', rows: 2 },
]

type TemplateFormState = {
  name: string
  description: string
  articles: ContractArticles
}

const EMPTY_FORM: TemplateFormState = {
  name: '',
  description: '',
  articles: { ...DEFAULT_ARTICLES },
}

export default function ContractTemplateManager() {
  const [templates, setTemplates] = useState<ContractTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<TemplateFormState>(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<ContractTemplate | null>(null)

  useEffect(() => { load() }, [])

  useEffect(() => {
    document.body.style.overflow = showForm ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [showForm])

  async function load() {
    setLoading(true)
    try {
      setTemplates(await getContractTemplates())
      setLoadError(null)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err)
      if (msg.includes('relation') || msg.includes('does not exist') || msg.includes('42P01')) {
        setLoadError('contract_templates 테이블이 없습니다.\nSupabase SQL Editor에서 테이블을 먼저 생성해주세요.')
      } else {
        setLoadError('데이터를 불러오지 못했습니다.')
      }
    } finally {
      setLoading(false)
    }
  }

  function openAdd() {
    setEditingId(null)
    setForm(EMPTY_FORM)
    setShowForm(true)
  }

  function openEdit(t: ContractTemplate) {
    setEditingId(t.id)
    setForm({
      name: t.name,
      description: t.description ?? '',
      articles: { ...DEFAULT_ARTICLES, ...t.articles } as ContractArticles,
    })
    setShowForm(true)
  }

  function closeForm() {
    setShowForm(false)
    setEditingId(null)
    setForm(EMPTY_FORM)
  }

  async function handleSave() {
    if (!form.name.trim()) { alert('양식 이름을 입력해주세요.'); return }
    setSaving(true)
    try {
      if (editingId) {
        await updateContractTemplate(editingId, {
          name: form.name.trim(),
          description: form.description.trim() || null,
          articles: form.articles as Record<string, string>,
        })
      } else {
        await createContractTemplate({
          name: form.name.trim(),
          description: form.description.trim() || null,
          articles: form.articles as Record<string, string>,
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

  async function handleDelete(t: ContractTemplate) {
    try {
      await deleteContractTemplate(t.id)
      setDeleteTarget(null)
      await load()
    } catch {
      alert('삭제 실패')
    }
  }

  function setArticle(key: keyof ContractArticles, value: string) {
    setForm(prev => ({ ...prev, articles: { ...prev.articles, [key]: value } }))
  }

  function resetArticle(key: keyof ContractArticles) {
    setForm(prev => ({ ...prev, articles: { ...prev.articles, [key]: DEFAULT_ARTICLES[key] } }))
  }

  return (
    <div>
      {/* 서브 헤더 */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <span className="text-[#8e44ad] text-lg">✍️</span>
          <span className="text-sm font-semibold text-[#1e2a3a]">계약서 조항 양식</span>
          <span className="text-xs text-[#718096]">({templates.length}개)</span>
        </div>
        <button
          onClick={openAdd}
          className="flex items-center gap-1.5 px-4 py-2 bg-[#8e44ad] text-white rounded-xl text-sm font-medium hover:bg-[#7d3c98] transition-colors"
        >
          <Plus size={15} />
          새 양식
        </button>
      </div>

      {/* 안내 문구 */}
      <p className="text-xs text-[#718096] mb-4 leading-relaxed">
        자주 사용하는 계약서 조항 양식을 미리 저장해두고, 계약서 작성 시 바로 불러와 사용할 수 있습니다.
      </p>

      {/* 목록 */}
      {loading ? (
        <div className="text-center text-[#718096] py-20">불러오는 중...</div>
      ) : loadError ? (
        <div className="flex flex-col items-center py-20">
          <div className="bg-red-50 border border-red-200 rounded-2xl px-6 py-5 max-w-md text-center">
            <p className="text-red-600 font-semibold text-sm mb-2">테이블 연결 오류</p>
            <p className="text-red-500 text-xs whitespace-pre-line leading-relaxed">{loadError}</p>
            <code className="block mt-3 bg-red-100 rounded-lg px-3 py-2 text-[11px] text-red-700 text-left">
              {`create table contract_templates (\n  id uuid primary key default gen_random_uuid(),\n  name text not null,\n  description text,\n  articles jsonb not null,\n  sort_order int default 0,\n  created_at timestamptz default now()\n);`}
            </code>
            <button
              onClick={() => { setLoadError(null); load() }}
              className="mt-4 px-4 py-2 bg-red-500 text-white rounded-xl text-xs font-medium hover:bg-red-600 transition-colors"
            >
              다시 시도
            </button>
          </div>
        </div>
      ) : templates.length === 0 ? (
        <div className="text-center py-20">
          <div className="text-5xl mb-3">✍️</div>
          <p className="text-[#718096] text-sm">저장된 계약서 조항 양식이 없습니다.</p>
          <button onClick={openAdd} className="mt-3 text-[#8e44ad] text-sm underline">
            첫 양식 추가하기
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {templates.map((t) => (
            <div
              key={t.id}
              className="bg-white rounded-2xl border border-[#e2e8f0] shadow-sm px-4 py-3.5 flex items-center justify-between"
            >
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-[#1e2a3a] truncate">{t.name}</p>
                {t.description && (
                  <p className="text-xs text-[#718096] truncate mt-0.5">{t.description}</p>
                )}
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <button
                  onClick={() => openEdit(t)}
                  className="p-1.5 text-[#718096] hover:text-[#8e44ad] hover:bg-purple-50 rounded-lg transition-colors text-sm"
                >
                  ✏️
                </button>
                <button
                  onClick={() => setDeleteTarget(t)}
                  className="p-1.5 text-[#718096] hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors text-sm"
                >
                  🗑
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 추가/수정 모달 */}
      {showForm && (
        <div className="fixed inset-0 z-[60] flex items-end md:items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={closeForm} />
          <div
            className="relative z-10 w-full md:w-[600px] bg-white rounded-t-2xl md:rounded-2xl shadow-xl flex flex-col max-h-[calc(100dvh-3.5rem)] md:max-h-[90vh]"
            onTouchMove={e => e.stopPropagation()}
          >
            <div className="md:hidden flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 bg-gray-300 rounded-full" />
            </div>
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <h2 className="font-bold text-[#1e2a3a] text-base">
                {editingId ? '양식 수정' : '새 양식'}
              </h2>
              <button onClick={closeForm}>
                <X size={20} className="text-gray-400" />
              </button>
            </div>

            <div className="px-5 py-4 space-y-4 overflow-y-auto flex-1 min-h-0">
              {/* 양식 이름 */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-[#4a5568]">양식 이름 *</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={e => setForm(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="예: 광고대행 기본 계약"
                  className="input-base"
                  autoFocus
                />
              </div>

              {/* 메모 */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-[#4a5568]">메모 (선택)</label>
                <input
                  type="text"
                  value={form.description}
                  onChange={e => setForm(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="이 양식의 용도나 특이사항"
                  className="input-base"
                />
              </div>

              {/* 7개 조항 */}
              <div className="border border-gray-200 rounded-xl overflow-hidden">
                <div className="px-4 py-2.5 bg-gray-50 text-xs font-semibold text-[#4a5568] border-b border-gray-100">
                  조항 내용 편집
                </div>
                <div className="px-4 py-4 space-y-4">
                  {ARTICLE_FIELDS.map(({ key, label, rows }) => (
                    <div key={key} className="space-y-1">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-medium text-[#4a5568]">{label}</label>
                        {form.articles[key] !== DEFAULT_ARTICLES[key] && (
                          <button
                            type="button"
                            onClick={() => resetArticle(key)}
                            className="text-xs text-[#8e44ad] hover:underline"
                          >
                            초기화
                          </button>
                        )}
                      </div>
                      <textarea
                        value={form.articles[key]}
                        onChange={e => setArticle(key, e.target.value)}
                        rows={rows}
                        className="input-base resize-y text-xs"
                      />
                    </div>
                  ))}
                </div>
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
                className="flex-1 py-3 rounded-xl bg-[#8e44ad] text-white font-semibold text-sm disabled:opacity-50 flex items-center justify-center gap-1.5"
              >
                <Check size={15} />
                {saving ? '저장 중...' : editingId ? '수정 완료' : '저장'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 삭제 확인 */}
      {deleteTarget && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={() => setDeleteTarget(null)} />
          <div className="relative z-10 bg-white rounded-2xl shadow-xl p-6 w-80">
            <h3 className="font-bold text-[#1e2a3a] mb-2">양식 삭제</h3>
            <p className="text-sm text-[#4a5568] mb-4">
              <span className="font-medium text-[#1e2a3a]">"{deleteTarget.name}"</span>을 삭제하시겠습니까?
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
