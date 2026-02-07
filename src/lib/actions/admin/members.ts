'use server'

import { revalidatePath } from 'next/cache'
import { requireAdmin } from './auth-guard'

/**
 * 멤버 역할 변경 (admin ↔ member)
 */
export async function updateMemberRoleAction(
  userId: string,
  role: 'admin' | 'member'
) {
  const auth = await requireAdmin()
  if (!auth.authorized) return auth.response

  const { error } = await auth.supabase
    .from('profiles')
    .update({ role })
    .eq('id', userId)

  if (error) {
    return { success: false, error: '역할 변경에 실패했습니다.' }
  }

  revalidatePath('/admin/members')
  return { success: true }
}
