'use client'

import { useState, useEffect, useRef } from 'react'
import { X, MapPin, Loader2, Plus, Trash2, UserRound, ImagePlus, Camera } from 'lucide-react'
import type { Company, CompanyContact, CompanyType } from '@/types'
import {
  createCompany, updateCompany, deleteCompany,
  getContacts, addContact, deleteContact, uploadStamp,
} from '@/lib/companies'
import AddressModal from './AddressModal'

interface CompanyModalProps {
  company?: Company | null
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

function formatBusinessNo(value: string): string {
  const nums = value.replace(/\D/g, '').slice(0, 10)
  if (nums.length <= 3) return nums
  if (nums.length <= 5) return `${nums.slice(0, 3)}-${nums.slice(3)}`
  return `${nums.slice(0, 3)}-${nums.slice(3, 5)}-${nums.slice(5)}`
}

export default function CompanyModal({ company, onClose, onSaved }: CompanyModalProps) {
  const isEdit = !!company

  const [companyType, setCompanyType] = useState<CompanyType | null>(company?.company_type ?? null)
  const [stampFile, setStampFile] = useState<File | null>(null)
  const [stampPreview, setStampPreview] = useState<string | null>(company?.stamp_url ?? null)
  const stampInputRef = useRef<HTMLInputElement>(null)
  const [name, setName] = useState(company?.name ?? '')
  const [address, setAddress] = useState(company?.address ?? '')
  const [phone, setPhone] = useState(company?.phone ?? '')
  const [businessNo, setBusinessNo] = useState(company?.business_no ?? '')
  const [email, setEmail] = useState(company?.email ?? '')
  const [businessType, setBusinessType] = useState(company?.business_type ?? '')
  const [businessItem, setBusinessItem] = useState(company?.business_item ?? '')
  const [fax, setFax] = useState(company?.fax ?? '')
  const [ceo, setCeo] = useState(company?.ceo ?? '')
  const [bank, setBank] = useState(company?.bank ?? '')

  const [contacts, setContacts] = useState<CompanyContact[]>([])
  const [newContactName, setNewContactName] = useState('')
  const [newContactPhone, setNewContactPhone] = useState('')
  const [addingContact, setAddingContact] = useState(false)
  const [showContactForm, setShowContactForm] = useState(false)

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showAddress, setShowAddress] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [ocrLoading, setOcrLoading] = useState(false)
  const [ocrError, setOcrError] = useState('')
  const [showOcrSheet, setShowOcrSheet] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const ocrCameraRef = useRef<HTMLInputElement>(null)
  const ocrFileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    setIsMobile(window.matchMedia('(pointer: coarse)').matches)
  }, [])

  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [])

  useEffect(() => {
    if (isEdit && company.id) {
      getContacts(company.id).then(setContacts).catch(() => {})
    }
  }, [isEdit, company?.id])

  async function handleOcrFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    e.target.value = ''

    setOcrLoading(true)
    setOcrError('')
    try {
      const fd = new FormData()
      fd.append('image', file)
      const res = await fetch('/api/ocr-business', { method: 'POST', body: fd })
      const data = await res.json()
      if (!res.ok) {
        setOcrError(data.error ?? 'OCR 처리 실패')
        return
      }
      if (data.name) setName(data.name)
      if (data.businessNo) setBusinessNo(data.businessNo)
      if (data.ceo) setCeo(data.ceo)
      if (data.address) setAddress(data.address)
      if (data.businessType) setBusinessType(data.businessType)
      if (data.businessItem) setBusinessItem(data.businessItem)
    } catch {
      setOcrError('네트워크 오류가 발생했습니다.')
    } finally {
      setOcrLoading(false)
    }
  }

  async function handleSave() {
    if (!companyType) { setError('업체 구분을 선택해주세요.'); return }
    if (!name.trim()) { setError('업체명을 입력해주세요.'); return }
    if (!address.trim()) { setError('주소를 입력해주세요.'); return }
    if (!businessNo.trim()) { setError('사업자 등록번호를 입력해주세요.'); return }
    if (!email.trim()) { setError('이메일을 입력해주세요.'); return }
    if (!phone.trim()) { setError('연락처를 입력해주세요.'); return }
    if (!ceo.trim()) { setError('대표자를 입력해주세요.'); return }
    if (companyType === 'sender' && !bank.trim()) { setError('결제계좌를 입력해주세요.'); return }

    setLoading(true)
    setError('')
    try {
      let stamp_url: string | null = company?.stamp_url ?? null
      if (stampFile) {
        stamp_url = await uploadStamp(stampFile, isEdit ? company.id : undefined)
      } else if (stampPreview === null && isEdit) {
        stamp_url = null
      }

      const payload = {
        company_type: companyType,
        name: name.trim(),
        address: address.trim(),
        phone: phone.trim(),
        business_no: businessNo.trim(),
        business_type: businessType.trim(),
        business_item: businessItem.trim(),
        email: email.trim(),
        fax: fax.trim(),
        ceo: ceo.trim(),
        bank: bank.trim(),
        stamp_url,
      }
      if (isEdit) {
        await updateCompany(company.id, payload)
      } else {
        await createCompany(payload)
      }
      onSaved()
      onClose()
    } catch (e: any) {
      setError(e.message ?? '저장 실패')
    } finally {
      setLoading(false)
    }
  }

  function handleStampFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setStampFile(file)
    setStampPreview(URL.createObjectURL(file))
  }

  function handleStampRemove() {
    setStampFile(null)
    setStampPreview(null)
    if (stampInputRef.current) stampInputRef.current.value = ''
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

  async function handleAddContact() {
    if (!newContactName.trim()) return
    if (!company?.id) return
    setAddingContact(true)
    try {
      const c = await addContact(company.id, newContactName.trim(), newContactPhone.trim())
      setContacts(prev => [...prev, c])
      setNewContactName('')
      setNewContactPhone('')
      setShowContactForm(false)
    } catch (e: any) {
      setError(e.message ?? '담당자 추가 실패')
    } finally {
      setAddingContact(false)
    }
  }

  async function handleDeleteContact(contactId: string) {
    try {
      await deleteContact(contactId)
      setContacts(prev => prev.filter(c => c.id !== contactId))
    } catch (e: any) {
      setError(e.message ?? '담당자 삭제 실패')
    }
  }

  return (
    <>
      <div className="fixed inset-0 z-[60] flex items-end md:items-center justify-center">
        <div className="absolute inset-0 bg-black/50" onClick={onClose} />

        <div
          className="relative z-10 w-full md:w-[520px] bg-white rounded-t-2xl md:rounded-2xl shadow-xl flex flex-col max-h-[calc(100dvh-3.5rem)] md:max-h-[90vh]"
          onTouchMove={e => e.stopPropagation()}
        >
          {/* 핸들 (모바일) */}
          <div className="md:hidden flex justify-center pt-3 pb-1">
            <div className="w-10 h-1 bg-gray-300 rounded-full" />
          </div>

          {/* 헤더 */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 shrink-0">
            <h2 className="font-bold text-[#1e2a3a] text-lg">
              {isEdit ? '업체 수정' : '업체 등록'}
            </h2>
            <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600">
              <X size={20} />
            </button>
          </div>

          {/* 폼 */}
          <div className="px-5 py-4 space-y-4 flex-1 overflow-y-auto">
            {/* 업체 구분 */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-[#4a5568]">업체 구분 *</label>
              <div className="grid grid-cols-2 gap-2">
                {([
                  { value: 'sender', label: '자사 업체', desc: '발신 (우리 회사)' },
                  { value: 'client', label: '광고주 업체', desc: '수신 (거래처)' },
                ] as const).map(opt => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setCompanyType(opt.value)}
                    className={`flex flex-col items-start px-4 py-3 rounded-xl border-2 text-left transition-colors ${
                      companyType === opt.value
                        ? opt.value === 'sender'
                          ? 'border-[#2980b9] bg-[#ebf5fb]'
                          : 'border-[#8e44ad] bg-[#f5eefa]'
                        : 'border-gray-200 bg-white hover:border-gray-300'
                    }`}
                  >
                    <span className={`text-sm font-semibold ${
                      companyType === opt.value
                        ? opt.value === 'sender' ? 'text-[#2980b9]' : 'text-[#8e44ad]'
                        : 'text-[#718096]'
                    }`}>{opt.label}</span>
                    <span className="text-xs text-[#718096] mt-0.5">{opt.desc}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* 사업자등록증 OCR */}
            <div>
              {/* PC: 파일 선택 전용 input */}
              <input
                ref={ocrFileRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleOcrFileChange}
              />
              {/* 모바일: 카메라 전용 input */}
              <input
                ref={ocrCameraRef}
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={handleOcrFileChange}
              />
              <button
                type="button"
                onClick={() => {
                  if (isMobile) {
                    setShowOcrSheet(true)
                  } else {
                    ocrFileRef.current?.click()
                  }
                }}
                disabled={ocrLoading}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border-2 border-dashed border-[#2980b9]/40 bg-[#ebf5fb]/60 text-[#2980b9] text-sm font-medium hover:bg-[#ebf5fb] hover:border-[#2980b9]/70 transition-colors disabled:opacity-60"
              >
                {ocrLoading
                  ? <><Loader2 size={16} className="animate-spin" />사업자등록증 인식 중...</>
                  : <><Camera size={16} />사업자등록증으로 자동 입력</>
                }
              </button>
              {ocrError && (
                <p className="mt-1.5 text-xs text-red-500 text-center">{ocrError}</p>
              )}
            </div>

            {/* 구분선 */}
            <div className="border-t border-gray-100" />
            <p className="text-xs font-semibold text-[#718096] uppercase tracking-wide">필수 정보</p>

            <Field label="업체명 *">
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="업체명 입력"
                className="input-base"
              />
            </Field>

            <Field label="주소 *">
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

            <Field label="사업자 등록번호 *">
              <input
                type="text"
                inputMode="numeric"
                value={businessNo}
                onChange={e => setBusinessNo(formatBusinessNo(e.target.value))}
                placeholder="000-00-00000"
                className="input-base"
              />
            </Field>

            <Field label="이메일 *">
              <input
                type="email"
                inputMode="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="example@company.com"
                className="input-base"
              />
            </Field>

            <Field label="연락처 *">
              <input
                type="tel"
                inputMode="numeric"
                value={phone}
                onChange={e => setPhone(formatPhone(e.target.value))}
                placeholder="051-000-0000"
                className="input-base"
              />
            </Field>

            <Field label="대표자 *">
              <input
                type="text"
                value={ceo}
                onChange={e => setCeo(e.target.value)}
                placeholder="대표자 이름"
                className="input-base"
              />
            </Field>

            {/* 자사 업체 전용: 결제계좌 */}
            {companyType === 'sender' && (
              <Field label="결제계좌 *">
                <input
                  type="text"
                  value={bank}
                  onChange={e => setBank(e.target.value)}
                  placeholder="예: 부산은행 112-13-000000-1 홍길동"
                  className="input-base"
                />
              </Field>
            )}

            {/* 자사 업체 전용: 도장 이미지 업로드 */}
            {companyType === 'sender' && (
              <Field label="도장 이미지">
                <input
                  ref={stampInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleStampFileChange}
                />
                {stampPreview ? (
                  <div className="flex items-center gap-3">
                    <div className="w-20 h-20 border border-gray-200 rounded-xl overflow-hidden flex items-center justify-center bg-gray-50 shrink-0">
                      <img src={stampPreview} alt="도장 미리보기" className="w-full h-full object-contain p-1" />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <button
                        type="button"
                        onClick={() => stampInputRef.current?.click()}
                        className="text-xs text-[#2980b9] border border-[#2980b9]/30 rounded-lg px-3 py-1.5 hover:bg-[#ebf5fb] transition-colors"
                      >
                        이미지 변경
                      </button>
                      <button
                        type="button"
                        onClick={handleStampRemove}
                        className="text-xs text-red-400 border border-red-200 rounded-lg px-3 py-1.5 hover:bg-red-50 transition-colors"
                      >
                        삭제
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => stampInputRef.current?.click()}
                    className="w-full flex flex-col items-center justify-center gap-2 py-5 border-2 border-dashed border-gray-200 rounded-xl text-gray-400 hover:border-[#2980b9] hover:text-[#2980b9] transition-colors"
                  >
                    <ImagePlus size={22} />
                    <span className="text-xs">도장 이미지 업로드 (PNG, JPG)</span>
                  </button>
                )}
              </Field>
            )}

            {/* 구분선 */}
            <div className="border-t border-gray-100" />
            <p className="text-xs font-semibold text-[#718096] uppercase tracking-wide">선택 정보</p>

            <Field label="업태">
              <input
                type="text"
                value={businessType}
                onChange={e => setBusinessType(e.target.value)}
                placeholder="예: 서비스업, 제조업"
                className="input-base"
              />
            </Field>

            <Field label="업종">
              <input
                type="text"
                value={businessItem}
                onChange={e => setBusinessItem(e.target.value)}
                placeholder="예: 광고대행업, IT"
                className="input-base"
              />
            </Field>

            <Field label="팩스번호">
              <input
                type="tel"
                inputMode="numeric"
                value={fax}
                onChange={e => setFax(formatPhone(e.target.value))}
                placeholder="051-000-0000"
                className="input-base"
              />
            </Field>

            {/* 담당자 — 편집 모드에서만 */}
            {isEdit && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-[#4a5568]">담당자</label>
                  <button
                    type="button"
                    onClick={() => setShowContactForm(v => !v)}
                    className="flex items-center gap-1 text-xs text-[#2980b9] font-medium border border-[#2980b9]/30 rounded-lg px-2.5 py-1.5 hover:bg-[#ebf5fb] transition-colors"
                  >
                    <Plus size={12} />
                    추가
                  </button>
                </div>

                {showContactForm && (
                  <div className="bg-gray-50 rounded-xl p-3 space-y-2">
                    <input
                      type="text"
                      value={newContactName}
                      onChange={e => setNewContactName(e.target.value)}
                      placeholder="담당자 이름 *"
                      className="input-base"
                    />
                    <input
                      type="tel"
                      inputMode="numeric"
                      value={newContactPhone}
                      onChange={e => setNewContactPhone(formatPhone(e.target.value))}
                      placeholder="연락처"
                      className="input-base"
                    />
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => { setShowContactForm(false); setNewContactName(''); setNewContactPhone('') }}
                        className="flex-1 py-2 rounded-lg bg-white border border-gray-200 text-[#4a5568] text-sm"
                      >
                        취소
                      </button>
                      <button
                        type="button"
                        onClick={handleAddContact}
                        disabled={addingContact || !newContactName.trim()}
                        className="flex-1 py-2 rounded-lg bg-[#2980b9] text-white text-sm font-medium disabled:opacity-50 flex items-center justify-center gap-1"
                      >
                        {addingContact ? <Loader2 size={14} className="animate-spin" /> : null}
                        저장
                      </button>
                    </div>
                  </div>
                )}

                {contacts.length > 0 ? (
                  <ul className="space-y-1.5">
                    {contacts.map(c => (
                      <li key={c.id} className="flex items-center gap-3 bg-white border border-gray-100 rounded-xl px-3 py-2.5">
                        <UserRound size={15} className="text-[#2980b9] shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-[#1e2a3a]">{c.name}</p>
                          {c.phone && <p className="text-xs text-[#718096]">{c.phone}</p>}
                        </div>
                        <button
                          type="button"
                          onClick={() => handleDeleteContact(c.id)}
                          className="p-1 text-gray-300 hover:text-red-400 transition-colors"
                        >
                          <Trash2 size={14} />
                        </button>
                      </li>
                    ))}
                  </ul>
                ) : (
                  !showContactForm && (
                    <p className="text-xs text-[#a0aec0] text-center py-2">
                      등록된 담당자가 없습니다
                    </p>
                  )
                )}
              </div>
            )}

            {!isEdit && (
              <p className="text-xs text-[#a0aec0] bg-gray-50 rounded-lg px-3 py-2">
                담당자는 업체 등록 후 수정 화면에서 추가할 수 있습니다.
              </p>
            )}
          </div>

          {/* 하단 버튼 */}
          <div className="px-5 py-4 border-t border-gray-100 space-y-2 shrink-0">
            {error && (
              <p className="text-sm text-red-500 bg-red-50 rounded-lg px-3 py-2">{error}</p>
            )}
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

      {/* 모바일 OCR 선택 바텀시트 */}
      {showOcrSheet && (
        <div className="fixed inset-0 z-[80] flex items-end justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={() => setShowOcrSheet(false)} />
          <div className="relative z-10 w-full md:w-[520px] bg-white rounded-t-2xl shadow-xl pb-safe">
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 bg-gray-300 rounded-full" />
            </div>
            <p className="text-center text-sm font-semibold text-[#1e2a3a] pt-2 pb-3">
              사업자등록증 불러오기
            </p>
            <div className="px-4 pb-4 space-y-2">
              <button
                type="button"
                onClick={() => { setShowOcrSheet(false); ocrCameraRef.current?.click() }}
                className="w-full flex items-center gap-3 px-4 py-4 bg-[#ebf5fb] rounded-xl text-[#2980b9] font-semibold text-sm"
              >
                <Camera size={20} />
                카메라 촬영
              </button>
              <button
                type="button"
                onClick={() => { setShowOcrSheet(false); ocrFileRef.current?.click() }}
                className="w-full flex items-center gap-3 px-4 py-4 bg-gray-50 rounded-xl text-[#4a5568] font-semibold text-sm"
              >
                <ImagePlus size={20} />
                파일 첨부
              </button>
              <button
                type="button"
                onClick={() => setShowOcrSheet(false)}
                className="w-full py-3 text-sm text-gray-400 font-medium"
              >
                취소
              </button>
            </div>
          </div>
        </div>
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
