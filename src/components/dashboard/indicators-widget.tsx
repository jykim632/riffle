import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardAction, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { INDICATOR_MAP, WIDGET_INDICATOR_CODES } from '@/lib/ecos'

interface WidgetIndicator {
  indicator_code: string
  data_value: number
  unit_name: string | null
  time_label: string
}

interface IndicatorsWidgetProps {
  indicators: WidgetIndicator[]
}

/**
 * 대시보드 경제지표 위젯 (핵심 4개 지표)
 */
export function IndicatorsWidget({ indicators }: IndicatorsWidgetProps) {
  if (indicators.length === 0) return null

  // 위젯 순서대로 정렬
  const ordered = WIDGET_INDICATOR_CODES
    .map((code) => indicators.find((ind) => ind.indicator_code === code))
    .filter(Boolean) as WidgetIndicator[]

  if (ordered.length === 0) return null

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">경제지표</CardTitle>
        <CardAction>
          <Button variant="ghost" size="sm" className="h-8 gap-1 text-xs" asChild>
            <Link href="/indicators">
              더보기
              <ArrowRight className="h-3 w-3" />
            </Link>
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {ordered.map((ind) => {
            const def = INDICATOR_MAP[ind.indicator_code]
            if (!def) return null

            return (
              <div key={ind.indicator_code} className="space-y-1">
                <p className="text-xs text-muted-foreground">{def.label}</p>
                <p className="text-sm font-bold tabular-nums">
                  {formatWidgetValue(ind.data_value, def.unit)}
                </p>
                <p className="text-xs text-muted-foreground">
                  {ind.unit_name ?? def.unit}
                </p>
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
    return value.toLocaleString('ko-KR', { maximumFractionDigits: 2 })
  }
  if (unit === '%') return value.toFixed(2)
  return value.toLocaleString('ko-KR', { maximumFractionDigits: 2 })
}
