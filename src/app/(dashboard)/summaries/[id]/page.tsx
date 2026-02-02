import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { SummaryContent } from '@/components/summary/summary-content'
import { SummaryActions } from '@/components/summary/summary-actions'

interface Params {
  id: string
}

export default async function SummaryDetailPage(props: { params: Promise<Params> }) {
  const params = await props.params
  const supabase = await createClient()

  // 1. 현재 사용자 확인
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // 2. 요약본 조회 (JOIN: weeks, profiles)
  const { data: summary, error } = await supabase
    .from('summaries')
    .select('*, weeks(week_number, title), profiles(nickname)')
    .eq('id', params.id)
    .maybeSingle()

  if (error || !summary) {
    notFound()
  }

  // Supabase JOIN 결과 타입 처리
  const weeks = Array.isArray(summary.weeks) ? summary.weeks[0] : summary.weeks
  const profiles = Array.isArray(summary.profiles) ? summary.profiles[0] : summary.profiles

  const isAuthor = summary.author_id === user.id

  // 3. 같은 작성자의 같은 주차 모든 버전 조회
  const { data: allVersions } = await supabase
    .from('summaries')
    .select('id, created_at')
    .eq('author_id', summary.author_id)
    .eq('week_id', summary.week_id)
    .order('created_at', { ascending: true })

  const hasMultipleVersions = allVersions && allVersions.length > 1

  return (
    <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="text-2xl">
                {weeks?.title || `${weeks?.week_number}주차`}
              </CardTitle>
              <CardDescription className="mt-2">
                작성자: {profiles?.nickname || '알 수 없음'} • 작성일:{' '}
                {new Date(summary.created_at).toLocaleDateString('ko-KR')}
              </CardDescription>
            </div>
            <SummaryActions summaryId={params.id} isAuthor={isAuthor} />
          </div>

          {/* 버전 히스토리 */}
          {hasMultipleVersions && (
            <div className="mt-4 pt-4 border-t">
              <p className="text-sm font-medium mb-2">제출 히스토리</p>
              <div className="flex flex-wrap gap-2">
                {allVersions.map((version, index) => {
                  const isCurrentVersion = version.id === params.id
                  return (
                    <Button
                      key={version.id}
                      asChild
                      variant={isCurrentVersion ? 'default' : 'outline'}
                      size="sm"
                    >
                      <Link href={`/summaries/${version.id}`}>
                        {index + 1}차 제출
                        {index === allVersions.length - 1 && ' (최신)'}
                      </Link>
                    </Button>
                  )
                })}
              </div>
            </div>
          )}
        </CardHeader>
        <CardContent>
          <SummaryContent content={summary.content} />
        </CardContent>
      </Card>
    </div>
  )
}
