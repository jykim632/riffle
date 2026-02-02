import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { CurrentWeekInfo } from '@/components/dashboard/current-week-info'
import { MySubmissionStatus } from '@/components/dashboard/my-submission-status'
import { AllSubmissionsStatus } from '@/components/dashboard/all-submissions-status'
import { RecentSummaries } from '@/components/dashboard/recent-summaries'

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

  // 5. 최근 요약본 (JOIN으로 주차 정보 포함)
  const { data: recentSummariesRaw } = await supabase
    .from('summaries')
    .select('id, content, created_at, weeks(week_number, title)')
    .eq('author_id', user.id)
    .order('created_at', { ascending: false })
    .limit(5)

  // Supabase JOIN 결과를 올바른 타입으로 변환
  const recentSummaries = recentSummariesRaw?.map((summary: any) => ({
    id: summary.id,
    content: summary.content,
    created_at: summary.created_at,
    weeks: Array.isArray(summary.weeks) ? summary.weeks[0] : summary.weeks,
  }))

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
      <div className="mb-6 sm:mb-8">
        <h1 className="text-2xl font-bold sm:text-3xl">대시보드</h1>
        <p className="mt-1 text-sm text-muted-foreground sm:text-base">
          이번 주 제출 현황을 확인하고 요약본을 관리하세요
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:gap-6 lg:grid-cols-2">
        {/* 현재 주차 정보 */}
        <CurrentWeekInfo week={currentWeek} />

        {/* 내 제출 현황 */}
        <MySubmissionStatus
          submission={mySubmission}
          weekId={currentWeek.id}
        />

        {/* 전체 제출 현황 */}
        <AllSubmissionsStatus submissions={submissionsStatus} />

        {/* 최근 요약본 */}
        <RecentSummaries summaries={recentSummaries ?? []} />
      </div>
    </div>
  )
}
