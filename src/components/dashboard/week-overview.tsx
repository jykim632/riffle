import Link from 'next/link'
import { Calendar, CheckCircle2, Users, Lock } from 'lucide-react'
import {
  Card,
  CardContent,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { formatDateRange, formatDateTime } from '@/lib/utils/date'

interface WeekOverviewProps {
  week: {
    id: string
    week_number: number
    title: string | null
    start_date: string
    end_date: string
  }
  mySubmission: {
    created_at: string
  } | null
  allSubmissions: Array<{
    nickname: string
    has_submitted: boolean
  }>
  isCurrentSeasonMember: boolean
}

export function WeekOverview({ week, mySubmission, allSubmissions, isCurrentSeasonMember }: WeekOverviewProps) {
  const hasSubmitted = !!mySubmission
  const totalMembers = allSubmissions.length
  const submittedCount = allSubmissions.filter((s) => s.has_submitted).length

  return (
    <Card className="shadow-sm transition-shadow hover:shadow-md">
      <CardContent className="space-y-8">
        {/* 주차 정보 */}
        <div>
          <div className="text-3xl font-bold sm:text-4xl">{week.week_number}주차</div>
          {week.title && (
            <div className="mt-1 text-sm text-muted-foreground">{week.title}</div>
          )}
          <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground sm:text-sm">
            <Calendar className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            {formatDateRange(week.start_date, week.end_date)}
          </div>
        </div>

        {/* 내 제출 현황 */}
        <div>
          <div className="mb-3 text-sm font-medium">내 제출 현황</div>

          {hasSubmitted ? (
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
              <div className="flex items-center gap-2 text-sm">
                <span className="font-medium">제출 완료</span>
                <span className="text-muted-foreground">·</span>
                <span className="text-muted-foreground">
                  {formatDateTime(mySubmission.created_at)}
                </span>
              </div>
            </div>
          ) : (
            <>
              {isCurrentSeasonMember ? (
                <Button asChild className="w-full">
                  <Link href={`/summaries/new?week=${week.id}`}>
                    요약본 제출하기
                  </Link>
                </Button>
              ) : (
                <Button disabled className="w-full">
                  <Lock className="mr-2 h-4 w-4" />
                  시즌 참여자만 제출 가능
                </Button>
              )}
            </>
          )}
        </div>

        {/* 전체 제출 현황 */}
        <div>
          <div className="mb-3 flex items-center gap-2 text-sm font-medium">
            <Users className="h-4 w-4 text-primary" />
            전체 제출 현황
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">진행률</span>
              <span className="font-medium">{submittedCount} / {totalMembers}명</span>
            </div>

            <Progress value={(submittedCount / totalMembers) * 100} />

            {submittedCount > 0 && (
              <p className="text-xs text-muted-foreground">
                {allSubmissions
                  .filter((s) => s.has_submitted)
                  .map((s) => s.nickname)
                  .join(', ')}
                님이 제출했어요
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
