import { INDICATOR_MAP } from '@/lib/ecos'
import { formatDate } from '@/lib/utils/date'
import { Card, CardContent } from '@/components/ui/card'
import { Sparkline } from './sparkline'

interface FeaturedIndicatorCardProps {
  indicatorCode: string
  value: number
  unitName: string | null
  timeLabel: string
  previousValue: number | null
  history: number[]
}

export function FeaturedIndicatorCard({
  indicatorCode,
  value,
  unitName,
  timeLabel,
  previousValue,
  history,
}: FeaturedIndicatorCardProps) {
  const def = INDICATOR_MAP[indicatorCode]
  if (!def) return null

  const change = previousValue && previousValue !== 0
    ? ((value - previousValue) / Math.abs(previousValue)) * 100
    : null

  const isUp = change !== null && change > 0
  const isDown = change !== null && change < 0

  return (
    <Card className={`relative gap-2 overflow-hidden py-4 transition-shadow hover:shadow-md ${
      isUp ? 'bg-gradient-to-br from-red-50/50 to-transparent dark:from-red-950/20' :
      isDown ? 'bg-gradient-to-br from-blue-50/50 to-transparent dark:from-blue-950/20' :
      ''
    }`}>
      <CardContent className="space-y-1">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <p className="text-xs font-medium text-muted-foreground">{def.label}</p>
            <p className="text-2xl font-bold tabular-nums sm:text-3xl">
              {formatFeaturedValue(value, def.unit)}
            </p>
            {change !== null && (
              <div className={`flex items-center gap-1 text-sm font-semibold tabular-nums ${getChangeColor(change)}`}>
                <span>{getChangeArrow(change)}</span>
                <span>{formatChange(change)}</span>
              </div>
            )}
            {change === null && previousValue === null && (
              <div className="text-sm text-muted-foreground">─</div>
            )}
          </div>
          <div className="flex flex-col items-end gap-1">
            {history.length >= 2 ? (
              <Sparkline values={history} width={120} height={40} />
            ) : (
              <div className="flex h-10 w-[120px] items-center justify-center text-xs text-muted-foreground">─</div>
            )}
          </div>
        </div>
        <div className="text-xs text-muted-foreground">
          {unitName ?? def.unit} · {formatDate(timeLabel)}
        </div>
      </CardContent>
    </Card>
  )
}

function formatFeaturedValue(value: number, unit: string): string {
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
