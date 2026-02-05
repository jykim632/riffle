'use server'

import { createClient } from '@/lib/supabase/server'
import { inviteCode } from '@/lib/nanoid'
import { revalidatePath } from 'next/cache'

/**
 * 초대 코드 생성
 */
export async function createInviteCodeAction(count: number = 1) {
  const supabase = await createClient()

  // 현재 사용자 ID
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, error: '로그인이 필요합니다.' }
  }

  const codes = Array.from({ length: count }, () => ({
    code: inviteCode(),
    created_by: user.id,
  }))

  const { data, error } = await supabase
    .from('invite_codes')
    .insert(codes)
    .select('code')

  if (error) {
    return { success: false, error: error.message }
  }

  revalidatePath('/admin/invite-codes')
  return { success: true, codes: data?.map((d) => d.code) || [] }
}

/**
 * 초대 코드 삭제 (미사용 코드만)
 */
export async function deleteInviteCodeAction(codeId: string) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('invite_codes')
    .delete()
    .eq('id', codeId)
    .eq('is_used', false)

  if (error) {
    return { success: false, error: error.message }
  }

  revalidatePath('/admin/invite-codes')
  return { success: true }
}
