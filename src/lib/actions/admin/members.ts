'use server'

import { revalidatePath } from 'next/cache'
import { createAdminClient } from '@/lib/supabase/admin'
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

/**
 * 계정 삭제 (관리자 전용)
 * auth.users 삭제 → profiles CASCADE 삭제 → summaries/season_members SET NULL 익명화
 */
export async function deleteUserAccountAction(userId: string) {
  const auth = await requireAdmin()
  if (!auth.authorized) return auth.response

  // 관리자 본인 삭제 방지
  if (auth.user.id === userId) {
    return { success: false, error: '본인 계정은 삭제할 수 없습니다.' }
  }

  const adminClient = createAdminClient()

  const { error } = await adminClient.auth.admin.deleteUser(userId)

  if (error) {
    return { success: false, error: '계정 삭제에 실패했습니다.' }
  }

  revalidatePath('/admin/members')
  return { success: true }
}

/**
 * 멤버 비밀번호 초기화 (관리자 전용)
 * 환경변수 ADMIN_RESET_PASSWORD에 설정된 고정 비밀번호로 초기화
 */
export async function resetMemberPasswordAction(userId: string) {
  const auth = await requireAdmin()
  if (!auth.authorized) return auth.response

  const resetPassword = process.env.ADMIN_RESET_PASSWORD
  if (!resetPassword) {
    return { success: false, error: 'ADMIN_RESET_PASSWORD 환경변수가 설정되지 않았습니다.' }
  }

  const adminClient = createAdminClient()

  const { error } = await adminClient.auth.admin.updateUserById(userId, {
    password: resetPassword,
  })

  if (error) {
    return { success: false, error: '비밀번호 초기화에 실패했습니다.' }
  }

  return { success: true }
}
