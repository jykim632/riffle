import { INDICATOR_MAP } from '@/lib/ecos'
import { formatDate } from '@/lib/utils/date'
import { Card, CardContent } from '@/components/ui/card'
import { Sparkline } from './sparkline'

interface IndicatorCardProps {
  indicatorCode: string
  value: number
  unitName: string | null
  timeLabel: string
  previousValue: number | null
  history: number[]
}

export function IndicatorCard({
  indicatorCode,
  value,
  unitName,
  timeLabel,
  previousValue,
  history,
}: IndicatorCardProps) {
  const def = INDICATOR_MAP[indicatorCode]
  if (!def) return null

  const change =
    previousValue && previousValue !== 0
      ? ((value - previousValue) / Math.abs(previousValue)) * 100
      : null

  return (
    <Card className="gap-0 overflow-hidden py-3 transition-colors hover:bg-muted/40">
      <CardContent className="space-y-2 px-4">
        {/* 라벨 */}
        <p className="text-xs font-medium text-muted-foreground truncate">
          {def.label}
        </p>

        {/* 값 + 변동률 */}
        <div className="flex items-baseline gap-2">
          <p className="text-lg font-bold tabular-nums">
            {formatValue(value, def.unit)}
          </p>
          {change !== null && (
            <span
              className={`text-xs font-semibold tabular-nums ${getChangeColor(change)}`}
            >
              {getChangeArrow(change)}
              {formatChange(change)}
            </span>
          )}
        </div>

        {/* 스파크라인 */}
        {history.length >= 2 && (
          <Sparkline values={history} width="100%" height={32} />
        )}

        {/* 메타 */}
        <div className="text-[11px] text-muted-foreground">
          <p>{unitName ?? def.unit}</p>
          <p>{formatDate(timeLabel)}</p>
        </div>
      </CardContent>
    </Card>
  )
}

function formatValue(value: number, unit: string): string {
  if (unit === '원' || unit === '백만달러' || unit === 'pt') {
    return value.toLocaleString('ko-KR', { maximumFractionDigits: 2 })
  }
  if (unit === '%') return value.toFixed(2)
  if (unit === '$/배럴') return value.toFixed(2)
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
