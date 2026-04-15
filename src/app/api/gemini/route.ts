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
- 각 세부내용은 한 줄로 간결하게 작성 (20자 내외)
- 괄호 안 예시, 부연설명, 추가 설명은 절대 포함하지 마세요
- 번호와 • 외에 다른 머리말, 꼬리말, 설명은 절대 포함하지 마세요.`

    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' })
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

    // "1." / "1. " / "1)" / "1) " 등 번호 줄 감지 (공백 없는 "1."도 처리)
    const numMatch = stripped.match(/^(\d+)[\.)](.*)$/)
    if (numMatch) {
      const num = parseInt(numMatch[1]) - 1
      if (num >= 0 && num < count) {
        flush()
        currentLines = []
        currentIdx = num
        const rest = numMatch[2].replace(/^[\s•\-\*]+/, '')  // "1.•내용" 형태 처리
        if (rest) currentLines.push(rest.trim())
        continue
      }
    }
    if (currentIdx !== null) {
      currentLines.push(stripped)
    }
  }
  flush()

  // 번호 파싱이 하나도 안 됐으면 → 단락 분할 폴백
  const allEmpty = notes.every(n => !n)
  if (allEmpty) {
    // 빈 줄로 단락 분리
    const paragraphs = raw.split(/\n\s*\n/).map(p => p.trim()).filter(Boolean)
    if (paragraphs.length >= count) {
      // 단락이 충분하면 1:1 매핑
      for (let i = 0; i < count; i++) {
        notes[i] = paragraphs[i]
      }
    } else if (paragraphs.length > 0) {
      // 단락이 부족하면 bullet 줄 기준으로 count등분 시도
      const bulletLines = raw.split('\n')
        .map(l => l.trim())
        .filter(l => l.startsWith('•') || l.startsWith('-') || l.startsWith('*'))
      if (bulletLines.length >= count) {
        const perItem = Math.ceil(bulletLines.length / count)
        for (let i = 0; i < count; i++) {
          notes[i] = bulletLines.slice(i * perItem, (i + 1) * perItem).join('\n')
        }
      } else {
        // 최후 폴백: raw 전체를 첫 항목에, 나머지도 동일하게
        for (let i = 0; i < count; i++) {
          notes[i] = paragraphs[0] ?? raw.trim()
        }
      }
    }
  } else {
    // 일부만 비어있는 경우: 개별 항목 폴백
    for (let i = 0; i < count; i++) {
      if (notes[i]) continue
      // 빈 항목은 인접한 채워진 항목의 내용을 사용하지 않고 raw에서 재시도
      const bulletLines = raw.split('\n')
        .map(l => l.trim())
        .filter(l => l.startsWith('•') || l.startsWith('-') || l.startsWith('*'))
      if (bulletLines.length > 0) {
        notes[i] = bulletLines.join('\n')
      } else {
        notes[i] = raw.trim()
      }
    }
  }

  // 후처리: 각 노트 첫 줄에 남아있는 "1." "2." 등 번호 제거
  return notes.map(n => n.replace(/^\d+[\.\)]\s*\n?/, '').trim())
}
