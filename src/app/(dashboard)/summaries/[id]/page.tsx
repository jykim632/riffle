import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
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
        </CardHeader>
        <CardContent>
          <SummaryContent content={summary.content} />
        </CardContent>
      </Card>
    </div>
  )
}
