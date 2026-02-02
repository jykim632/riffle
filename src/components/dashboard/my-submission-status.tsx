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
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          {hasSubmitted ? (
            <CheckCircle2 className="h-5 w-5 text-green-600" />
          ) : (
            <Circle className="h-5 w-5 text-muted-foreground" />
          )}
          내 제출 현황
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {hasSubmitted ? (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
                <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <div className="font-medium text-green-600 dark:text-green-400">
                  제출 완료
                </div>
                <div className="text-sm text-muted-foreground">
                  {formatDateTime(submission.created_at)}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted">
                <Circle className="h-5 w-5 text-muted-foreground" />
              </div>
              <div>
                <div className="font-medium">미제출</div>
                <div className="text-sm text-muted-foreground">
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
