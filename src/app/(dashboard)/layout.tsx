import { requireUser } from '@/lib/auth'
import { getCurrentSeason, getCurrentWeek } from '@/lib/queries/season'
import { Header } from '@/components/dashboard/header'
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

  return (
    <>
      <div className="min-h-screen bg-muted/30">
        <Header
          currentWeek={weekInfo}
          user={{ nickname: profile.nickname }}
          isAdmin={profile.role === 'admin'}
        />
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
