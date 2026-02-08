import { requireUser } from '@/lib/auth'
import { getCurrentSeason, getSeasonWeeks } from '@/lib/queries/season'
import { getIndicatorsByWeek, getPreviousIndicators } from '@/lib/queries/indicators'
import { EmptyState } from '@/components/empty-state'
import { IndicatorsGrid } from '@/components/indicators/indicators-grid'
import { IndicatorWeekSelect } from '@/components/indicators/week-select'

interface SearchParams {
  week?: string
}

export default async function IndicatorsPage(props: { searchParams: Promise<SearchParams> }) {
  const searchParams = await props.searchParams
  const { supabase } = await requireUser()

  // 시즌 + 주차 목록
  const currentSeason = await getCurrentSeason(supabase)
  if (!currentSeason) {
    return <EmptyState title="현재 시즌이 없어요" description="관리자에게 시즌 생성을 요청하세요." />
  }

  const weeks = await getSeasonWeeks(supabase, currentSeason.id, false)
  if (weeks.length === 0) {
    return <EmptyState title="주차가 없어요" description="관리자에게 주차 생성을 요청하세요." />
  }

  // 선택된 주차 (기본: 현재 주차)
  const selectedWeekId =
    searchParams.week ?? weeks.find((w) => w.is_current)?.id ?? weeks[0].id

  // 지표 데이터
  const [indicators, previousIndicators] = await Promise.all([
    getIndicatorsByWeek(supabase, selectedWeekId),
    getPreviousIndicators(supabase, selectedWeekId),
  ])

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
      <div className="space-y-6">
        {/* 헤더 */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold sm:text-3xl">경제지표</h1>
            <p className="mt-1 text-sm text-muted-foreground sm:text-base">
              주요 거시경제 지표를 한눈에 확인하세요
            </p>
          </div>
          <IndicatorWeekSelect weeks={weeks} currentWeekId={selectedWeekId} />
        </div>

        {/* 지표 그리드 */}
        {indicators.length > 0 ? (
          <IndicatorsGrid
            indicators={indicators}
            previousIndicators={previousIndicators}
            historyMap={{}}
          />
        ) : (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <h2 className="mb-4 text-xl font-semibold">지표 데이터가 없어요</h2>
            <p className="text-muted-foreground">
              해당 주차의 경제지표가 아직 수집되지 않았습니다
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
