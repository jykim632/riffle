interface SparklineProps {
  values: number[]
  width?: number
  height?: number
  className?: string
}

/**
 * SVG polyline 기반 미니 스파크라인 차트
 */
export function Sparkline({
  values,
  width = 80,
  height = 24,
  className,
}: SparklineProps) {
  if (values.length < 2) return null

  const min = Math.min(...values)
  const max = Math.max(...values)
  const range = max - min || 1
  const padding = 2

  const points = values
    .map((v, i) => {
      const x = (i / (values.length - 1)) * (width - padding * 2) + padding
      const y = height - padding - ((v - min) / range) * (height - padding * 2)
      return `${x},${y}`
    })
    .join(' ')

  // 마지막 값이 첫 값보다 높으면 상승색
  const isUp = values[values.length - 1] >= values[0]

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className={className}
    >
      <polyline
        fill="none"
        stroke={isUp ? 'var(--color-green-500, #22c55e)' : 'var(--color-red-500, #ef4444)'}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
        points={points}
      />
    </svg>
  )
}
