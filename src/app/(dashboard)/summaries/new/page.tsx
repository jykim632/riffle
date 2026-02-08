import { requireUser } from '@/lib/auth'
import { getCurrentSeason, getCurrentWeek, getSeasonWeeks } from '@/lib/queries/season'
import { SummaryForm } from '@/components/summary/summary-form'
import { isCurrentSeasonMember, isAdmin } from '@/lib/utils/season-membership'
import { AccessDeniedPage } from '@/components/season/access-denied-page'

interface SearchParams {
  week?: string
}

export default async function NewSummaryPage(props: { searchParams: Promise<SearchParams> }) {
  const searchParams = await props.searchParams
  const { supabase, user } = await requireUser()

  // 2. 현재 시즌 확인
  const currentSeason = await getCurrentSeason(supabase)

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
  const currentWeek = await getCurrentWeek(supabase, currentSeason.id)

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
  const weeks = await getSeasonWeeks(supabase, currentSeason.id)

  if (weeks.length === 0) {
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
