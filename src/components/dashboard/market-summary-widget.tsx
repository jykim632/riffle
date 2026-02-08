import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { INDICATOR_MAP, WIDGET_INDICATOR_CODES } from '@/lib/ecos'

interface WidgetIndicator {
  indicator_code: string
  data_value: number
  unit_name: string | null
  time_label: string
}

interface MarketSummaryWidgetProps {
  indicators: WidgetIndicator[]
  previousIndicators: WidgetIndicator[]
}

export function MarketSummaryWidget({ indicators, previousIndicators }: MarketSummaryWidgetProps) {
  if (indicators.length === 0) return null

  const prevMap = new Map(
    previousIndicators.map((p) => [p.indicator_code, p.data_value])
  )

  const ordered = WIDGET_INDICATOR_CODES
    .map((code) => indicators.find((ind) => ind.indicator_code === code))
    .filter(Boolean) as WidgetIndicator[]

  if (ordered.length === 0) return null

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">시장 요약</CardTitle>
          <Link
            href="/indicators"
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            전체 보기
            <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-3 overflow-x-auto sm:gap-5">
          {ordered.map((ind, i) => {
            const def = INDICATOR_MAP[ind.indicator_code]
            if (!def) return null

            const prev = prevMap.get(ind.indicator_code)
            const change = prev && prev !== 0
              ? ((ind.data_value - prev) / Math.abs(prev)) * 100
              : null

            return (
              <div key={ind.indicator_code} className="flex shrink-0 items-center gap-1.5">
                <span className="text-xs text-muted-foreground">{def.label}</span>
                <span className="text-sm font-bold tabular-nums">
                  {formatWidgetValue(ind.data_value, def.unit)}
                </span>
                {change !== null ? (
                  <span className={`text-xs font-medium tabular-nums ${getChangeColor(change)}`}>
                    {getChangeArrow(change)}{formatChange(change)}
                  </span>
                ) : (
                  <span className="text-xs text-muted-foreground">─</span>
                )}
                {i < ordered.length - 1 && (
                  <span className="ml-1 text-border sm:ml-2">|</span>
                )}
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}

function formatWidgetValue(value: number, unit: string): string {
  if (unit === '원' || unit === 'pt') {
    return value.toLocaleString('ko-KR', { maximumFractionDigits: 0 })
  }
  if (unit === '%') return value.toFixed(2) + '%'
  if (unit === '2020=100') return value.toFixed(1)
  return value.toLocaleString('ko-KR', { maximumFractionDigits: 2 })
}

function getChangeColor(change: number): string {
  if (Math.abs(change) < 0.01) return 'text-muted-foreground'
  return change > 0
    ? 'text-red-600 dark:text-red-400'
    : 'text-blue-600 dark:text-blue-400'
}

function getChangeArrow(change: number): string {
  if (Math.abs(change) < 0.01) return '─'
  return change > 0 ? '▲' : '▼'
}

function formatChange(change: number): string {
  if (Math.abs(change) < 0.01) return '0.00%'
  return `${change > 0 ? '+' : ''}${change.toFixed(2)}%`
}
