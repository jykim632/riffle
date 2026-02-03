import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { WeekOverview } from '@/components/dashboard/week-overview'
import { CurrentWeekSummaries } from '@/components/dashboard/current-week-summaries'

export default async function DashboardPage() {
  const supabase = await createClient()

  // 1. 현재 사용자 조회
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // 2. 현재 주차 조회
  const { data: currentWeek } = await supabase
    .from('weeks')
    .select('*')
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

  // 3. 내 제출 현황
  const { data: mySubmission } = await supabase
    .from('summaries')
    .select('created_at')
    .eq('week_id', currentWeek.id)
    .eq('author_id', user.id)
    .maybeSingle()

  // 4. 전체 제출 현황
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

  // 5. 현재 주차 요약본 (first_summaries 뷰 사용 - 각 사용자별 첫 번째 요약만)
  const { data: currentWeekSummariesRaw } = await supabase
    .from('first_summaries')
    .select('id, content, created_at, profiles(nickname)')
    .eq('week_id', currentWeek.id)
    .order('created_at', { ascending: false })
    .limit(10)

  // Supabase JOIN 결과를 올바른 타입으로 변환
  const currentWeekSummaries = currentWeekSummariesRaw?.map((summary: any) => ({
    id: summary.id,
    content: summary.content,
    created_at: summary.created_at,
    profiles: Array.isArray(summary.profiles) ? summary.profiles[0] : summary.profiles,
  }))

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
      <div className="grid grid-cols-1 gap-4 sm:gap-6 lg:grid-cols-2">
        {/* 이번 주 현황 (주차 정보 + 내 제출 + 전체 제출) */}
        <WeekOverview
          week={currentWeek}
          mySubmission={mySubmission}
          allSubmissions={submissionsStatus}
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
