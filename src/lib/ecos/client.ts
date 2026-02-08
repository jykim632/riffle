import { INDICATORS, type IndicatorDef } from './constants'
import { ecosResponseSchema, type NormalizedIndicator } from './types'

const ECOS_BASE_URL = 'https://ecos.bok.or.kr/api'
const DELAY_MS = 100

function getDateRange(def: IndicatorDef): { startDate: string; endDate: string; period: string } {
  // 어제(KST) 기준으로 조회 — ECOS 데이터는 당일에 아직 안 올라올 수 있음
  const yesterday = new Date(Date.now() + 9 * 60 * 60 * 1000) // KST
  yesterday.setDate(yesterday.getDate() - 1)

  switch (def.cycle) {
    case 'daily': {
      const start = new Date(yesterday)
      start.setDate(start.getDate() - 30)
      return { startDate: formatDate(start), endDate: formatDate(yesterday), period: 'D' }
    }
    case 'monthly': {
      const start = new Date(yesterday)
      start.setMonth(start.getMonth() - 6)
      return { startDate: formatMonth(start), endDate: formatMonth(yesterday), period: 'M' }
    }
    case 'quarterly': {
      const start = new Date(yesterday)
      start.setFullYear(start.getFullYear() - 2)
      return { startDate: formatQuarter(start), endDate: formatQuarter(yesterday), period: 'Q' }
    }
  }
}

function formatDate(d: Date): string {
  return d.toISOString().slice(0, 10).replace(/-/g, '')
}

function formatMonth(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  return `${y}${m}`
}

function formatQuarter(d: Date): string {
  const y = d.getFullYear()
  const q = Math.ceil((d.getMonth() + 1) / 3)
  return `${y}Q${q}`
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/**
 * 단일 지표 조회
 */
export async function fetchIndicator(
  def: IndicatorDef
): Promise<NormalizedIndicator | null> {
  const apiKey = process.env.ECOS_API_KEY
  if (!apiKey) throw new Error('ECOS_API_KEY 환경 변수가 설정되지 않았습니다.')

  const { startDate, endDate, period } = getDateRange(def)

  // ECOS는 시간순 정렬 — 마지막 row가 최신. 충분한 건수 요청
  const maxRows = def.cycle === 'daily' ? '50' : '20'
  const url = [
    ECOS_BASE_URL,
    'StatisticSearch',
    apiKey,
    'json',
    'kr',
    '1',
    maxRows,
    def.statCode,
    period,
    startDate,
    endDate,
    def.itemCode1,
    def.itemCode2 ?? '?',
    '?',
    '?',
  ].join('/')

  const res = await fetch(url, { cache: 'no-store' })
  if (!res.ok) {
    console.error(`[ECOS] ${def.code} 요청 실패: ${res.status}`)
    return null
  }

  const json = await res.json()

  // ECOS 에러 응답 처리
  if (json.RESULT) {
    console.error(`[ECOS] ${def.code} API 에러: ${json.RESULT.MESSAGE}`)
    return null
  }

  const parsed = ecosResponseSchema.safeParse(json)
  if (!parsed.success) {
    console.error(`[ECOS] ${def.code} 파싱 실패:`, parsed.error.message)
    return null
  }

  const rows = parsed.data.StatisticSearch.row
  // 가장 최근 데이터 (마지막 row)
  const latest = rows[rows.length - 1]
  if (!latest) return null

  const value = parseFloat(latest.DATA_VALUE.replace(/,/g, ''))
  if (isNaN(value)) {
    console.error(`[ECOS] ${def.code} 값 파싱 실패: ${latest.DATA_VALUE}`)
    return null
  }

  return {
    indicatorCode: def.code,
    statCode: def.statCode,
    itemCode: def.itemCode1,
    dataValue: value,
    unitName: latest.UNIT_NAME ?? def.unit,
    timeLabel: latest.TIME,
  }
}

/**
 * 전체 지표 순차 조회 (rate limit 보호)
 */
export async function fetchAllIndicators(): Promise<NormalizedIndicator[]> {
  const results: NormalizedIndicator[] = []

  for (const def of INDICATORS) {
    const result = await fetchIndicator(def)
    if (result) {
      results.push(result)
    }
    await sleep(DELAY_MS)
  }

  return results
}
