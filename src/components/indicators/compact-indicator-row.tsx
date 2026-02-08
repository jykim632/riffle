import { INDICATOR_MAP } from '@/lib/ecos'
import { formatDate } from '@/lib/utils/date'
import { Sparkline } from './sparkline'

interface CompactIndicatorRowProps {
  indicatorCode: string
  value: number
  unitName: string | null
  timeLabel: string
  previousValue: number | null
  history: number[]
}

export function CompactIndicatorRow({
  indicatorCode,
  value,
  unitName,
  timeLabel,
  previousValue,
  history,
}: CompactIndicatorRowProps) {
  const def = INDICATOR_MAP[indicatorCode]
  if (!def) return null

  const change = previousValue && previousValue !== 0
    ? ((value - previousValue) / Math.abs(previousValue)) * 100
    : null

  return (
    <div className="flex items-center gap-3 rounded-lg px-3 py-2.5 transition-colors hover:bg-muted/50 sm:gap-4">
      {/* 라벨 */}
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium truncate">{def.label}</p>
        <p className="text-xs text-muted-foreground">
          {unitName ?? def.unit} · {formatDate(timeLabel)}
        </p>
      </div>

      {/* 스파크라인 */}
      <div className="hidden sm:block">
        {history.length >= 2 ? (
          <Sparkline values={history} width={60} height={20} />
        ) : (
          <div className="flex h-5 w-[60px] items-center justify-center text-xs text-muted-foreground">─</div>
        )}
      </div>

      {/* 값 */}
      <div className="text-right">
        <p className="text-sm font-semibold tabular-nums">
          {formatCompactValue(value, def.unit)}
        </p>
      </div>

      {/* 변동률 */}
      <div className="w-20 text-right">
        {change !== null ? (
          <span className={`text-sm font-medium tabular-nums ${getChangeColor(change)}`}>
            {getChangeArrow(change)}{formatChange(change)}
          </span>
        ) : (
          <span className="text-sm text-muted-foreground">─</span>
        )}
      </div>
    </div>
  )
}

function formatCompactValue(value: number, unit: string): string {
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
