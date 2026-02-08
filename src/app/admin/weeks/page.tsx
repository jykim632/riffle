import { createClient } from '@/lib/supabase/server'
import { WeeksList } from '@/components/admin/weeks/weeks-list'
import { SeasonSelector } from '@/components/admin/weeks/season-selector'

interface WeeksPageProps {
  searchParams: Promise<{ season?: string }>
}

export default async function WeeksPage({ searchParams }: WeeksPageProps) {
  const params = await searchParams
  const supabase = await createClient()

  // 전체 시즌 조회 (최신순)
  const { data: seasons } = await supabase
    .from('seasons')
    .select('id, name, is_active')
    .order('created_at', { ascending: false })

  // 선택된 시즌 (없으면 활성 시즌, 그것도 없으면 첫 번째 시즌)
  const selectedSeasonId =
    params.season ||
    seasons?.find((s) => s.is_active)?.id ||
    seasons?.[0]?.id

  // 선택된 시즌의 주차 조회 (주차 번호순)
  const { data: weeks } = selectedSeasonId
    ? await supabase
        .from('weeks')
        .select('*')
        .eq('season_id', selectedSeasonId)
        .order('week_number', { ascending: true })
    : { data: null }

  const selectedSeason = seasons?.find((s) => s.id === selectedSeasonId)

  return (
    <div>
      <div className="mb-4 sm:mb-6">
        <div>
          <h1 className="text-2xl font-bold sm:text-3xl">주차 관리</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            시즌별 주차 목록 및 현재 주차 설정
          </p>
        </div>
      </div>

      {seasons && seasons.length > 0 ? (
        <>
          <div className="mb-4">
            <SeasonSelector
              seasons={seasons}
              selectedSeasonId={selectedSeasonId}
            />
          </div>

          {selectedSeason && (
            <div className="mb-4">
              <p className="text-sm text-muted-foreground">
                <span className="font-medium text-foreground">
                  {selectedSeason.name}
                </span>
                {selectedSeason.is_active && (
                  <span className="ml-2 text-green-600">(활성 시즌)</span>
                )}
              </p>
            </div>
          )}

          <WeeksList weeks={weeks || []} />
        </>
      ) : (
        <div className="rounded-lg border border-dashed p-8 text-center">
          <p className="text-muted-foreground">
            등록된 시즌이 없습니다. 먼저 시즌을 생성해주세요.
          </p>
        </div>
      )}
    </div>
  )
}
