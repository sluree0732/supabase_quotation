import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)

export async function POST(req: NextRequest) {
  try {
    const { items, extraDesc } = await req.json()

    if (!items?.length) {
      return NextResponse.json({ error: '항목이 없습니다.' }, { status: 400 })
    }

    const itemLines = items
      .map((item: any, i: number) => `${i + 1}. [${item.category || ''}] ${item.item_name}`)
      .join('\n')

    const extraSection = extraDesc?.trim()
      ? `\n추가 설명: ${extraDesc.trim()}`
      : ''

    const prompt = `당신은 전문 견적서 작성 도우미입니다.
아래 견적 항목들의 비고란에 들어갈 상세 설명을 한국어로 작성해주세요.

공급자 정보: 삼원기업 (서비스업 / 광고대행, s/w개발, 전자상거래)${extraSection}

견적 항목:
${itemLines}

각 항목에 대해 실무에서 사용할 수 있는 구체적인 비고 내용을 작성해주세요.
반드시 아래 형식을 정확히 지켜주세요:

1. • 첫 번째 세부내용
• 두 번째 세부내용
• 세 번째 세부내용
2. • 첫 번째 세부내용
• 두 번째 세부내용

규칙:
- 각 항목은 번호(1. 2. 3. ...)로 시작
- 세부내용은 반드시 줄바꿈 후 • 로 시작
- 각 항목당 2~4개의 세부내용 작성
- 번호와 • 외에 다른 머리말, 꼬리말, 설명은 절대 포함하지 마세요.`

    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' })
    const result = await model.generateContent(prompt)
    const raw = result.response.text().trim()

    const notes = parseResponse(raw, items.length)
    return NextResponse.json({ notes })
  } catch (e: any) {
    return NextResponse.json({ error: e.message ?? 'AI 생성 실패' }, { status: 500 })
  }
}

function parseResponse(raw: string, count: number): string[] {
  const notes = Array(count).fill('')
  const lines = raw.split('\n')
  let currentIdx: number | null = null
  let currentLines: string[] = []

  function flush() {
    if (currentIdx !== null && currentIdx >= 0 && currentIdx < count) {
      notes[currentIdx] = currentLines.join('\n').trim()
    }
  }

  for (const line of lines) {
    const stripped = line.trim()
    if (!stripped) continue

    let matched = false
    for (const sep of ['. ', ') ']) {
      if (stripped[0]?.match(/\d/) && stripped.includes(sep)) {
        const sepIdx = stripped.indexOf(sep)
        const numPart = stripped.slice(0, sepIdx)
        if (/^\d+$/.test(numPart)) {
          flush()
          currentLines = []
          currentIdx = parseInt(numPart) - 1
          currentLines.push(stripped.slice(sepIdx + sep.length).trim())
          matched = true
          break
        }
      }
    }
    if (!matched && currentIdx !== null) {
      currentLines.push(stripped)
    }
  }
  flush()

  // 폴백: 번호 파싱 결과가 비어있는 항목 처리
  for (let i = 0; i < count; i++) {
    if (notes[i]) continue

    // 해당 항목 범위 추정: count가 1이면 raw 전체 사용
    const targetRaw = count === 1 ? raw : ''

    if (targetRaw) {
      // 1단계: • 로 시작하는 줄만 추출
      const bulletLines = targetRaw.split('\n')
        .map(l => l.trim())
        .filter(l => l.startsWith('•') || l.startsWith('-') || l.startsWith('*'))
      if (bulletLines.length > 0) {
        notes[i] = bulletLines.join('\n')
      } else {
        // 2단계: raw 전체를 그대로 사용
        notes[i] = targetRaw.trim()
      }
    }
  }

  return notes
}
