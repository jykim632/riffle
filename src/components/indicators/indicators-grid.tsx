import { CATEGORY_ORDER, INDICATOR_MAP, WIDGET_INDICATOR_CODES, type IndicatorCategory } from '@/lib/ecos'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { FeaturedIndicatorCard } from './featured-indicator-card'
import { CompactIndicatorRow } from './compact-indicator-row'

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
 * Featured + Compact 경제지표 레이아웃
 * - 상단: 핵심 4개 지표 (2x2 그리드)
 * - 하단: 나머지 지표 카테고리별 컴팩트 행
 */
export function IndicatorsGrid({
  indicators,
  previousIndicators,
  historyMap,
}: IndicatorsGridProps) {
  const prevMap = new Map(
    previousIndicators.map((p) => [p.indicator_code, p.data_value])
  )

  // Featured vs Others 분리
  const featuredCodes = new Set<string>(WIDGET_INDICATOR_CODES)
  const featured = WIDGET_INDICATOR_CODES
    .map((code) => indicators.find((ind) => ind.indicator_code === code))
    .filter(Boolean) as IndicatorData[]

  const others = indicators.filter((ind) => !featuredCodes.has(ind.indicator_code))

  // 나머지 카테고리별 그룹핑
  const grouped = new Map<IndicatorCategory, IndicatorData[]>()
  for (const ind of others) {
    const def = INDICATOR_MAP[ind.indicator_code]
    if (!def) continue
    const list = grouped.get(def.category) ?? []
    list.push(ind)
    grouped.set(def.category, list)
  }

  return (
    <div className="space-y-6">
      {/* Featured 핵심 지표 */}
      {featured.length > 0 && (
        <section>
          <h3 className="mb-3 text-sm font-semibold text-muted-foreground">핵심 지표</h3>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {featured.map((ind) => (
              <FeaturedIndicatorCard
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
      )}

      {/* 나머지 지표 - 카테고리별 컴팩트 리스트 */}
      {CATEGORY_ORDER.map((category) => {
        const items = grouped.get(category)
        if (!items || items.length === 0) return null

        return (
          <section key={category}>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold text-muted-foreground">
                  {category}
                </CardTitle>
              </CardHeader>
              <CardContent className="px-1 pb-2 sm:px-3">
                <div className="divide-y">
                  {items.map((ind) => (
                    <CompactIndicatorRow
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
              </CardContent>
            </Card>
          </section>
        )
      })}
    </div>
  )
}
