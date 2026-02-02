import { Calendar } from 'lucide-react'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { formatDateRange } from '@/lib/utils/date'

interface CurrentWeekInfoProps {
  week: {
    week_number: number
    title: string | null
    start_date: string
    end_date: string
  }
}

export function CurrentWeekInfo({ week }: CurrentWeekInfoProps) {
  return (
    <Card className="shadow-sm transition-shadow hover:shadow-md">
      <CardHeader className="pb-3 sm:pb-6">
        <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
          <Calendar className="h-4 w-4 text-primary sm:h-5 sm:w-5" />
          현재 주차
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 sm:space-y-4">
        <div>
          <div className="text-2xl font-bold sm:text-3xl">{week.week_number}주차</div>
          {week.title && (
            <div className="mt-1 text-sm text-muted-foreground">{week.title}</div>
          )}
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground sm:text-sm">
          <Calendar className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
          {formatDateRange(week.start_date, week.end_date)}
        </div>
      </CardContent>
    </Card>
  )
}
