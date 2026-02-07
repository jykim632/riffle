import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { SummaryForm } from '@/components/summary/summary-form'
import { isCurrentSeasonMember, isAdmin } from '@/lib/utils/season-membership'
import { AccessDeniedPage } from '@/components/season/access-denied-page'

interface SearchParams {
  week?: string
}

export default async function NewSummaryPage(props: { searchParams: Promise<SearchParams> }) {
  const searchParams = await props.searchParams
  const supabase = await createClient()

  // 1. 현재 사용자 확인
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // 2. 현재 시즌 확인
  const { data: currentSeason } = await supabase
    .from('seasons')
    .select('id')
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

  // 3. 멤버십 확인 (관리자는 항상 허용)
  const admin = await isAdmin(user.id)
  const member = await isCurrentSeasonMember(user.id)

  if (!admin && !member) {
    return (
      <AccessDeniedPage
        title="시즌 참여 필요"
        message="현재 시즌에 참여하지 않았습니다. 시즌에 참여하려면 관리자에게 문의하세요."
      />
    )
  }

  // 4. 현재 주차 확인 (기본값 결정용)
  const { data: currentWeek } = await supabase
    .from('weeks')
    .select('id')
    .eq('season_id', currentSeason.id)
    .eq('is_current', true)
    .maybeSingle()

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

  // 5. 시즌 전체 주차 조회
  const { data: weeks } = await supabase
    .from('weeks')
    .select('id, season_id, week_number, title, start_date, end_date, is_current')
    .eq('season_id', currentSeason.id)
    .order('week_number', { ascending: true })

  if (!weeks || weeks.length === 0) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <h1 className="mb-4 text-2xl font-bold">주차 정보를 불러올 수 없어요</h1>
          <p className="text-muted-foreground">
            관리자에게 문의하세요.
          </p>
        </div>
      </div>
    )
  }

  // 6. 초기 weekId 결정 (URL query 또는 현재 주차)
  const weekId = searchParams.week || currentWeek.id

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
      <div className="mb-6 sm:mb-8">
        <h1 className="text-2xl font-bold sm:text-3xl">요약본 제출하기</h1>
        <p className="mt-1 text-sm text-muted-foreground sm:text-base">
          경제 라디오 요약본을 작성하고 제출하세요
        </p>
      </div>

      <SummaryForm mode="create" weeks={weeks} initialWeekId={weekId} />
    </div>
  )
}
