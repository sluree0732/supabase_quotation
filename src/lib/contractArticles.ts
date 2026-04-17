export interface ContractArticles {
  [key: string]: string
  a1: string          // 제1조 목적
  a4_payment: string  // 제4조 지급 방법 설명
  a5: string          // 제5조 광고물 승인
  a6: string          // 제6조 저작권
  a7: string          // 제7조 비밀유지
  a8: string          // 제8조 계약의 해지
  a9: string          // 제9조 관할법원
}

export const DEFAULT_ARTICLES: ContractArticles = {
  a1: '본 계약은 갑이 을에게 광고 대행 업무를 위탁하고, 을이 이를 성실히 수행함으로써 상호 이익을 도모함을 목적으로 한다.',
  a4_payment: '- 선금 (50%): 계약 체결 후 3일 이내 지급\n- 잔금 (50%): 광고 집행 완료 및 최종 보고서 제출 후 7일 이내 지급',
  a5: '을은 광고 제작 시 갑의 사전 승인을 받아야 하며, 갑은 을의 요청에 대해 지체 없이 승인 여부를 통보하여야 한다.',
  a6: '본 계약으로 제작된 광고물의 저작권은 을에게 귀속되며, 갑은 계약 기간 내에 한하여 이를 사용할 수 있다.',
  a7: '양 당사자는 본 계약을 통해 알게 된 상대방의 업무상 비밀을 제3자에게 누설하여서는 아니 된다.',
  a8: '일방이 계약상 의무를 이행하지 않을 경우, 상대방은 30일 이상의 유예기간을 두고 서면으로 통지하여 계약을 해지할 수 있다.',
  a9: '본 계약에 관한 분쟁이 발생할 경우 부산지방법원을 관할 법원으로 한다.',
}

export function mergeArticles(saved: Partial<ContractArticles> | null | undefined): ContractArticles {
  return {
    ...DEFAULT_ARTICLES,
    ...(saved ?? {}),
  } as ContractArticles
}
