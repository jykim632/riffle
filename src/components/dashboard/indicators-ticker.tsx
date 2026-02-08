import Link from 'next/link'
import { INDICATOR_MAP, WIDGET_INDICATOR_CODES } from '@/lib/ecos'
import { formatDate } from '@/lib/utils/date'

interface TickerIndicator {
  indicator_code: string
  data_value: number
  unit_name: string | null
  time_label: string
}

interface IndicatorsTickerProps {
  indicators: TickerIndicator[]
  previousIndicators: TickerIndicator[]
}

export function IndicatorsTicker({ indicators, previousIndicators }: IndicatorsTickerProps) {
  if (indicators.length === 0) return null

  const prevMap = new Map(
    previousIndicators.map((p) => [p.indicator_code, p.data_value])
  )

  const ordered = WIDGET_INDICATOR_CODES
    .map((code) => indicators.find((ind) => ind.indicator_code === code))
    .filter(Boolean) as TickerIndicator[]

  if (ordered.length === 0) return null

  const baseDate = ordered[0]?.time_label ? formatDate(ordered[0].time_label) : ''

  const tickerItems = (
    <>
      {baseDate && (
        <span className="shrink-0 text-muted-foreground">{baseDate} 기준</span>
      )}
      {ordered.map((ind, i) => {
        const def = INDICATOR_MAP[ind.indicator_code]
        if (!def) return null

        const prev = prevMap.get(ind.indicator_code)
        const change = prev && prev !== 0
          ? ((ind.data_value - prev) / Math.abs(prev)) * 100
          : null

        return (
          <div key={ind.indicator_code} className="flex shrink-0 items-center gap-1">
            <span className="text-muted-foreground">{def.label}</span>
            <span className="font-medium tabular-nums">
              {formatTickerValue(ind.data_value, def.unit)}
            </span>
            {change !== null && (
              <span className={`tabular-nums font-medium ${getChangeColor(change)}`}>
                {getChangeArrow(change)}{formatChange(change)}
              </span>
            )}
            {i < ordered.length - 1 && (
              <span className="ml-2.5 text-border sm:ml-4">|</span>
            )}
          </div>
        )
      })}
    </>
  )

  return (
    <Link
      href="/indicators"
      className="block border-b bg-muted/50 transition-colors hover:bg-muted/80"
    >
      <div className="overflow-hidden">
        <div className="ticker-track flex w-max items-center gap-4 py-2 text-xs sm:gap-6">
          {/* 원본 */}
          <div className="flex shrink-0 items-center gap-4 px-4 sm:gap-6 sm:px-6 lg:px-8">
            {tickerItems}
          </div>
          {/* 복제 (심리스 루프용) */}
          <div className="flex shrink-0 items-center gap-4 px-4 sm:gap-6 sm:px-6 lg:px-8" aria-hidden>
            {tickerItems}
          </div>
        </div>
      </div>
    </Link>
  )
}

function formatTickerValue(value: number, unit: string): string {
  if (unit === '원') {
    return value.toLocaleString('ko-KR', { maximumFractionDigits: 0 }) + '원'
  }
  if (unit === 'pt') {
    return value.toLocaleString('ko-KR', { maximumFractionDigits: 2 }) + 'pt'
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
  const abs = Math.abs(change)
  return abs < 0.01 ? '' : `${change > 0 ? '+' : ''}${change.toFixed(2)}%`
}
