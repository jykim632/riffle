'use server'

import { revalidatePath } from 'next/cache'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireAdmin } from './auth-guard'
import { updateMemberRoleSchema, userIdSchema } from '@/lib/schemas/admin'

/**
 * 멤버 역할 변경 (admin ↔ member)
 */
export async function updateMemberRoleAction(
  userId: string,
  role: 'admin' | 'member'
) {
  const auth = await requireAdmin()
  if (!auth.authorized) return auth.response

  const parsed = updateMemberRoleSchema.safeParse({ userId, role })
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message }
  }

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

  const parsed = userIdSchema.safeParse(userId)
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message }
  }

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
 * 해당 멤버 이메일로 비밀번호 재설정 메일 발송
 */
export async function resetMemberPasswordAction(userId: string) {
  const auth = await requireAdmin()
  if (!auth.authorized) return auth.response

  const parsed = userIdSchema.safeParse(userId)
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message }
  }

  const adminClient = createAdminClient()

  // 대상 유저 이메일 조회
  const { data: targetUser, error: userError } = await adminClient.auth.admin.getUserById(userId)

  if (userError || !targetUser?.user?.email) {
    return { success: false, error: '사용자 정보를 찾을 수 없습니다.' }
  }

  const origin = process.env.NEXT_PUBLIC_APP_URL
  const { error } = await auth.supabase.auth.resetPasswordForEmail(
    targetUser.user.email,
    { redirectTo: `${origin}/auth/confirm?next=/reset-password/update` }
  )

  if (error) {
    return { success: false, error: '비밀번호 재설정 메일 발송에 실패했습니다.' }
  }

  return { success: true }
}
