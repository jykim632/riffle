import { createClient } from '@/lib/supabase/server'
import { InviteCodesList } from '@/components/admin/invite-codes/invite-codes-list'
import { InviteCodesStats } from '@/components/admin/invite-codes/invite-codes-stats'
import { CreateCodesButton } from '@/components/admin/invite-codes/create-codes-button'

export default async function InviteCodesPage() {
  const supabase = await createClient()

  // 초대 코드 목록 조회 (최신순)
  const { data: codes } = await supabase
    .from('invite_codes')
    .select('id, code, is_used, created_at, used_at, created_by, used_by, season_id')
    .order('created_at', { ascending: false })

  // 시즌 목록 조회
  const { data: seasons } = await supabase
    .from('seasons')
    .select('id, name, is_active')
    .order('created_at', { ascending: false })

  // 시즌 이름 맵
  const seasonMap = new Map<string, string>()
  for (const s of seasons || []) {
    seasonMap.set(s.id, s.name)
  }

  // 활성 시즌
  const activeSeason = (seasons || []).find((s) => s.is_active) ?? null

  // 관련 사용자 ID 수집 → 일괄 프로필 조회 (N+1 → 2 쿼리)
  const userIds = new Set<string>()
  for (const code of codes || []) {
    if (code.created_by) userIds.add(code.created_by)
    if (code.used_by) userIds.add(code.used_by)
  }

  const nicknameMap = new Map<string, string>()
  if (userIds.size > 0) {
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, nickname')
      .in('id', [...userIds])
    for (const p of profiles || []) {
      nicknameMap.set(p.id, p.nickname)
    }
  }

  const codesWithDetails = (codes || []).map((code) => ({
    ...code,
    created_by_nickname: code.created_by ? nicknameMap.get(code.created_by) ?? null : null,
    used_by_nickname: code.used_by ? nicknameMap.get(code.used_by) ?? null : null,
    season_name: code.season_id ? seasonMap.get(code.season_id) ?? null : null,
  }))

  // 통계
  const total = codesWithDetails.length
  const used = codesWithDetails.filter((c) => c.is_used).length
  const unused = total - used

  const seasonOptions = (seasons || []).map((s) => ({
    id: s.id,
    name: s.name,
    isActive: s.is_active,
  }))

  return (
    <div>
      <div className="mb-4 flex flex-col gap-3 sm:mb-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold sm:text-3xl">초대 코드 관리</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            초대 코드 생성 및 사용 현황
          </p>
        </div>
        <CreateCodesButton
          seasons={seasonOptions}
          activeSeasonId={activeSeason?.id ?? null}
        />
      </div>

      <div className="mb-6">
        <InviteCodesStats total={total} used={used} unused={unused} />
      </div>

      <InviteCodesList codes={codesWithDetails} />
    </div>
  )
}
