import { createClient } from '@/lib/supabase/server'
import { Header } from '@/components/dashboard/header'
import { redirect } from 'next/navigation'
import Script from 'next/script'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()

  // 현재 사용자 조회
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // 사용자 프로필 조회
  const { data: profile } = await supabase
    .from('profiles')
    .select('nickname, role')
    .eq('id', user.id)
    .single()

  if (!profile) {
    redirect('/login')
  }

  // 현재 시즌 조회
  const { data: currentSeason } = await supabase
    .from('seasons')
    .select('id')
    .eq('is_active', true)
    .maybeSingle()

  // 현재 주차 조회 (현재 시즌 내)
  const { data: currentWeek } = currentSeason
    ? await supabase
        .from('weeks')
        .select('week_number, title')
        .eq('season_id', currentSeason.id)
        .eq('is_current', true)
        .maybeSingle()
    : { data: null }

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
