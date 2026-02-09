import { requireUser } from '@/lib/auth'
import { getCurrentSeason, getCurrentWeek } from '@/lib/queries/season'
import { normalizeRelation } from '@/lib/utils/supabase'
import { EmptyState } from '@/components/empty-state'
import { WeekOverview } from '@/components/dashboard/week-overview'
import { CurrentWeekSummaries } from '@/components/dashboard/current-week-summaries'
import { SeasonBanner } from '@/components/dashboard/season-banner'
import { isCurrentSeasonMember, isAdmin } from '@/lib/utils/season-membership'
import { NonMemberAlert } from '@/components/season/non-member-alert'

export default async function DashboardPage() {
  const { supabase, user } = await requireUser()

  // 2. 현재 시즌 조회
  const currentSeason = await getCurrentSeason(supabase)

  if (!currentSeason) {
    return <EmptyState title="현재 시즌이 없어요" description="관리자에게 시즌 생성을 요청하세요." />
  }

  // 3. 현재 주차 조회 (현재 시즌 내)
  const currentWeek = await getCurrentWeek(supabase, currentSeason.id)

  // 현재 주차가 없으면 빈 상태 표시
  if (!currentWeek) {
    return <EmptyState title="현재 주차가 없어요" description="관리자에게 주차 생성을 요청하세요." />
  }

  // 4. 멤버십 확인
  const member = await isCurrentSeasonMember(user.id)
  const admin = await isAdmin(user.id)

  // 6. 내 제출 현황
  const { data: mySubmission } = await supabase
    .from('summaries')
    .select('created_at')
    .eq('week_id', currentWeek.id)
    .eq('author_id', user.id)
    .maybeSingle()

  // 7. 전체 제출 현황
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

  const totalMembers = submissionsStatus.length
  const submittedCount = submissionsStatus.filter((s) => s.has_submitted).length

  // 8. 시즌 전체 주차 수 + 멤버 수
  const [{ count: totalWeeks }, { data: seasonMembers }] = await Promise.all([
    supabase
      .from('weeks')
      .select('*', { count: 'exact', head: true })
      .eq('season_id', currentSeason.id),
    supabase
      .from('season_members')
      .select('user_id, profiles(nickname)')
      .eq('season_id', currentSeason.id),
  ])

  const memberNicknames = (seasonMembers as { user_id: string; profiles: { nickname: string } | { nickname: string }[] }[] | null)
    ?.map((m) => {
      const profile = normalizeRelation(m.profiles)
      return profile?.nickname ?? '알 수 없음'
    })
    .sort() ?? []

  // 9. 현재 주차 요약본 (first_summaries 뷰 사용 - 각 사용자별 첫 번째 요약만)
  const { data: currentWeekSummariesRaw } = await supabase
    .from('first_summaries')
    .select('id, author_id, content, created_at, profiles(nickname)')
    .eq('week_id', currentWeek.id)
    .order('created_at', { ascending: false })
    .limit(10)

  // Supabase 뷰 JOIN 결과 타입 (first_summaries + profiles)
  type SummaryWithProfile = {
    id: string
    author_id: string | null
    content: string
    created_at: string
    profiles: { nickname: string } | { nickname: string }[] | null
  }

  const currentWeekSummaries = (currentWeekSummariesRaw as unknown as SummaryWithProfile[] | null)?.map((summary) => ({
    id: summary.id,
    author_id: summary.author_id,
    content: summary.content,
    created_at: summary.created_at,
    profiles: normalizeRelation(summary.profiles),
  }))

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
      <div className="space-y-4 sm:space-y-6">
        {/* 비멤버 경고 배너 */}
        {!admin && !member && <NonMemberAlert />}

        {/* 데스크톱: 2x2 그리드 / 모바일: 수직 스택 */}
        <div className="grid grid-cols-1 gap-4 sm:gap-6 lg:grid-cols-[2fr_3fr]">
          <WeekOverview
            week={currentWeek}
            mySubmission={mySubmission}
            allSubmissions={submissionsStatus}
            isCurrentSeasonMember={admin || member}
          />
          <CurrentWeekSummaries
            summaries={currentWeekSummaries ?? []}
            weekId={currentWeek.id}
          />
          <div className="lg:col-span-full">
            <SeasonBanner
              season={currentSeason}
              currentWeekNumber={currentWeek.week_number}
              totalWeeks={totalWeeks ?? 0}
              members={memberNicknames}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
