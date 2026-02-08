import { INDICATORS, WIDGET_INDICATOR_CODES } from '@/lib/ecos'
import { IndicatorCard } from './indicator-card'

interface IndicatorData {
  indicator_code: string
  data_value: number
  unit_name: string | null
  time_label: string
}

interface IndicatorsGridProps {
  indicators: IndicatorData[]
  previousIndicators: IndicatorData[]
  historyMap: Record<string, number[]>
}

/**
 * 균일 카드 그리드 — 모든 지표를 동일한 카드 포맷으로 표시
 * 정렬: Featured 4개 먼저 → 나머지는 INDICATORS 배열 순서
 */
export function IndicatorsGrid({
  indicators,
  previousIndicators,
  historyMap,
}: IndicatorsGridProps) {
  const prevMap = new Map(
    previousIndicators.map((p) => [p.indicator_code, p.data_value])
  )

  const dataMap = new Map(
    indicators.map((ind) => [ind.indicator_code, ind])
  )

  // Featured 코드 먼저, 나머지는 INDICATORS 배열 순서
  const featuredSet = new Set<string>(WIDGET_INDICATOR_CODES)
  const sorted: IndicatorData[] = []

  // 1. Featured 순서대로
  for (const code of WIDGET_INDICATOR_CODES) {
    const ind = dataMap.get(code)
    if (ind) sorted.push(ind)
  }

  // 2. 나머지는 INDICATORS 배열 순서 (카테고리별 자연 정렬)
  for (const def of INDICATORS) {
    if (featuredSet.has(def.code)) continue
    const ind = dataMap.get(def.code)
    if (ind) sorted.push(ind)
  }

  return (
    <div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {sorted.map((ind) => (
          <IndicatorCard
            key={ind.indicator_code}
            indicatorCode={ind.indicator_code}
            value={ind.data_value}
            unitName={ind.unit_name}
            timeLabel={ind.time_label}
            previousValue={prevMap.get(ind.indicator_code) ?? null}
            history={historyMap[ind.indicator_code] ?? []}
          />
        ))}
      </div>
      <p className="mt-4 text-[11px] text-muted-foreground">
        출처: 한국은행 경제통계시스템(ECOS)
      </p>
    </div>
  )
}
