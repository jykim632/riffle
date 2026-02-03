import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { SummaryForm } from '@/components/summary/summary-form'

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

  // 2. 현재 주차 확인 (기본값 결정용)
  const { data: currentWeek } = await supabase
    .from('weeks')
    .select('id')
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

  // 3. 최근 4주 조회
  const { data: weeks } = await supabase
    .from('weeks')
    .select('id, week_number, title, start_date, end_date, is_current')
    .order('week_number', { ascending: false })
    .limit(4)

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

  // 4. 초기 weekId 결정 (URL query 또는 현재 주차)
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
