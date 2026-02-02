import Link from 'next/link'
import { CheckCircle2, Circle } from 'lucide-react'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { formatDateTime } from '@/lib/utils/date'

interface MySubmissionStatusProps {
  submission: {
    created_at: string
  } | null
  weekId: string
}

export function MySubmissionStatus({
  submission,
  weekId,
}: MySubmissionStatusProps) {
  const hasSubmitted = !!submission

  return (
    <Card className="shadow-sm transition-shadow hover:shadow-md">
      <CardHeader className="pb-3 sm:pb-6">
        <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
          {hasSubmitted ? (
            <CheckCircle2 className="h-4 w-4 text-green-600 sm:h-5 sm:w-5" />
          ) : (
            <Circle className="h-4 w-4 text-muted-foreground sm:h-5 sm:w-5" />
          )}
          내 제출 현황
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 sm:space-y-4">
        {hasSubmitted ? (
          <div className="space-y-2">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30 sm:h-10 sm:w-10">
                <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400 sm:h-5 sm:w-5" />
              </div>
              <div className="min-w-0">
                <div className="text-sm font-medium text-green-600 dark:text-green-400 sm:text-base">
                  제출 완료
                </div>
                <div className="text-xs text-muted-foreground sm:text-sm">
                  {formatDateTime(submission.created_at)}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-3 sm:space-y-4">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted sm:h-10 sm:w-10">
                <Circle className="h-4 w-4 text-muted-foreground sm:h-5 sm:w-5" />
              </div>
              <div className="min-w-0">
                <div className="text-sm font-medium sm:text-base">미제출</div>
                <div className="text-xs text-muted-foreground sm:text-sm">
                  이번 주 요약본을 아직 제출하지 않았어요
                </div>
              </div>
            </div>
            <Button asChild className="w-full">
              <Link href={`/summaries/new?week=${weekId}`}>
                요약본 제출하기
              </Link>
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
