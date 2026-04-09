'use client'

import { useState, useEffect } from 'react'
import { X, MapPin, Loader2 } from 'lucide-react'
import type { Company } from '@/types'
import { createCompany, updateCompany, deleteCompany } from '@/lib/companies'
import AddressModal from './AddressModal'

interface CompanyModalProps {
  company?: Company | null   // null = 신규, Company = 수정
  onClose: () => void
  onSaved: () => void
}

function formatPhone(value: string): string {
  const nums = value.replace(/\D/g, '').slice(0, 11)
  if (nums.startsWith('02')) {
    if (nums.length <= 6) return nums.replace(/(\d{2})(\d+)/, '$1-$2')
    return nums.replace(/(\d{2})(\d{4})(\d+)/, '$1-$2-$3')
  }
  if (nums.length <= 7) return nums.replace(/(\d{3})(\d+)/, '$1-$2')
  if (nums.length <= 10) return nums.replace(/(\d{3})(\d{3})(\d+)/, '$1-$2-$3')
  return nums.replace(/(\d{3})(\d{4})(\d+)/, '$1-$2-$3')
}

export default function CompanyModal({ company, onClose, onSaved }: CompanyModalProps) {
  const isEdit = !!company

  const [name, setName] = useState(company?.name ?? '')
  const [address, setAddress] = useState(company?.address ?? '')
  const [phone, setPhone] = useState(company?.phone ?? '')
  const [businessType, setBusinessType] = useState(company?.business_type ?? '')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showAddress, setShowAddress] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [])

  async function handleSave() {
    if (!name.trim()) { setError('업체명을 입력해주세요.'); return }
    setLoading(true)
    setError('')
    try {
      if (isEdit) {
        await updateCompany(company.id, name.trim(), address.trim(), phone.trim(), businessType.trim())
      } else {
        await createCompany(name.trim(), address.trim(), phone.trim(), businessType.trim())
      }
      onSaved()
      onClose()
    } catch (e: any) {
      setError(e.message ?? '저장 실패')
    } finally {
      setLoading(false)
    }
  }

  async function handleDelete() {
    if (!company) return
    setLoading(true)
    try {
      await deleteCompany(company.id)
      onSaved()
      onClose()
    } catch (e: any) {
      setError(e.message ?? '삭제 실패')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <div className="fixed inset-0 z-[60] flex items-end md:items-center justify-center">
        {/* 배경 */}
        <div className="absolute inset-0 bg-black/50" onClick={onClose} />

        {/* 모달 — 모바일: 하단 시트, PC: 중앙 */}
        <div
          className="relative z-10 w-full md:w-[480px] bg-white rounded-t-2xl md:rounded-2xl shadow-xl flex flex-col max-h-[calc(100dvh-3.5rem)] md:max-h-[80vh]"
          onTouchMove={e => e.stopPropagation()}
        >
          {/* 핸들 (모바일) */}
          <div className="md:hidden flex justify-center pt-3 pb-1">
            <div className="w-10 h-1 bg-gray-300 rounded-full" />
          </div>

          {/* 헤더 */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <h2 className="font-bold text-[#1e2a3a] text-lg">
              {isEdit ? '업체 수정' : '업체 등록'}
            </h2>
            <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600">
              <X size={20} />
            </button>
          </div>

          {/* 폼 */}
          <div className="px-5 py-4 space-y-4 flex-1 overflow-y-auto">
            {error && (
              <p className="text-sm text-red-500 bg-red-50 rounded-lg px-3 py-2">{error}</p>
            )}

            <Field label="업체명 *">
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="업체명 입력"
                className="input-base"
              />
            </Field>

            <Field label="주소">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={address}
                  readOnly
                  placeholder="주소 검색 버튼을 눌러주세요"
                  className="input-base flex-1 bg-gray-50 cursor-pointer"
                  onClick={() => setShowAddress(true)}
                />
                <button
                  type="button"
                  onClick={() => setShowAddress(true)}
                  className="flex items-center gap-1 px-3 py-2 bg-[#2980b9] text-white rounded-lg text-sm shrink-0"
                >
                  <MapPin size={14} />
                  검색
                </button>
              </div>
            </Field>

            <Field label="전화번호">
              <input
                type="tel"
                inputMode="numeric"
                value={phone}
                onChange={e => setPhone(formatPhone(e.target.value))}
                placeholder="051-000-0000"
                className="input-base"
              />
            </Field>

            <Field label="업태">
              <input
                type="text"
                value={businessType}
                onChange={e => setBusinessType(e.target.value)}
                placeholder="예: 서비스, 제조"
                className="input-base"
              />
            </Field>
          </div>

          {/* 버튼 */}
          <div className="px-5 py-4 border-t border-gray-100 space-y-2 shrink-0">
            {showDeleteConfirm ? (
              <div className="bg-red-50 rounded-xl p-3 space-y-2">
                <p className="text-sm text-red-700 font-medium">
                  '{company?.name}' 업체를 삭제하시겠습니까?
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setShowDeleteConfirm(false)}
                    className="flex-1 py-2 rounded-lg bg-gray-100 text-gray-700 text-sm font-medium"
                  >
                    취소
                  </button>
                  <button
                    onClick={handleDelete}
                    disabled={loading}
                    className="flex-1 py-2 rounded-lg bg-red-500 text-white text-sm font-medium disabled:opacity-50"
                  >
                    삭제 확인
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex gap-2">
                {isEdit && (
                  <button
                    onClick={() => setShowDeleteConfirm(true)}
                    className="py-3 px-4 rounded-xl bg-red-50 text-red-500 font-medium text-sm"
                  >
                    삭제
                  </button>
                )}
                <button
                  onClick={handleSave}
                  disabled={loading}
                  className="flex-1 py-3 rounded-xl bg-[#2980b9] text-white font-semibold text-sm flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {loading && <Loader2 size={16} className="animate-spin" />}
                  {isEdit ? '수정 완료' : '등록'}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {showAddress && (
        <AddressModal
          onSelect={addr => setAddress(addr)}
          onClose={() => setShowAddress(false)}
        />
      )}
    </>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="text-sm font-medium text-[#4a5568]">{label}</label>
      {children}
    </div>
  )
}
