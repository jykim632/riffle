'use server'

import { revalidatePath } from 'next/cache'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
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

  const { error } = await adminClient.auth.admin.updateUserById(userId, {
    password: resetPassword,
  })

  if (error) {
    return { success: false, error: '비밀번호 초기화에 실패했습니다.' }
  }

  return { success: true }
}
