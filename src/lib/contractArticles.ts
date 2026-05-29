export interface ContractArticles {
  [key: string]: string
  fullText: string
}

export const DEFAULT_FULL_TEXT = `제1조 (목적)
본 계약은 갑이 을에게 광고 대행 업무를 위탁하고, 을이 이를 성실히 수행함으로써 상호 이익을 도모함을 목적으로 한다.

제2조 (업무의 범위)
을은 다음의 업무를 대행한다.
{{견적서내용}}

제3조 (계약 기간)
본 계약의 기간은 {{계약시작일}}부터 {{계약종료일}}까지로 한다.

제4조 (광고 비용 및 대금 지급)
1. 공급가액: {{합계금액}}
   부가세(10%): {{부가세금액}}
   최종 지급액: {{최종금액}} ({{부가세}})
   • 예산 세부 내역(매체비, 제작비, 대행 수수료 등)은 별첨된 견적서에 따른다.
2. 지급 방법:
- 선금 (50%): 계약 체결 후 3일 이내 지급
- 잔금 (50%): 광고 집행 완료 및 최종 보고서 제출 후 7일 이내 지급

제5조 (광고물 승인)
을은 광고 제작 시 갑의 사전 승인을 받아야 하며, 갑은 을의 요청에 대해 지체 없이 승인 여부를 통보하여야 한다.

제6조 (저작권)
본 계약으로 제작된 광고물의 저작권은 을에게 귀속되며, 갑은 계약 기간 내에 한하여 이를 사용할 수 있다.

제7조 (비밀유지)
양 당사자는 본 계약을 통해 알게 된 상대방의 업무상 비밀을 제3자에게 누설하여서는 아니 된다.

제8조 (계약의 해지)
일방이 계약상 의무를 이행하지 않을 경우, 상대방은 30일 이상의 유예기간을 두고 서면으로 통지하여 계약을 해지할 수 있다.

제9조 (관할법원)
본 계약에 관한 분쟁이 발생할 경우 부산지방법원을 관할 법원으로 한다.`

export const DEFAULT_ARTICLES: ContractArticles = {
  fullText: DEFAULT_FULL_TEXT,
}

// ── 조항 파싱 ─────────────────────────────────────────────

export interface ParsedArticle {
  no: number
  title: string
  body: string
}

export function parseArticles(fullText: string): ParsedArticle[] {
  const result: ParsedArticle[] = []
  const lines = fullText.split('\n')
  const pattern = /^제(\d+)조\s*\(([^)]+)\)\s*$/

  let currentNo = 0
  let currentTitle = ''
  let bodyLines: string[] = []

  for (const line of lines) {
    const m = line.trim().match(pattern)
    if (m) {
      if (currentNo > 0) {
        result.push({ no: currentNo, title: currentTitle, body: bodyLines.join('\n').trim() })
        bodyLines = []
      }
      currentNo = parseInt(m[1])
      currentTitle = m[2].trim()
    } else {
      if (currentNo > 0) bodyLines.push(line)
    }
  }
  if (currentNo > 0) {
    result.push({ no: currentNo, title: currentTitle, body: bodyLines.join('\n').trim() })
  }
  return result
}

export function rebuildFullText(articles: ParsedArticle[]): string {
  return articles.map(a => `제${a.no}조 (${a.title})\n${a.body}`).join('\n\n')
}

export function getArticleBody(fullText: string, no: number): string {
  return parseArticles(fullText).find(a => a.no === no)?.body ?? ''
}

export function updateArticleBody(fullText: string, no: number, newBody: string): string {
  const articles = parseArticles(fullText)
  const idx = articles.findIndex(a => a.no === no)
  if (idx === -1) return fullText
  const updated = articles.map((a, i) => i === idx ? { ...a, body: newBody } : a)
  return rebuildFullText(updated)
}

// ── 변수 치환 ─────────────────────────────────────────────

export interface SubstituteContext {
  items: Array<{
    category?: string | null
    item_name: string
    period: number
    unit_price: number
    total_price: number
    note?: string | null
  }>
  total: number
  vatType: 'excluded' | 'included' | 'none'
  startDate: string
  endDate: string
  contractDate?: string
  senderName?: string
  receiverName?: string
  recipient?: string
}

function fmtNum(n: number) { return n.toLocaleString('ko-KR') }

export function generateItemsText(items: SubstituteContext['items']): string {
  if (!items.length) return '(항목 없음)'

  const order: string[] = []
  const groups = new Map<string, typeof items>()
  for (const item of items) {
    const cat = item.category ?? ''
    if (!groups.has(cat)) { order.push(cat); groups.set(cat, []) }
    groups.get(cat)!.push(item)
  }

  const lines: string[] = []
  for (const cat of order) {
    const catItems = groups.get(cat)!
    if (cat) lines.push(`[${cat}]`)
    for (const item of catItems) {
      lines.push(`• ${item.item_name} — ${item.period}개, ${fmtNum(item.unit_price)}원 / 총액 ${fmtNum(item.total_price)}원`)
      if (item.note) {
        for (const l of item.note.split('\n').filter(Boolean)) {
          lines.push(`  ${l.trim()}`)
        }
      }
    }
    lines.push('')
  }
  return lines.join('\n').trim()
}

export function substituteVariables(text: string, ctx: SubstituteContext): string {
  const vatLabel = ctx.vatType === 'excluded' ? '부가세 별도' : ctx.vatType === 'included' ? '부가세 포함' : '부가세 없음'
  const vatAmount = ctx.vatType === 'excluded' ? Math.round(ctx.total * 0.1) : 0
  const finalAmount = ctx.vatType === 'excluded' ? Math.round(ctx.total * 1.1) : ctx.total
  const itemsText = generateItemsText(ctx.items)

  return text
    .replace(/\{\{견적서내용\}\}/g, itemsText)
    .replace(/\{\{합계금액\}\}/g, `${fmtNum(ctx.total)}원`)
    .replace(/\{\{부가세금액\}\}/g, vatAmount > 0 ? `${fmtNum(vatAmount)}원` : '해당 없음')
    .replace(/\{\{최종금액\}\}/g, `${fmtNum(finalAmount)}원`)
    .replace(/\{\{부가세\}\}/g, vatLabel)
    .replace(/\{\{계약시작일\}\}/g, ctx.startDate || '미정')
    .replace(/\{\{계약종료일\}\}/g, ctx.endDate || '미정')
    .replace(/\{\{계약일\}\}/g, ctx.contractDate || '')
    .replace(/\{\{발신업체\}\}/g, ctx.senderName || '')
    .replace(/\{\{수신업체\}\}/g, ctx.receiverName || '')
    .replace(/\{\{담당자\}\}/g, ctx.recipient || '')
}

// ── 마이그레이션 (구 포맷 → fullText) ──────────────────────

export function mergeArticles(saved: Partial<ContractArticles> | null | undefined): ContractArticles {
  if (!saved) return { fullText: DEFAULT_FULL_TEXT }
  if ((saved as ContractArticles).fullText) return { fullText: (saved as ContractArticles).fullText }

  // 기존 7개 필드 → fullText 자동 변환
  const old = saved as Record<string, string>
  const a1 = old.a1 || '본 계약은 갑이 을에게 광고 대행 업무를 위탁하고, 을이 이를 성실히 수행함으로써 상호 이익을 도모함을 목적으로 한다.'
  const a4 = old.a4_payment || '- 선금 (50%): 계약 체결 후 3일 이내 지급\n- 잔금 (50%): 광고 집행 완료 및 최종 보고서 제출 후 7일 이내 지급'
  const a5 = old.a5 || '을은 광고 제작 시 갑의 사전 승인을 받아야 하며, 갑은 을의 요청에 대해 지체 없이 승인 여부를 통보하여야 한다.'
  const a6 = old.a6 || '본 계약으로 제작된 광고물의 저작권은 을에게 귀속되며, 갑은 계약 기간 내에 한하여 이를 사용할 수 있다.'
  const a7 = old.a7 || '양 당사자는 본 계약을 통해 알게 된 상대방의 업무상 비밀을 제3자에게 누설하여서는 아니 된다.'
  const a8 = old.a8 || '일방이 계약상 의무를 이행하지 않을 경우, 상대방은 30일 이상의 유예기간을 두고 서면으로 통지하여 계약을 해지할 수 있다.'
  const a9 = old.a9 || '본 계약에 관한 분쟁이 발생할 경우 부산지방법원을 관할 법원으로 한다.'

  const fullText = `제1조 (목적)
${a1}

제2조 (업무의 범위)
을은 다음의 업무를 대행한다.
{{견적서내용}}

제3조 (계약 기간)
본 계약의 기간은 {{계약시작일}}부터 {{계약종료일}}까지로 한다.

제4조 (광고 비용 및 대금 지급)
1. 공급가액: {{합계금액}}
   부가세(10%): {{부가세금액}}
   최종 지급액: {{최종금액}} ({{부가세}})
   • 예산 세부 내역(매체비, 제작비, 대행 수수료 등)은 별첨된 견적서에 따른다.
2. 지급 방법:
${a4}

제5조 (광고물 승인)
${a5}

제6조 (저작권)
${a6}

제7조 (비밀유지)
${a7}

제8조 (계약의 해지)
${a8}

제9조 (관할법원)
${a9}`

  return { fullText }
}
