'use server'

import { inviteCode } from '@/lib/nanoid'
import { revalidatePath } from 'next/cache'
import { requireAdmin } from './auth-guard'
import { adminCreateInviteCodeSchema, inviteCodeIdSchema } from '@/lib/schemas/admin'

/**
 * 초대 코드 생성
 */
export async function createInviteCodeAction(
  count: number = 1,
  seasonId?: string | null
) {
  const auth = await requireAdmin()
  if (!auth.authorized) return auth.response

  const parsed = adminCreateInviteCodeSchema.safeParse({ count, seasonId: seasonId ?? null })
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message }
  }

  const codes = Array.from({ length: count }, () => ({
    code: inviteCode(),
    created_by: auth.user.id,
    ...(seasonId ? { season_id: seasonId } : {}),
  }))

  const { data, error } = await auth.supabase
    .from('invite_codes')
    .insert(codes)
    .select('code')

  if (error) {
    return { success: false, error: '초대 코드 생성에 실패했습니다.' }
  }

  revalidatePath('/admin/invite-codes')
  return { success: true, codes: data?.map((d) => d.code) || [] }
}

/**
 * 초대 코드 삭제 (미사용 코드만)
 */
export async function deleteInviteCodeAction(codeId: string) {
  const auth = await requireAdmin()
  if (!auth.authorized) return auth.response

  const parsed = inviteCodeIdSchema.safeParse(codeId)
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message }
  }

  const { error } = await auth.supabase
    .from('invite_codes')
    .delete()
    .eq('id', codeId)
    .eq('is_used', false)

  if (error) {
    return { success: false, error: '초대 코드 삭제에 실패했습니다.' }
  }

  revalidatePath('/admin/invite-codes')
  return { success: true }
}
