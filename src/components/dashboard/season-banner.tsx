import { Calendar, Users } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { formatDateRange } from '@/lib/utils/date'

interface SeasonBannerProps {
  season: { name: string; start_date: string; end_date: string }
  currentWeekNumber: number
  totalWeeks: number
  members: string[]
}

export function SeasonBanner({
  season,
  currentWeekNumber,
  totalWeeks,
  members,
}: SeasonBannerProps) {
  const weekProgress = totalWeeks > 0 ? (currentWeekNumber / totalWeeks) * 100 : 0

  return (
    <Card className="h-full bg-gradient-to-br from-primary/5 via-transparent to-primary/3">
      <CardContent className="space-y-4">
        {/* 헤더: 시즌명 + 상태 + 기간 */}
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold">{season.name}</h2>
            <Badge variant="default" className="text-xs">
              진행중
            </Badge>
          </div>
          <span className="text-sm text-muted-foreground">
            {formatDateRange(season.start_date, season.end_date)}
          </span>
        </div>

        {/* 2칸 스탯 그리드 */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {/* 시즌 진행 */}
          <div className="space-y-2 rounded-lg bg-muted/50 p-4">
            <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <Calendar className="h-4 w-4 text-blue-500" />
              시즌 진행
            </div>
            <div className="text-lg font-semibold">
              {currentWeekNumber} / {totalWeeks} 주차
            </div>
            <div className="space-y-1">
              <div className="text-right text-xs text-muted-foreground">
                {Math.round(weekProgress)}%
              </div>
              <Progress value={weekProgress} />
            </div>
          </div>

          {/* 참여 멤버 */}
          <div className="space-y-3 rounded-lg bg-muted/50 p-4">
            <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <Users className="h-4 w-4 text-emerald-500" />
              참여 멤버
              <span className="text-xs">({members.length}명)</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {members.map((nickname) => (
                <span
                  key={nickname}
                  className="inline-flex items-center rounded-full bg-background px-2.5 py-0.5 text-xs font-medium text-foreground ring-1 ring-inset ring-border"
                >
                  {nickname}
                </span>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
