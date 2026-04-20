import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const file = formData.get('image') as File | null
    if (!file) {
      return NextResponse.json({ error: '이미지가 없습니다.' }, { status: 400 })
    }

    const bytes = await file.arrayBuffer()
    const base64 = Buffer.from(bytes).toString('base64')
    const mimeType = file.type || 'image/jpeg'

    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' })

    const prompt = `이 이미지는 한국의 사업자등록증입니다. 다음 정보를 추출하여 JSON 형식으로만 답해주세요. 다른 텍스트는 포함하지 마세요.

추출할 정보:
- businessNo: 사업자등록번호 (숫자와 하이픈만, 000-00-00000 형식)
- name: 법인명 또는 상호 (법인사업자는 법인명, 개인사업자는 상호)
- ceo: 대표자 성명
- address: 사업장 소재지 전체 주소
- businessType: 업태 첫 번째 행의 값 하나만 (예: "서비스")
- businessItem: 종목 첫 번째 행 전체 (쉼표로 구분된 값 모두 포함, 예: "광고대행, 광고물작성, 기타광고")

JSON 형식:
{
  "businessNo": "123-45-67890",
  "name": "삼원기업",
  "ceo": "홍길동",
  "address": "부산광역시 해운대구 우동 123",
  "businessType": "서비스",
  "businessItem": "광고대행, 광고물작성, 기타광고"
}

규칙:
- 값이 불명확하거나 없으면 빈 문자열("")로 설정
- businessNo는 숫자 10자리를 000-00-00000 형식으로 반드시 변환
- businessType: 업태 열의 첫 번째 행 값 하나만 추출
- businessItem: 종목 열의 첫 번째 행에 있는 모든 값을 쉼표 포함하여 그대로 추출
- JSON 외 다른 텍스트 없이 순수 JSON만 출력`

    const result = await model.generateContent([
      { inlineData: { data: base64, mimeType } },
      prompt,
    ])

    const raw = result.response.text().trim()

    let parsed: Record<string, string>
    try {
      const cleaned = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim()
      parsed = JSON.parse(cleaned)
    } catch {
      return NextResponse.json({ error: 'OCR 결과를 인식하지 못했습니다. 다시 촬영해주세요.' }, { status: 422 })
    }

    return NextResponse.json({
      businessNo: (parsed.businessNo ?? '').trim(),
      name: (parsed.name ?? '').trim(),
      ceo: (parsed.ceo ?? '').trim(),
      address: (parsed.address ?? '').trim(),
      businessType: (parsed.businessType ?? '').trim(),
      businessItem: (parsed.businessItem ?? '').trim(),
    })
  } catch (e: any) {
    return NextResponse.json({ error: e.message ?? 'OCR 처리 실패' }, { status: 500 })
  }
}
