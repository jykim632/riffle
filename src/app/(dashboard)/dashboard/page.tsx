import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { WeekOverview } from '@/components/dashboard/week-overview'
import { CurrentWeekSummaries } from '@/components/dashboard/current-week-summaries'
import { isCurrentSeasonMember, isAdmin } from '@/lib/utils/season-membership'
import { NonMemberAlert } from '@/components/season/non-member-alert'

export default async function DashboardPage() {
  const supabase = await createClient()

  // 1. 현재 사용자 조회
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // 2. 현재 시즌 조회
  const { data: currentSeason } = await supabase
    .from('seasons')
    .select('*')
    .eq('is_active', true)
    .maybeSingle()

  if (!currentSeason) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <h1 className="mb-4 text-2xl font-bold">현재 시즌이 없어요</h1>
          <p className="text-muted-foreground">
            관리자에게 시즌 생성을 요청하세요.
          </p>
        </div>
      </div>
    )
  }

  // 3. 현재 주차 조회 (현재 시즌 내)
  const { data: currentWeek } = await supabase
    .from('weeks')
    .select('*')
    .eq('season_id', currentSeason.id)
    .eq('is_current', true)
    .maybeSingle()

  // 현재 주차가 없으면 빈 상태 표시
  if (!currentWeek) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <h1 className="mb-4 text-2xl font-bold">현재 주차가 없어요</h1>
          <p className="text-muted-foreground">
            관리자에게 주차 생성을 요청하세요.
          </p>
        </div>
      </div>
    )
  }

  // 4. 멤버십 확인
  const member = await isCurrentSeasonMember(user.id)
  const admin = await isAdmin(user.id)

  // 5. 내 제출 현황
  const { data: mySubmission } = await supabase
    .from('summaries')
    .select('created_at')
    .eq('week_id', currentWeek.id)
    .eq('author_id', user.id)
    .maybeSingle()

  // 6. 전체 제출 현황
  const { data: allProfiles } = await supabase
    .from('profiles')
    .select('id, nickname')
    .order('nickname')

  const { data: allSubmissions } = await supabase
    .from('summaries')
    .select('author_id')
    .eq('week_id', currentWeek.id)

  const submissionsStatus =
    allProfiles?.map((profile) => ({
      nickname: profile.nickname,
      has_submitted:
        allSubmissions?.some((s) => s.author_id === profile.id) ?? false,
    })) ?? []

  // 7. 현재 주차 요약본 (first_summaries 뷰 사용 - 각 사용자별 첫 번째 요약만)
  const { data: currentWeekSummariesRaw } = await supabase
    .from('first_summaries')
    .select('id, content, created_at, profiles(nickname)')
    .eq('week_id', currentWeek.id)
    .order('created_at', { ascending: false })
    .limit(10)

  // Supabase 뷰 JOIN 결과 타입 (first_summaries + profiles)
  type SummaryWithProfile = {
    id: string
    content: string
    created_at: string
    profiles: { nickname: string } | { nickname: string }[]
  }

  const currentWeekSummaries = (currentWeekSummariesRaw as unknown as SummaryWithProfile[] | null)?.map((summary) => ({
    id: summary.id,
    content: summary.content,
    created_at: summary.created_at,
    profiles: Array.isArray(summary.profiles) ? summary.profiles[0] : summary.profiles,
  }))

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
      {/* 비멤버 경고 배너 */}
      {!admin && !member && (
        <div className="mb-6">
          <NonMemberAlert />
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:gap-6 lg:grid-cols-2">
        {/* 이번 주 현황 (주차 정보 + 내 제출 + 전체 제출) */}
        <WeekOverview
          week={currentWeek}
          mySubmission={mySubmission}
          allSubmissions={submissionsStatus}
          isCurrentSeasonMember={admin || member}
        />

        {/* 이번 주 요약본 */}
        <CurrentWeekSummaries
          summaries={currentWeekSummaries ?? []}
          weekId={currentWeek.id}
        />
      </div>
    </div>
  )
}
