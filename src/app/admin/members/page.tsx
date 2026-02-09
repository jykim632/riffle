import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { MembersList } from '@/components/admin/members/members-list'

export default async function MembersPage() {
  const supabase = await createClient()

  // service role 클라이언트로 auth.users의 provider 정보 조회
  const adminClient = createAdminClient()
  const { data: authUsers } = await adminClient.auth.admin.listUsers()
  const authUserMap = new Map<string, { providers: string[]; email: string; lastSignIn: string | null }>()
  for (const u of authUsers?.users || []) {
    authUserMap.set(u.id, {
      providers: u.app_metadata?.providers || [],
      email: u.email || '',
      lastSignIn: u.last_sign_in_at || null,
    })
  }

  // 현재 사용자 ID (layout에서 인증 확인 완료)
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // 전체 멤버 조회
  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, nickname, role, created_at')
    .order('created_at', { ascending: true })

  // 각 멤버의 시즌 소속 정보 조회
  const membersWithSeasons = await Promise.all(
    (profiles || []).map(async (profile) => {
      const { data: seasonMembers } = await supabase
        .from('season_members')
        .select('season_id, seasons(name)')
        .eq('user_id', profile.id)

      const seasons = (seasonMembers || [])
        .map((sm) => {
          const seasonData = sm.seasons as unknown as { name: string } | null
          return seasonData?.name
        })
        .filter((name): name is string => !!name)

      const authInfo = authUserMap.get(profile.id)
      return {
        ...profile,
        email: authInfo?.email || '',
        providers: authInfo?.providers || [],
        lastSignIn: authInfo?.lastSignIn || null,
        seasons,
        hasPassword: authInfo?.providers?.includes('email') || false,
      }
    })
  )

  // 유령 계정 분리 (auth.users에만 존재, profiles에 없는 계정)
  const profileIds = new Set(profiles?.map((p) => p.id) || [])
  const orphanUsers = (authUsers?.users || [])
    .filter((u) => !profileIds.has(u.id))
    .map((u) => ({
      id: u.id,
      email: u.email || '',
      providers: u.app_metadata?.providers || [],
      created_at: u.created_at,
    }))

  return (
    <div>
      <div className="mb-4 sm:mb-6">
        <h1 className="text-2xl font-bold sm:text-3xl">멤버 관리</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          멤버 목록 및 역할 변경
        </p>
      </div>

      <MembersList
        members={membersWithSeasons}
        currentUserId={user?.id || ''}
        orphanUsers={orphanUsers}
      />
    </div>
  )
}
