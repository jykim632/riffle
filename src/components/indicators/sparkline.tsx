interface SparklineProps {
  values: number[]
  width?: number | string
  height?: number
  className?: string
}

// viewBox 계산용 내부 너비 (string width일 때 사용)
const INTERNAL_WIDTH = 120

/**
 * SVG polyline 기반 미니 스파크라인 차트 (area fill 포함)
 * width에 number를 넘기면 고정 픽셀, string("100%")을 넘기면 CSS width로 사용
 */
export function Sparkline({
  values,
  width = 80,
  height = 24,
  className,
}: SparklineProps) {
  if (values.length < 2) return null

  const vbWidth = typeof width === 'number' ? width : INTERNAL_WIDTH
  const min = Math.min(...values)
  const max = Math.max(...values)
  const range = max - min || 1
  const padding = 2

  const coords = values.map((v, i) => {
    const x = (i / (values.length - 1)) * (vbWidth - padding * 2) + padding
    const y = height - padding - ((v - min) / range) * (height - padding * 2)
    return { x, y }
  })

  const linePoints = coords.map(({ x, y }) => `${x},${y}`).join(' ')

  // Area fill: line path + close along bottom
  const areaPath = [
    `M ${coords[0].x},${coords[0].y}`,
    ...coords.slice(1).map(({ x, y }) => `L ${x},${y}`),
    `L ${coords[coords.length - 1].x},${height}`,
    `L ${coords[0].x},${height}`,
    'Z',
  ].join(' ')

  // 한국 관례: 상승=빨강, 하락=파랑
  const isUp = values[values.length - 1] >= values[0]
  const strokeColor = isUp ? 'var(--color-red-500, #ef4444)' : 'var(--color-blue-500, #3b82f6)'
  const fillColor = isUp ? 'var(--color-red-500, #ef4444)' : 'var(--color-blue-500, #3b82f6)'

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${vbWidth} ${height}`}
      preserveAspectRatio={typeof width === 'string' ? 'none' : undefined}
      className={className}
    >
      <path
        d={areaPath}
        fill={fillColor}
        opacity={0.1}
      />
      <polyline
        fill="none"
        stroke={strokeColor}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
        points={linePoints}
      />
    </svg>
  )
}
