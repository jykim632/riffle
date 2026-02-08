import { Card, CardContent } from '@/components/ui/card'

function SkeletonCard() {
  return (
    <Card className="gap-3 py-4">
      <CardContent className="space-y-2">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <div className="h-3 w-20 animate-pulse rounded bg-muted" />
            <div className="h-6 w-24 animate-pulse rounded bg-muted" />
          </div>
          <div className="h-6 w-20 animate-pulse rounded bg-muted" />
        </div>
        <div className="flex items-center justify-between">
          <div className="h-3 w-16 animate-pulse rounded bg-muted" />
          <div className="h-5 w-14 animate-pulse rounded-full bg-muted" />
        </div>
      </CardContent>
    </Card>
  )
}

export default function IndicatorsLoading() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
      <div className="space-y-6">
        {/* 헤더 스켈레톤 */}
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-2">
            <div className="h-8 w-32 animate-pulse rounded bg-muted" />
            <div className="h-4 w-56 animate-pulse rounded bg-muted" />
          </div>
          <div className="h-9 w-[200px] animate-pulse rounded bg-muted" />
        </div>

        {/* 카드 그리드 스켈레톤 */}
        <div>
          <div className="mb-3 h-4 w-12 animate-pulse rounded bg-muted" />
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
