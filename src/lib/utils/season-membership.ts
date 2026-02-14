import { createClient } from '@/lib/supabase/server'
import type { SupabaseClient } from '@supabase/supabase-js'

/**
 * 현재 시즌의 멤버인지 확인
 */
export async function isCurrentSeasonMember(userId: string, client?: SupabaseClient): Promise<boolean> {
  const supabase = client ?? await createClient()

  // 현재 활성 시즌 조회
  const { data: currentSeason } = await supabase
    .from('seasons')
    .select('id')
    .eq('is_active', true)
    .maybeSingle()

  if (!currentSeason) return false

  // 멤버십 확인
  const { data: membership } = await supabase
    .from('season_members')
    .select('id')
    .eq('season_id', currentSeason.id)
    .eq('user_id', userId)
    .maybeSingle()

  return !!membership
}

/**
 * 특정 시즌의 멤버인지 확인
 */
export async function isSeasonMember(
  userId: string,
  seasonId: string
): Promise<boolean> {
  const supabase = await createClient()

  const { data: membership } = await supabase
    .from('season_members')
    .select('id')
    .eq('season_id', seasonId)
    .eq('user_id', userId)
    .maybeSingle()

  return !!membership
}

/**
 * 관리자인지 확인
 */
export async function isAdmin(userId: string, client?: SupabaseClient): Promise<boolean> {
  const supabase = client ?? await createClient()

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', userId)
    .maybeSingle()

  return profile?.role === 'admin'
}
