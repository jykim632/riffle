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

  // 2. weekId 결정 (URL query 또는 현재 주차)
  let weekId = searchParams.week
  let weekTitle: string | undefined

  if (!weekId) {
    // 현재 주차 자동 조회
    const { data: currentWeek } = await supabase
      .from('weeks')
      .select('id, title')
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

    weekId = currentWeek.id
    weekTitle = currentWeek.title
  } else {
    // 명시된 주차 정보 조회
    const { data: week } = await supabase
      .from('weeks')
      .select('title')
      .eq('id', weekId)
      .maybeSingle()

    if (!week) {
      redirect('/summaries/new') // 잘못된 weekId면 현재 주차로
    }

    weekTitle = week.title
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
      <div className="mb-6 sm:mb-8">
        <h1 className="text-2xl font-bold sm:text-3xl">요약본 제출하기</h1>
        <p className="mt-1 text-sm text-muted-foreground sm:text-base">
          경제 라디오 요약본을 작성하고 제출하세요
        </p>
      </div>

      <SummaryForm mode="create" weekId={weekId} weekTitle={weekTitle} />
    </div>
  )
}
