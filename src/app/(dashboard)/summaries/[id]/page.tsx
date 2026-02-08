import { requireUser } from '@/lib/auth'
import { normalizeRelation, getAuthorName } from '@/lib/utils/supabase'
import { formatDate } from '@/lib/utils/date'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeft, MessageCircle } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { SummaryContent } from '@/components/summary/summary-content'
import { SummaryActions } from '@/components/summary/summary-actions'
import { CommentList } from '@/components/comment/comment-list'
import { CommentForm } from '@/components/comment/comment-form'

interface Params {
  id: string
}

export default async function SummaryDetailPage(props: { params: Promise<Params> }) {
  const params = await props.params
  const { supabase, user } = await requireUser()

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
  const weeks = normalizeRelation(summary.weeks)
  const profiles = normalizeRelation(summary.profiles)

  // 3. 같은 작성자의 같은 주차 모든 버전 조회 (탈퇴한 멤버는 버전 조회 불가)
  const { data: allVersions } = summary.author_id
    ? await supabase
        .from('summaries')
        .select('id, created_at')
        .eq('author_id', summary.author_id)
        .eq('week_id', summary.week_id)
        .order('created_at', { ascending: true })
    : { data: null }

  const hasMultipleVersions = allVersions && allVersions.length > 1

  // 댓글 조회
  const { data: commentsRaw } = await supabase
    .from('comments')
    .select('*, profiles(nickname)')
    .eq('summary_id', params.id)
    .order('created_at', { ascending: true })

  const comments = commentsRaw ?? []

  return (
    <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
      {/* 페이지 헤더 */}
      <div className="mb-6">
        <Button asChild variant="ghost" size="sm" className="mb-4">
          <Link href="/summaries">
            <ChevronLeft className="h-4 w-4 mr-1" />
            뒤로가기
          </Link>
        </Button>
        <div className="flex items-start justify-between">
          <h1 className="text-3xl font-bold">
            {weeks?.title || `${weeks?.week_number}주차`}
          </h1>
          <SummaryActions summaryId={params.id} isAuthor={summary.author_id === user.id} />
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardDescription>
            작성자: {getAuthorName(summary.author_id, profiles?.nickname)} • 작성일:{' '}
            {formatDate(summary.created_at)}
          </CardDescription>

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

      {/* 댓글 섹션 */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <MessageCircle className="h-5 w-5" />
            댓글 ({comments.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <CommentList comments={comments} currentUserId={user.id} />
          <div className="border-t pt-4">
            <CommentForm summaryId={params.id} />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
