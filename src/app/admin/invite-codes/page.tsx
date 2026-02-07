import { createClient } from '@/lib/supabase/server'
import { InviteCodesList } from '@/components/admin/invite-codes/invite-codes-list'
import { InviteCodesStats } from '@/components/admin/invite-codes/invite-codes-stats'
import { CreateCodesButton } from '@/components/admin/invite-codes/create-codes-button'

export default async function InviteCodesPage() {
  const supabase = await createClient()

  // 초대 코드 목록 조회 (최신순)
  const { data: codes } = await supabase
    .from('invite_codes')
    .select('id, code, is_used, created_at, used_at, created_by, used_by')
    .order('created_at', { ascending: false })

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

  const codesWithNicknames = (codes || []).map((code) => ({
    ...code,
    created_by_nickname: code.created_by ? nicknameMap.get(code.created_by) ?? null : null,
    used_by_nickname: code.used_by ? nicknameMap.get(code.used_by) ?? null : null,
  }))

  // 통계
  const total = codesWithNicknames.length
  const used = codesWithNicknames.filter((c) => c.is_used).length
  const unused = total - used

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">초대 코드 관리</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            초대 코드 생성 및 사용 현황
          </p>
        </div>
        <CreateCodesButton />
      </div>

      <div className="mb-6">
        <InviteCodesStats total={total} used={used} unused={unused} />
      </div>

      <InviteCodesList codes={codesWithNicknames} />
    </div>
  )
}
