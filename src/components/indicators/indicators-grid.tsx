import { CATEGORY_ORDER, INDICATOR_MAP, type IndicatorCategory } from '@/lib/ecos'
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
 * 카테고리별 경제지표 그리드
 */
export function IndicatorsGrid({
  indicators,
  previousIndicators,
  historyMap,
}: IndicatorsGridProps) {
  // 카테고리별 그룹핑
  const grouped = new Map<IndicatorCategory, IndicatorData[]>()
  for (const ind of indicators) {
    const def = INDICATOR_MAP[ind.indicator_code]
    if (!def) continue
    const list = grouped.get(def.category) ?? []
    list.push(ind)
    grouped.set(def.category, list)
  }

  // 이전 값 맵
  const prevMap = new Map(
    previousIndicators.map((p) => [p.indicator_code, p.data_value])
  )

  return (
    <div className="space-y-6">
      {CATEGORY_ORDER.map((category) => {
        const items = grouped.get(category)
        if (!items || items.length === 0) return null

        return (
          <section key={category}>
            <h3 className="mb-3 text-sm font-semibold text-muted-foreground">
              {category}
            </h3>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {items.map((ind) => (
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
          </section>
        )
      })}
    </div>
  )
}
