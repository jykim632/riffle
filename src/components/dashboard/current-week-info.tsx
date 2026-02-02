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
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Calendar className="h-5 w-5 text-primary" />
          현재 주차
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <div className="text-3xl font-bold">{week.week_number}주차</div>
          {week.title && (
            <div className="text-sm text-muted-foreground">{week.title}</div>
          )}
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Calendar className="h-4 w-4" />
          {formatDateRange(week.start_date, week.end_date)}
        </div>
      </CardContent>
    </Card>
  )
}
