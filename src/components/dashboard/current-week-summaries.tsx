import Link from 'next/link'
import { FileText } from 'lucide-react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { formatDate } from '@/lib/utils/date'

interface CurrentWeekSummariesProps {
  summaries: Array<{
    id: string
    content: string
    created_at: string
    profiles: {
      nickname: string
    } | null
  }>
  weekId: string
}

export function CurrentWeekSummaries({ summaries, weekId }: CurrentWeekSummariesProps) {
  if (summaries.length === 0) {
    return (
      <Card className="shadow-sm transition-shadow hover:shadow-md">
        <CardHeader className="pb-3 sm:pb-6">
          <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
            <FileText className="h-4 w-4 text-primary sm:h-5 sm:w-5" />
            이번 주 요약본
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-8 text-center sm:py-12">
            <FileText className="mb-3 h-10 w-10 text-muted-foreground sm:mb-4 sm:h-12 sm:w-12" />
            <h3 className="mb-2 text-base font-semibold sm:text-lg">
              아직 제출된 요약본이 없어요
            </h3>
            <p className="mb-3 text-xs text-muted-foreground sm:mb-4 sm:text-sm">
              첫 번째 요약본을 작성해보세요!
            </p>
            <Button asChild size="sm" className="sm:size-default">
              <Link href={`/summaries/new?week=${weekId}`}>요약본 작성하기</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="shadow-sm transition-shadow hover:shadow-md">
      <CardHeader className="pb-3 sm:pb-6">
        <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
          <FileText className="h-4 w-4 text-primary sm:h-5 sm:w-5" />
          이번 주 요약본
        </CardTitle>
        <CardDescription>멤버들이 제출한 요약본을 확인하세요</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-3 sm:gap-4">
          {summaries.map((summary) => (
            <Link
              key={summary.id}
              href={`/summaries/${summary.id}`}
              className="block rounded-lg border bg-card p-3 transition-colors hover:bg-accent sm:p-4"
            >
              <div className="mb-2 flex items-center justify-between">
                <span className="text-sm font-medium">
                  {summary.profiles?.nickname || '알 수 없음'}
                </span>
                <span className="text-xs text-muted-foreground">
                  {formatDate(summary.created_at)}
                </span>
              </div>
              <p className="line-clamp-2 text-xs text-muted-foreground sm:text-sm">
                {summary.content.slice(0, 100)}
                {summary.content.length > 100 && '...'}
              </p>
            </Link>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
