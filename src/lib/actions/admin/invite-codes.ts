'use server'

import { inviteCode } from '@/lib/nanoid'
import { revalidatePath } from 'next/cache'
import { requireAdmin } from './auth-guard'

const MAX_INVITE_CODES = 50

/**
 * 초대 코드 생성
 */
export async function createInviteCodeAction(count: number = 1) {
  const auth = await requireAdmin()
  if (!auth.authorized) return auth.response

  if (count < 1 || count > MAX_INVITE_CODES) {
    return { success: false, error: `1~${MAX_INVITE_CODES}개 사이로 입력하세요.` }
  }

  const codes = Array.from({ length: count }, () => ({
    code: inviteCode(),
    created_by: auth.user.id,
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
