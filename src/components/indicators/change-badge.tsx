import { TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

interface ChangeBadgeProps {
  current: number
  previous: number | null
}

/**
 * 변동률 표시 배지
 */
export function ChangeBadge({ current, previous }: ChangeBadgeProps) {
  if (previous === null || previous === 0) {
    return (
      <Badge variant="outline" className="gap-1 text-xs">
        <Minus className="h-3 w-3" />
        -
      </Badge>
    )
  }

  const change = ((current - previous) / Math.abs(previous)) * 100
  const isUp = change > 0
  const isFlat = Math.abs(change) < 0.01

  if (isFlat) {
    return (
      <Badge variant="outline" className="gap-1 text-xs">
        <Minus className="h-3 w-3" />
        0.00%
      </Badge>
    )
  }

  return (
    <Badge
      variant="outline"
      className={`gap-1 text-xs ${
        isUp ? 'text-red-600 dark:text-red-400' : 'text-blue-600 dark:text-blue-400'
      }`}
    >
      {isUp ? (
        <TrendingUp className="h-3 w-3" />
      ) : (
        <TrendingDown className="h-3 w-3" />
      )}
      {isUp ? '+' : ''}
      {change.toFixed(2)}%
    </Badge>
  )
}
