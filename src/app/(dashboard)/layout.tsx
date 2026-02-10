import { requireUser } from '@/lib/auth'
import { getCurrentSeason, getCurrentWeek } from '@/lib/queries/season'
import { getIndicatorsByWeek, getPreviousIndicators } from '@/lib/queries/indicators'
import { Header } from '@/components/dashboard/header'
import { IndicatorsTicker } from '@/components/dashboard/indicators-ticker'
import { redirect } from 'next/navigation'
import Script from 'next/script'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { supabase, user } = await requireUser()

  // 사용자 프로필 조회
  const { data: profile } = await supabase
    .from('profiles')
    .select('nickname, role')
    .eq('id', user.id)
    .maybeSingle()

  if (!profile) {
    redirect('/login')
  }

  // 현재 시즌 + 주차 조회
  const currentSeason = await getCurrentSeason(supabase)
  const currentWeek = currentSeason
    ? await getCurrentWeek(supabase, currentSeason.id)
    : null

  // 현재 주차가 없으면 기본값 사용
  const weekInfo = currentWeek || {
    week_number: 0,
    title: '주차 없음',
  }

  // 경제지표 티커 데이터 (현재 + 이전 주차)
  const [tickerIndicators, tickerPreviousIndicators] = currentWeek
    ? await Promise.all([
        getIndicatorsByWeek(supabase, currentWeek.id),
        getPreviousIndicators(supabase, currentWeek.id),
      ])
    : [[], []]

  return (
    <>
      <div className="min-h-screen bg-muted/30">
        <Header
          currentWeek={weekInfo}
          user={{ nickname: profile.nickname }}
          isAdmin={profile.role === 'admin'}
        />
        <IndicatorsTicker indicators={tickerIndicators} previousIndicators={tickerPreviousIndicators} />
        <main>{children}</main>
      </div>
      <Script
        src="https://cdn.sori.life/widget.js"
        data-project-id="cml769a4xOAUXRQwhpic"
        strategy="afterInteractive"
        integrity="sha384-fI8F8Oi5GKR07EX91Z+fZLBNZPTO6jbWxclju9PsPTqNjqnj1MGpSeAr9MEA9W7o"
        crossOrigin="anonymous"
      />
    </>
  )
}
