import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { ProfileForm } from './profile-form'

export default async function ProfilePage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect('/login')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('nickname, role, created_at')
    .eq('id', user.id)
    .single()

  if (!profile) {
    redirect('/dashboard')
  }

  // 참여 시즌 조회
  const { data: seasonMembers } = await supabase
    .from('season_members')
    .select('joined_at, seasons(name, start_date, end_date, is_active)')
    .eq('user_id', user.id)
    .order('joined_at', { ascending: false })

  const seasons = (seasonMembers ?? []).map((sm) => {
    const s = Array.isArray(sm.seasons) ? sm.seasons[0] : sm.seasons
    return {
      name: s?.name ?? '',
      startDate: s?.start_date ?? '',
      endDate: s?.end_date ?? '',
      isActive: s?.is_active ?? false,
    }
  })

  const provider = user.app_metadata?.provider ?? 'email'
  const hasPassword = provider === 'email'

  return (
    <ProfileForm
      email={user.email ?? ''}
      nickname={profile.nickname}
      role={profile.role}
      createdAt={profile.created_at}
      hasPassword={hasPassword}
      seasons={seasons}
    />
  )
}
