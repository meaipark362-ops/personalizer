/**
 * PERSONALIZER — Site configuration (single source of truth)
 *
 * 팀이 확정해야 하는 값은 모두 여기에서 관리합니다.
 * 값이 비어 있으면(null / '') 사이트는 "준비 중" 상태로 안전하게 표시되며,
 * 존재하지 않는 URL이나 정책 문서를 임의로 연결하지 않습니다.
 */
window.PERSONALIZER_CONFIG = Object.freeze({
  /** 요금제 — Plus(월 9,000원 / 연 90,000원) / Pro(월 12,000원 / 연 120,000원) */
  plans: Object.freeze({
    plus: Object.freeze({
      id: 'plus',
      name: 'Personalizer Plus',
      amount: 9000,
      period: '월',
      cycleLabel: '월 9,000원 (1개월 단위 구독)',
      priceNotice: '추후 가격은 변동될 수 있습니다.',
      summary: '기본적인 PC 제어와 간편한 사용자 맞춤 설정',
      monthly: Object.freeze({
        amount: 9000,
        period: '월',
        cycleLabel: '월 9,000원 (1개월 단위 구독)',
        displayAmt: '9,000',
        note: '언제든 해지 가능'
      }),
      annual: Object.freeze({
        amount: 90000,
        period: '년',
        cycleLabel: '연 90,000원 (12개월 단위 구독 · 2개월 무료)',
        displayAmt: '90,000',
        equivMonthly: '월 7,500원 상당',
        note: '연간 결제 시 18,000원 절약'
      })
    }),
    pro: Object.freeze({
      id: 'pro',
      name: 'Personalizer Pro',
      amount: 12000,
      period: '월',
      cycleLabel: '월 12,000원 (1개월 단위 구독)',
      priceNotice: '추후 가격은 변동될 수 있습니다.',
      summary: 'OpenClaw 기반 AI 프리셋 & 전문 커스텀',
      monthly: Object.freeze({
        amount: 12000,
        period: '월',
        cycleLabel: '월 12,000원 (1개월 단위 구독)',
        displayAmt: '12,000',
        note: '고급 기능 확장 지원'
      }),
      annual: Object.freeze({
        amount: 120000,
        period: '년',
        cycleLabel: '연 120,000원 (12개월 단위 구독 · 2개월 무료)',
        displayAmt: '120,000',
        equivMonthly: '월 10,000원 상당',
        note: '연간 결제 시 24,000원 절약'
      })
    }),
    // 하위 호환성 별칭
    lite: Object.freeze({ id: 'plus', name: 'Personalizer Plus', amount: 9000, period: '월', cycleLabel: '월 9,000원 (1개월 단위 구독)', priceNotice: '추후 가격은 변동될 수 있습니다.' }),
    monthly: Object.freeze({ id: 'pro', name: 'Personalizer Pro', amount: 12000, period: '월', cycleLabel: '월 12,000원 (1개월 단위 구독)', priceNotice: '추후 가격은 변동될 수 있습니다.' }),
    annual:  Object.freeze({ id: 'pro', name: 'Personalizer Pro', amount: 120000, period: '년', cycleLabel: '연 120,000원 (12개월 단위 구독)', priceNotice: '추후 가격은 변동될 수 있습니다.' })
  }),
  currency: 'KRW',

  /** 사용자 의견 설문 URL — 팀이 제공한 실제 주소로 교체하세요. 비어 있으면 버튼이 '준비 중'으로 표시됩니다. */
  surveyUrl: 'https://docs.google.com/forms/d/e/1FAIpQLScDKBqQfbhxk9b5M7-eANxmBFv4weJ2-WlJsUs0KMSc_Q266Q/viewform',

  /** 문의처 — 예: 'mailto:team@example.com' (실제 주소 확정 후 입력) */
  contact: Object.freeze({ email: '', label: '' }),

  /** 정책 문서 — 실제 문서가 준비되면 상대 경로 또는 URL 입력 */
  legal: Object.freeze({ privacyUrl: '', termsUrl: '' }),

  /**
   * 결제 연동 설정
   * provider 가 null 이면 결제 버튼은 '미연동' 안내만 표시하고 어떤 결제도 진행하지 않습니다.
   * 연동 시: provider 이름(예: 'toss', 'portone', 'stripe')과
   *          서버의 결제 세션 생성 엔드포인트(createSessionEndpoint)를 지정하세요.
   * 카드번호 등 민감 정보는 절대 이 사이트에서 직접 수집하지 않습니다.
   */
  payment: Object.freeze({
    provider: null,
    createSessionEndpoint: ''
  })
});
