import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import { SummaryForm } from '@/components/summary/summary-form'
import { isSeasonMember, isAdmin } from '@/lib/utils/season-membership'
import { AccessDeniedPage } from '@/components/season/access-denied-page'

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

  // 2. 요약본 조회 (시즌 정보 포함)
  const { data: summaryRaw, error } = await supabase
    .from('summaries')
    .select(`
      id,
      content,
      week_id,
      author_id,
      weeks!inner(season_id)
    `)
    .eq('id', params.id)
    .maybeSingle()

  if (error || !summaryRaw) {
    notFound()
  }

  // Supabase JOIN 결과 타입 처리
  const summary = {
    id: summaryRaw.id,
    content: summaryRaw.content,
    week_id: summaryRaw.week_id,
    author_id: summaryRaw.author_id,
    weeks: Array.isArray(summaryRaw.weeks) ? summaryRaw.weeks[0] : summaryRaw.weeks,
  }

  // 3. 본인 확인 (RLS가 막지만 UI에서도 체크)
  if (summary.author_id !== user.id) {
    redirect(`/mine/${params.id}`)
  }

  // 4. 멤버십 확인 (관리자는 항상 허용)
  const admin = await isAdmin(user.id)
  const weekSeasonId = summary.weeks.season_id
  const member = await isSeasonMember(user.id, weekSeasonId)

  if (!admin && !member) {
    return (
      <AccessDeniedPage
        title="수정 권한 없음"
        message="해당 시즌의 참여자만 수정할 수 있습니다."
        backHref={`/summaries/${params.id}`}
        backLabel="요약본 보기"
      />
    )
  }

  // 5. 현재 시즌 확인
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
          <p className="text-muted-foreground">관리자에게 시즌 생성을 요청하세요.</p>
        </div>
      </div>
    )
  }

  // 6. 최근 4주 조회 (현재 시즌만)
  const { data: recentWeeks } = await supabase
    .from('weeks')
    .select('id, season_id, week_number, title, start_date, end_date, is_current')
    .eq('season_id', currentSeason.id)
    .order('week_number', { ascending: false })
    .limit(4)

  let weeks = recentWeeks || []

  // 7. 엣지케이스: 현재 week_id가 최근 4주에 없으면 추가 조회 (다른 시즌 주차일 수도 있음)
  const currentWeekId = summary.week_id
  const isInRecent = weeks.some((w) => w.id === currentWeekId)

  if (!isInRecent) {
    const { data: currentWeek } = await supabase
      .from('weeks')
      .select('id, season_id, week_number, title, start_date, end_date, is_current')
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
