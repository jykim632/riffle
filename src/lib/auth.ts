import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

/**
 * 인증된 사용자 확인. 미인증 시 /login으로 리다이렉트.
 * 서버 컴포넌트/서버 액션에서 사용.
 */
export async function requireUser() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  return { supabase, user }
}
