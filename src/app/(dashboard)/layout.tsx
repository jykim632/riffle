import { createClient } from '@/lib/supabase/server'
import { Header } from '@/components/dashboard/header'
import { redirect } from 'next/navigation'

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
    .select('nickname')
    .eq('id', user.id)
    .single()

  if (!profile) {
    redirect('/login')
  }

  // 현재 주차 조회
  const { data: currentWeek } = await supabase
    .from('weeks')
    .select('week_number, title')
    .eq('is_current', true)
    .maybeSingle()

  // 현재 주차가 없으면 기본값 사용
  const weekInfo = currentWeek || {
    week_number: 0,
    title: '주차 없음',
  }

  return (
    <div className="min-h-screen">
      <Header
        currentWeek={weekInfo}
        user={{ nickname: profile.nickname }}
      />
      <main className="bg-muted/30">{children}</main>
    </div>
  )
}
