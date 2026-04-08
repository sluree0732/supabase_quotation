import { FileSignature } from 'lucide-react'

export default function ContractsPage() {
  return (
    <div className="flex flex-col h-full">
      {/* 헤더 */}
      <div className="bg-white border-b border-gray-100 px-4 py-4 md:px-8">
        <h1 className="text-xl font-bold text-[#1e2a3a]">계약서 작성</h1>
      </div>

      {/* 준비중 */}
      <div className="flex-1 flex flex-col items-center justify-center gap-4 text-[#718096]">
        <div className="w-20 h-20 rounded-2xl bg-gray-100 flex items-center justify-center">
          <FileSignature size={36} className="text-gray-300" />
        </div>
        <div className="text-center">
          <p className="font-semibold text-[#1e2a3a]">계약서 작성</p>
          <p className="text-sm mt-1">계약서 양식 확정 후 구현 예정입니다.</p>
        </div>
      </div>
    </div>
  )
}
