import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import { SummaryForm } from '@/components/summary/summary-form'

interface Params {
  id: string
}

export default async function EditSummaryPage(props: { params: Promise<Params> }) {
  const params = await props.params
  const supabase = await createClient()

  // 1. 현재 사용자 확인
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // 2. 요약본 조회
  const { data: summary, error } = await supabase
    .from('summaries')
    .select('id, content, week_id, author_id')
    .eq('id', params.id)
    .maybeSingle()

  if (error || !summary) {
    notFound()
  }

  // 3. 본인 확인 (RLS가 막지만 UI에서도 체크)
  if (summary.author_id !== user.id) {
    redirect(`/mine/${params.id}`)
  }

  // 4. 최근 4주 조회
  const { data: recentWeeks } = await supabase
    .from('weeks')
    .select('id, week_number, title, start_date, end_date, is_current')
    .order('week_number', { ascending: false })
    .limit(4)

  let weeks = recentWeeks || []

  // 5. 엣지케이스: 현재 week_id가 최근 4주에 없으면 추가 조회
  const currentWeekId = summary.week_id
  const isInRecent = weeks.some((w) => w.id === currentWeekId)

  if (!isInRecent) {
    const { data: currentWeek } = await supabase
      .from('weeks')
      .select('id, week_number, title, start_date, end_date, is_current')
      .eq('id', currentWeekId)
      .single()

    if (currentWeek) {
      weeks = [currentWeek, ...weeks]
    }
  }

  if (weeks.length === 0) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <h1 className="mb-4 text-2xl font-bold">주차 정보를 불러올 수 없어요</h1>
          <p className="text-muted-foreground">관리자에게 문의하세요.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
      <div className="mb-6 sm:mb-8">
        <h1 className="text-2xl font-bold sm:text-3xl">요약본 수정하기</h1>
        <p className="mt-1 text-sm text-muted-foreground sm:text-base">
          작성한 요약본을 수정하세요
        </p>
      </div>

      <SummaryForm
        mode="edit"
        weeks={weeks}
        initialWeekId={summary.week_id}
        summaryId={params.id}
        initialContent={summary.content}
      />
    </div>
  )
}
