import { SupabaseClient } from '@supabase/supabase-js'

export interface MemberStats {
  userId: string
  nickname: string
  totalSubmissions: number
  submissionRate: number
  currentStreak: number
  longestStreak: number
  rank: number
}

export interface SeasonStatsOverview {
  totalMembers: number
  totalWeeks: number
  averageSubmissionRate: number
  averageStreak: number
  perfectMembers: number // 100% 제출률 멤버 수
}

/**
 * 시즌 멤버별 통계 계산.
 * summaries + weeks + season_members를 조합해서 인메모리 계산.
 */
export async function getSeasonMemberStats(
  supabase: SupabaseClient,
  seasonId: string
): Promise<{ members: MemberStats[]; overview: SeasonStatsOverview }> {
  // 1. 시즌의 전체 주차 (week_number 오름차순)
  const { data: weeks } = await supabase
    .from('weeks')
    .select('id, week_number')
    .eq('season_id', seasonId)
    .order('week_number', { ascending: true })

  if (!weeks || weeks.length === 0) {
    return {
      members: [],
      overview: {
        totalMembers: 0,
        totalWeeks: 0,
        averageSubmissionRate: 0,
        averageStreak: 0,
        perfectMembers: 0,
      },
    }
  }

  const weekIds = weeks.map((w) => w.id)
  const weekNumberById = new Map(weeks.map((w) => [w.id, w.week_number]))

  // 2. 시즌 멤버 + 프로필
  const { data: seasonMembers } = await supabase
    .from('season_members')
    .select('user_id, profiles(nickname)')
    .eq('season_id', seasonId)

  // 3. 해당 주차들의 모든 제출 기록
  const { data: summaries } = await supabase
    .from('summaries')
    .select('author_id, week_id')
    .in('week_id', weekIds)

  // 멤버별 제출 주차 Set 구성
  const submissionsByUser = new Map<string, Set<number>>()
  for (const s of summaries ?? []) {
    if (!s.author_id) continue
    const weekNum = weekNumberById.get(s.week_id)
    if (weekNum === undefined) continue
    if (!submissionsByUser.has(s.author_id)) {
      submissionsByUser.set(s.author_id, new Set())
    }
    submissionsByUser.get(s.author_id)!.add(weekNum)
  }

  const totalWeeks = weeks.length
  const weekNumbers = weeks.map((w) => w.week_number).sort((a, b) => a - b)

  // 멤버별 통계 계산
  const members: MemberStats[] = (seasonMembers ?? [])
    .filter((m): m is typeof m & { user_id: string } => m.user_id !== null)
    .map((m) => {
      const profile = Array.isArray(m.profiles) ? m.profiles[0] : m.profiles
      const nickname = profile?.nickname ?? '알 수 없음'
      const submitted = submissionsByUser.get(m.user_id) ?? new Set<number>()

      const totalSubmissions = submitted.size
      const submissionRate = totalWeeks > 0 ? totalSubmissions / totalWeeks : 0

      // 스트릭 계산 (week_number 기준)
      const { currentStreak, longestStreak } = calculateStreaks(
        weekNumbers,
        submitted
      )

      return {
        userId: m.user_id,
        nickname,
        totalSubmissions,
        submissionRate,
        currentStreak,
        longestStreak,
        rank: 0,
      }
    })

  // 순위 매기기 (제출률 → 최장 스트릭 → 현재 스트릭)
  members.sort((a, b) => {
    if (b.submissionRate !== a.submissionRate)
      return b.submissionRate - a.submissionRate
    if (b.longestStreak !== a.longestStreak)
      return b.longestStreak - a.longestStreak
    return b.currentStreak - a.currentStreak
  })

  let currentRank = 1
  for (let i = 0; i < members.length; i++) {
    if (
      i > 0 &&
      members[i].submissionRate === members[i - 1].submissionRate &&
      members[i].longestStreak === members[i - 1].longestStreak &&
      members[i].currentStreak === members[i - 1].currentStreak
    ) {
      members[i].rank = members[i - 1].rank
    } else {
      members[i].rank = currentRank
    }
    currentRank++
  }

  // 전체 요약
  const totalMembers = members.length
  const averageSubmissionRate =
    totalMembers > 0
      ? members.reduce((sum, m) => sum + m.submissionRate, 0) / totalMembers
      : 0
  const averageStreak =
    totalMembers > 0
      ? members.reduce((sum, m) => sum + m.currentStreak, 0) / totalMembers
      : 0
  const perfectMembers = members.filter((m) => m.submissionRate === 1).length

  return {
    members,
    overview: {
      totalMembers,
      totalWeeks,
      averageSubmissionRate,
      averageStreak,
      perfectMembers,
    },
  }
}

/**
 * 주차 번호 배열과 제출 주차 Set으로 스트릭 계산.
 */
function calculateStreaks(
  weekNumbers: number[],
  submitted: Set<number>
): { currentStreak: number; longestStreak: number } {
  let currentStreak = 0
  let longestStreak = 0
  let streak = 0

  for (const weekNum of weekNumbers) {
    if (submitted.has(weekNum)) {
      streak++
      longestStreak = Math.max(longestStreak, streak)
    } else {
      streak = 0
    }
  }

  // 현재 스트릭: 마지막 주차부터 역순으로 연속 제출 수
  currentStreak = 0
  for (let i = weekNumbers.length - 1; i >= 0; i--) {
    if (submitted.has(weekNumbers[i])) {
      currentStreak++
    } else {
      break
    }
  }

  return { currentStreak, longestStreak }
}
