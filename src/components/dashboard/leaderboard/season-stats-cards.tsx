import { Users, Target, Flame, Trophy } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import type { SeasonStatsOverview } from '@/lib/queries/stats'

interface SeasonStatsCardsProps {
  overview: SeasonStatsOverview
  seasonName: string
}

export function SeasonStatsCards({ overview, seasonName }: SeasonStatsCardsProps) {
  const stats = [
    {
      icon: Users,
      iconColor: 'text-blue-500',
      label: '참여 멤버',
      value: `${overview.totalMembers}명`,
    },
    {
      icon: Target,
      iconColor: 'text-emerald-500',
      label: '평균 제출률',
      value: `${Math.round(overview.averageSubmissionRate * 100)}%`,
    },
    {
      icon: Flame,
      iconColor: 'text-orange-500',
      label: '평균 연속 제출',
      value: `${overview.averageStreak.toFixed(1)}주`,
    },
    {
      icon: Trophy,
      iconColor: 'text-amber-500',
      label: '개근 멤버',
      value: `${overview.perfectMembers}명`,
    },
  ]

  return (
    <div className="space-y-3">
      <h2 className="text-lg font-semibold">{seasonName} 통계</h2>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.label}>
            <CardContent className="flex flex-col items-center gap-1 py-4 text-center">
              <stat.icon className={`h-5 w-5 ${stat.iconColor}`} />
              <span className="text-2xl font-bold">{stat.value}</span>
              <span className="text-xs text-muted-foreground">{stat.label}</span>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
