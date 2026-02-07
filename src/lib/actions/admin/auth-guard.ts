import { createClient } from '@/lib/supabase/server'
import { isAdmin } from '@/lib/utils/season-membership'

const UNAUTHORIZED = { success: false as const, error: '로그인이 필요합니다.' }
const FORBIDDEN = { success: false as const, error: '권한이 없습니다.' }

/**
 * Admin action 공통 인가 체크
 * 인증 + admin role 확인 후 supabase 클라이언트와 user 반환
 */
export async function requireAdmin() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { authorized: false as const, response: UNAUTHORIZED }
  }

  const admin = await isAdmin(user.id)
  if (!admin) {
    return { authorized: false as const, response: FORBIDDEN }
  }

  return { authorized: true as const, supabase, user }
}
