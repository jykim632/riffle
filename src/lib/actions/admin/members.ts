'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

/**
 * 멤버 역할 변경 (admin ↔ member)
 */
export async function updateMemberRoleAction(
  userId: string,
  role: 'admin' | 'member'
) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('profiles')
    .update({ role })
    .eq('id', userId)

  if (error) {
    return { success: false, error: error.message }
  }

  revalidatePath('/admin/members')
  return { success: true }
}
