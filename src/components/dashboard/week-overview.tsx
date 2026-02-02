import Link from 'next/link'
import { Calendar, CheckCircle2, Circle, Users } from 'lucide-react'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
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
}

export function WeekOverview({ week, mySubmission, allSubmissions }: WeekOverviewProps) {
  const hasSubmitted = !!mySubmission
  const totalMembers = allSubmissions.length
  const submittedCount = allSubmissions.filter((s) => s.has_submitted).length

  return (
    <Card className="shadow-sm transition-shadow hover:shadow-md">
      <CardHeader className="pb-3 sm:pb-6">
        <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
          <Calendar className="h-4 w-4 text-primary sm:h-5 sm:w-5" />
          이번 주 현황
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 sm:space-y-6">
        {/* 주차 정보 */}
        <div>
          <div className="text-2xl font-bold sm:text-3xl">{week.week_number}주차</div>
          {week.title && (
            <div className="mt-1 text-sm text-muted-foreground">{week.title}</div>
          )}
          <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground sm:text-sm">
            <Calendar className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            {formatDateRange(week.start_date, week.end_date)}
          </div>
        </div>

        {/* 구분선 */}
        <div className="border-t" />

        {/* 내 제출 현황 */}
        <div>
          <div className="mb-3 flex items-center gap-2 text-sm font-medium">
            {hasSubmitted ? (
              <CheckCircle2 className="h-4 w-4 text-green-600" />
            ) : (
              <Circle className="h-4 w-4 text-muted-foreground" />
            )}
            내 제출 현황
          </div>

          {hasSubmitted ? (
            <div className="flex items-center gap-3 rounded-lg bg-green-50 p-3 dark:bg-green-900/20">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/50">
                <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
              <div className="min-w-0">
                <div className="text-sm font-medium text-green-600 dark:text-green-400">
                  제출 완료
                </div>
                <div className="text-xs text-muted-foreground">
                  {formatDateTime(mySubmission.created_at)}
                </div>
              </div>
            </div>
          ) : (
            <div>
              <div className="mb-3 rounded-lg bg-muted/50 p-3">
                <div className="text-sm font-medium">미제출</div>
                <div className="text-xs text-muted-foreground">
                  이번 주 요약본을 아직 제출하지 않았어요
                </div>
              </div>
              <Button asChild className="w-full">
                <Link href={`/summaries/new?week=${week.id}`}>
                  요약본 제출하기
                </Link>
              </Button>
            </div>
          )}
        </div>

        {/* 구분선 */}
        <div className="border-t" />

        {/* 전체 제출 현황 */}
        <div>
          <div className="mb-3 flex items-center gap-2 text-sm font-medium">
            <Users className="h-4 w-4 text-primary" />
            전체 제출 현황
          </div>

          <div className="mb-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold">{submittedCount}</span>
            <span className="text-sm text-muted-foreground">
              / {totalMembers}명 제출
            </span>
          </div>

          <div className="flex flex-wrap gap-1.5">
            {allSubmissions.map((member) => (
              <Badge
                key={member.nickname}
                variant={member.has_submitted ? 'default' : 'secondary'}
                className="gap-1 text-xs"
              >
                {member.has_submitted ? (
                  <CheckCircle2 className="h-3 w-3" />
                ) : (
                  <Circle className="h-3 w-3" />
                )}
                {member.nickname}
              </Badge>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
