import { requireUser } from '@/lib/auth'
import { getCurrentSeason } from '@/lib/queries/season'
import { getSeasonMemberStats } from '@/lib/queries/stats'
import { EmptyState } from '@/components/empty-state'
import { SeasonStatsCards } from '@/components/dashboard/leaderboard/season-stats-cards'
import { MemberRankingTable } from '@/components/dashboard/leaderboard/member-ranking-table'

export default async function LeaderboardPage() {
  const { supabase } = await requireUser()

  const currentSeason = await getCurrentSeason(supabase)

  if (!currentSeason) {
    return <EmptyState title="현재 시즌이 없어요" description="관리자에게 시즌 생성을 요청하세요." />
  }

  const { members, overview } = await getSeasonMemberStats(
    supabase,
    currentSeason.id
  )

  if (members.length === 0) {
    return <EmptyState title="아직 멤버가 없어요" description="시즌에 참여한 멤버가 없습니다." />
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
      <div className="space-y-6">
        <SeasonStatsCards overview={overview} seasonName={currentSeason.name} />
        <MemberRankingTable members={members} totalWeeks={overview.totalWeeks} />
      </div>
    </div>
  )
}
