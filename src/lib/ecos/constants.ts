/**
 * 한국은행 ECOS API 지표 정의
 * https://ecos.bok.or.kr/api/#/
 */

export type IndicatorCycle = 'daily' | 'monthly' | 'quarterly'

export type IndicatorCategory =
  | '환율'
  | '금리'
  | '채권'
  | '주가'
  | '물가'
  | '성장'
  | '고용'
  | '무역'
  | '원자재'

export interface IndicatorDef {
  code: string
  label: string
  statCode: string
  itemCode1: string
  itemCode2?: string
  cycle: IndicatorCycle
  unit: string
  category: IndicatorCategory
}

export const INDICATORS: IndicatorDef[] = [
  // 환율
  {
    code: 'USD_KRW',
    label: '원/달러 환율',
    statCode: '731Y001',
    itemCode1: '0000001',
    cycle: 'daily',
    unit: '원',
    category: '환율',
  },
  {
    code: 'JPY_KRW',
    label: '원/엔 환율 (100엔)',
    statCode: '731Y001',
    itemCode1: '0000002',
    cycle: 'daily',
    unit: '원',
    category: '환율',
  },
  // 금리
  {
    code: 'BASE_RATE',
    label: '한은 기준금리',
    statCode: '722Y001',
    itemCode1: '0101000',
    cycle: 'daily',
    unit: '%',
    category: '금리',
  },
  {
    code: 'FED_RATE',
    label: '미국 기준금리',
    statCode: '902Y006',
    itemCode1: 'US',
    cycle: 'monthly',
    unit: '%',
    category: '금리',
  },
  // 채권
  {
    code: 'GOV_BOND_3Y',
    label: '국고채 3년',
    statCode: '817Y002',
    itemCode1: '010200000',
    cycle: 'daily',
    unit: '%',
    category: '채권',
  },
  // 주가
  {
    code: 'KOSPI',
    label: '코스피',
    statCode: '802Y001',
    itemCode1: '0001000',
    cycle: 'daily',
    unit: 'pt',
    category: '주가',
  },
  {
    code: 'KOSDAQ',
    label: '코스닥',
    statCode: '802Y001',
    itemCode1: '0089000',
    cycle: 'daily',
    unit: 'pt',
    category: '주가',
  },
  // 물가
  {
    code: 'CPI',
    label: '소비자물가지수',
    statCode: '901Y009',
    itemCode1: '0',
    cycle: 'monthly',
    unit: '2020=100',
    category: '물가',
  },
  // 성장
  {
    code: 'GDP_GROWTH',
    label: 'GDP 성장률',
    statCode: '902Y015',
    itemCode1: 'KOR',
    cycle: 'quarterly',
    unit: '%',
    category: '성장',
  },
  // 고용
  {
    code: 'UNEMPLOYMENT',
    label: '실업률',
    statCode: '901Y027',
    itemCode1: 'I61BC',
    itemCode2: 'I28A',
    cycle: 'monthly',
    unit: '%',
    category: '고용',
  },
  // 무역
  {
    code: 'TRADE_BALANCE',
    label: '무역수지',
    statCode: '301Y013',
    itemCode1: '100000',
    cycle: 'monthly',
    unit: '백만달러',
    category: '무역',
  },
  // 원자재
  {
    code: 'OIL_DUBAI',
    label: '국제유가 (두바이)',
    statCode: '902Y003',
    itemCode1: '010102',
    cycle: 'monthly',
    unit: '$/배럴',
    category: '원자재',
  },
]

export const INDICATOR_MAP = Object.fromEntries(
  INDICATORS.map((ind) => [ind.code, ind])
) as Record<string, IndicatorDef>

/**
 * 카테고리 표시 순서
 */
export const CATEGORY_ORDER: IndicatorCategory[] = [
  '환율',
  '금리',
  '채권',
  '주가',
  '물가',
  '성장',
  '고용',
  '무역',
  '원자재',
]

/**
 * 대시보드 위젯에 표시할 핵심 지표 4개
 */
export const WIDGET_INDICATOR_CODES = [
  'USD_KRW',
  'KOSPI',
  'BASE_RATE',
  'CPI',
] as const
