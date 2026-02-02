import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

interface SearchParams {
  week?: string
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

  // 2. 주차 목록 조회 (필터용)
  const { data: weeks } = await supabase
    .from('weeks')
    .select('id, week_number, title')
    .order('week_number', { ascending: false })

  // 3. 요약본 목록 조회 (latest_summaries 뷰 사용)
  let query = supabase
    .from('latest_summaries')
    .select('*, weeks(week_number, title), profiles(nickname)')

  // 주차 필터링
  if (searchParams.week) {
    query = query.eq('week_id', searchParams.week)
  }

  const { data: summariesRaw } = await query
    .order('created_at', { ascending: false })
    .limit(20)

  // Supabase JOIN 결과 타입 처리
  const summaries = summariesRaw?.map((summary: any) => ({
    id: summary.id,
    content: summary.content,
    created_at: summary.created_at,
    week_id: summary.week_id,
    author_id: summary.author_id,
    weeks: Array.isArray(summary.weeks) ? summary.weeks[0] : summary.weeks,
    profiles: Array.isArray(summary.profiles) ? summary.profiles[0] : summary.profiles,
  }))

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
      <div className="mb-6 sm:mb-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold sm:text-3xl">요약본 목록</h1>
            <p className="mt-1 text-sm text-muted-foreground sm:text-base">
              멤버들이 제출한 경제 라디오 요약본을 확인하세요
            </p>
          </div>
          <Button asChild>
            <Link href="/summaries/new">요약본 작성하기</Link>
          </Button>
        </div>

        {/* 주차 필터 */}
        {weeks && weeks.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            <Button
              asChild
              variant={!searchParams.week ? 'default' : 'outline'}
              size="sm"
            >
              <Link href="/summaries">전체</Link>
            </Button>
            {weeks.map((week) => (
              <Button
                key={week.id}
                asChild
                variant={searchParams.week === week.id ? 'default' : 'outline'}
                size="sm"
              >
                <Link href={`/summaries?week=${week.id}`}>
                  {week.week_number}주차
                </Link>
              </Button>
            ))}
          </div>
        )}
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
                    {summary.profiles?.nickname || '알 수 없음'} •{' '}
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
          <p className="mb-6 text-muted-foreground">
            첫 번째 요약본을 작성해보세요!
          </p>
          <Button asChild>
            <Link href="/summaries/new">요약본 작성하기</Link>
          </Button>
        </div>
      )}
    </div>
  )
}
