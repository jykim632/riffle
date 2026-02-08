import { createClient } from '@/lib/supabase/server'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { MembersList } from '@/components/admin/members/members-list'

export default async function MembersPage() {
  const supabase = await createClient()

  // service role 클라이언트로 auth.users의 provider 정보 조회
  const adminClient = createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  )
  const { data: authUsers } = await adminClient.auth.admin.listUsers()
  const providerMap = new Map<string, string[]>()
  for (const u of authUsers?.users || []) {
    providerMap.set(u.id, u.app_metadata?.providers || [])
  }

  // 현재 사용자 ID
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

      const providers = providerMap.get(profile.id) || []
      return {
        ...profile,
        seasons,
        hasPassword: providers.includes('email'),
      }
    })
  )

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold">멤버 관리</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          멤버 목록 및 역할 변경
        </p>
      </div>

      <MembersList
        members={membersWithSeasons}
        currentUserId={user?.id || ''}
      />
    </div>
  )
}
