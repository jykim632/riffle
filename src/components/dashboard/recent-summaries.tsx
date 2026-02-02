import Link from 'next/link'
import { FileText } from 'lucide-react'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { formatDate } from '@/lib/utils/date'

interface RecentSummariesProps {
  summaries: Array<{
    id: string
    content: string
    created_at: string
    weeks: {
      week_number: number
      title: string | null
    } | null
  }>
}

export function RecentSummaries({ summaries }: RecentSummariesProps) {
  if (summaries.length === 0) {
    return (
      <Card className="shadow-sm transition-shadow hover:shadow-md lg:col-span-2">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <FileText className="h-5 w-5 text-primary" />
            최근 요약본
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <FileText className="mb-4 h-12 w-12 text-muted-foreground" />
            <h3 className="mb-2 text-lg font-semibold">
              아직 작성한 요약본이 없어요
            </h3>
            <p className="mb-4 text-sm text-muted-foreground">
              첫 번째 요약본을 작성해보세요!
            </p>
            <Button asChild>
              <Link href="/summaries/new">요약본 작성하기</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="shadow-sm transition-shadow hover:shadow-md lg:col-span-2">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <FileText className="h-5 w-5 text-primary" />
          최근 요약본
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {summaries.map((summary) => (
            <Link
              key={summary.id}
              href={`/summaries/${summary.id}`}
              className="block rounded-lg border bg-card p-4 transition-colors hover:bg-accent"
            >
              <div className="mb-2 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">
                    {summary.weeks?.week_number}주차
                  </span>
                  {summary.weeks?.title && (
                    <span className="text-sm text-muted-foreground">
                      {summary.weeks.title}
                    </span>
                  )}
                </div>
                <span className="text-sm text-muted-foreground">
                  {formatDate(summary.created_at)}
                </span>
              </div>
              <p className="line-clamp-2 text-sm text-muted-foreground">
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
