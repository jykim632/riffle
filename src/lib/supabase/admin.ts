import { createClient } from '@supabase/supabase-js'

/**
 * Supabase Admin 클라이언트 (service_role)
 * RLS를 우회해야 하는 서버 전용 작업에 사용.
 * 절대 클라이언트에 노출하지 말 것.
 */
export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  )
}
