import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Pencil, CircleCheck, Circle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'

function formatDateRange(startDate: string, endDate: string) {
  const start = new Date(startDate + 'T00:00:00')
  const end = new Date(endDate + 'T00:00:00')
  const fmt = (d: Date) =>
    `${d.getMonth() + 1}/${d.getDate()}`
  return `${fmt(start)} ~ ${fmt(end)}`
}

interface SearchParams {
  week?: string
  filter?: string
}

export default async function SummariesPage(props: { searchParams: Promise<SearchParams> }) {
  const searchParams = await props.searchParams
  const supabase = await createClient()

  // 1. 현재 사용자 확인
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const isMineFilter = searchParams.filter === 'mine'

  // 2. 현재 시즌 조회
  const { data: currentSeason } = await supabase
    .from('seasons')
    .select('id')
    .eq('is_active', true)
    .maybeSingle()

  // 3. 주차 목록 조회 (필터용, 현재 시즌만)
  const { data: weeks } = currentSeason
    ? await supabase
        .from('weeks')
        .select('id, season_id, week_number, title, start_date, end_date')
        .eq('season_id', currentSeason.id)
        .order('week_number', { ascending: false })
    : { data: [] }

  // 4. 요약본 목록 조회 (latest_summaries 뷰 사용)
  let query = supabase
    .from('latest_summaries')
    .select('*, weeks(week_number, title), profiles(nickname)')

  // 내 글만 필터
  if (isMineFilter) {
    query = query.eq('author_id', user.id)
  }

  // 주차 필터링
  if (searchParams.week) {
    query = query.eq('week_id', searchParams.week)
  }

  const { data: summariesRaw } = await query
    .order('created_at', { ascending: false })
    .limit(20)

  // Supabase 뷰 JOIN 결과 타입 (latest_summaries + weeks + profiles)
  type SummaryWithRelations = {
    id: string
    content: string
    created_at: string
    week_id: string
    author_id: string | null
    weeks: { week_number: number; title: string } | { week_number: number; title: string }[]
    profiles: { nickname: string } | { nickname: string }[] | null
  }

  const summaries = (summariesRaw as unknown as SummaryWithRelations[] | null)?.map((summary) => ({
    id: summary.id,
    content: summary.content,
    created_at: summary.created_at,
    week_id: summary.week_id,
    author_id: summary.author_id,
    weeks: Array.isArray(summary.weeks) ? summary.weeks[0] : summary.weeks,
    profiles: Array.isArray(summary.profiles) ? summary.profiles[0] : summary.profiles,
  }))

  // 필터 파라미터 유지 헬퍼
  function buildHref(params: { week?: string; filter?: string }) {
    const sp = new URLSearchParams()
    if (params.filter) sp.set('filter', params.filter)
    if (params.week) sp.set('week', params.week)
    const qs = sp.toString()
    return `/summaries${qs ? `?${qs}` : ''}`
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
      <div className="mb-6 sm:mb-8">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold sm:text-3xl">
              {isMineFilter ? '내 요약본 목록' : '요약본 목록'}
            </h1>
            <p className="mt-1 text-sm text-muted-foreground sm:text-base">
              {isMineFilter
                ? '제출한 경제 라디오 요약본을 관리하세요'
                : '멤버들이 제출한 경제 라디오 요약본을 확인하세요'}
            </p>
          </div>
          <Button asChild size="icon" className="shrink-0">
            <Link href="/summaries/new">
              <Pencil className="h-5 w-5" />
            </Link>
          </Button>
        </div>

        {/* 필터 영역 */}
        <div className="mt-4 flex flex-wrap items-center gap-2">
          {/* 내 글만 토글 */}
          <Button
            asChild
            variant={isMineFilter ? 'default' : 'ghost'}
            size="sm"
          >
            <Link href={isMineFilter
              ? buildHref({ week: searchParams.week })
              : buildHref({ week: searchParams.week, filter: 'mine' })
            }>
              {isMineFilter
                ? <CircleCheck className="mr-1 h-3.5 w-3.5" />
                : <Circle className="mr-1 h-3.5 w-3.5" />
              }
              내 글만
            </Link>
          </Button>

          <div className="mx-1 h-6 w-px bg-border" />

          {/* 주차 필터 */}
          {weeks && weeks.length > 0 && (
            <TooltipProvider>
              <div className="flex flex-wrap gap-2">
                <Button
                  asChild
                  variant={!searchParams.week ? 'default' : 'outline'}
                  size="sm"
                >
                  <Link href={buildHref({ filter: searchParams.filter })}>전체</Link>
                </Button>
                {weeks.map((week) => (
                  <Tooltip key={week.id}>
                    <TooltipTrigger asChild>
                      <Button
                        asChild
                        variant={searchParams.week === week.id ? 'default' : 'outline'}
                        size="sm"
                      >
                        <Link href={buildHref({ week: week.id, filter: searchParams.filter })}>
                          {week.week_number}주차
                        </Link>
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{formatDateRange(week.start_date, week.end_date)}</p>
                    </TooltipContent>
                  </Tooltip>
                ))}
              </div>
            </TooltipProvider>
          )}
        </div>
      </div>

      {/* 요약본 목록 */}
      {summaries && summaries.length > 0 ? (
        <div className="grid gap-4 sm:gap-6 md:grid-cols-2 lg:grid-cols-3">
          {summaries.map((summary) => (
            <Link key={summary.id} href={`/summaries/${summary.id}`}>
              <Card className="h-full transition-shadow hover:shadow-md">
                <CardHeader>
                  <CardTitle className="text-lg">
                    {summary.weeks?.title || `${summary.weeks?.week_number}주차`}
                  </CardTitle>
                  <CardDescription>
                    {summary.author_id === null ? '탈퇴한 멤버' : (summary.profiles?.nickname || '알 수 없음')} •{' '}
                    {new Date(summary.created_at).toLocaleDateString('ko-KR')}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="line-clamp-3 text-sm text-muted-foreground">
                    {summary.content.slice(0, 100)}
                    {summary.content.length > 100 ? '...' : ''}
                  </p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <h2 className="mb-4 text-xl font-semibold">요약본이 없어요</h2>
          {isMineFilter ? (
            <>
              <p className="mb-6 text-muted-foreground">
                첫 번째 요약본을 작성해보세요!
              </p>
              <Button asChild>
                <Link href="/summaries/new">요약본 작성하기</Link>
              </Button>
            </>
          ) : (
            <p className="text-muted-foreground">
              멤버들의 요약본을 기다리고 있어요
            </p>
          )}
        </div>
      )}
    </div>
  )
}
