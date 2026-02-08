import { INDICATOR_MAP } from '@/lib/ecos'
import { Card, CardContent } from '@/components/ui/card'
import { Sparkline } from './sparkline'
import { ChangeBadge } from './change-badge'

interface IndicatorCardProps {
  indicatorCode: string
  value: number
  unitName: string | null
  timeLabel: string
  previousValue: number | null
  history: number[]
}

/**
 * 개별 경제지표 카드
 */
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

  const formattedValue = formatValue(value, def.unit)

  return (
    <Card className="gap-3 py-4">
      <CardContent className="space-y-2">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">{def.label}</p>
            <p className="text-lg font-bold tabular-nums">{formattedValue}</p>
          </div>
          <Sparkline values={history} />
        </div>
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">
            {unitName ?? def.unit} · {timeLabel}
          </span>
          <ChangeBadge current={value} previous={previousValue} />
        </div>
      </CardContent>
    </Card>
  )
}

function formatValue(value: number, unit: string): string {
  if (unit === '원' || unit === '백만달러' || unit === 'pt') {
    return value.toLocaleString('ko-KR', { maximumFractionDigits: 2 })
  }
  if (unit === '%') {
    return value.toFixed(2)
  }
  if (unit === '$/배럴') {
    return value.toFixed(2)
  }
  return value.toLocaleString('ko-KR', { maximumFractionDigits: 2 })
}
