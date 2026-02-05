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

  // 생성자/사용자 닉네임 조회
  const codesWithNicknames = await Promise.all(
    (codes || []).map(async (code) => {
      let created_by_nickname: string | null = null
      let used_by_nickname: string | null = null

      if (code.created_by) {
        const { data: creator } = await supabase
          .from('profiles')
          .select('nickname')
          .eq('id', code.created_by)
          .single()
        created_by_nickname = creator?.nickname || null
      }

      if (code.used_by) {
        const { data: user } = await supabase
          .from('profiles')
          .select('nickname')
          .eq('id', code.used_by)
          .single()
        used_by_nickname = user?.nickname || null
      }

      return {
        ...code,
        created_by_nickname,
        used_by_nickname,
      }
    })
  )

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
