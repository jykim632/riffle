'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { parseFormData } from '@/lib/actions/types'
import { updateNicknameSchema } from '@/lib/schemas'

export async function updateNickname(formData: FormData) {
  const rawData = {
    nickname: formData.get('nickname') as string,
  }

  const result = parseFormData(updateNicknameSchema, rawData)
  if (!result.success) return { error: result.error }

  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { error: '로그인이 필요합니다.' }
  }

  const { error } = await supabase
    .from('profiles')
    .update({ nickname: result.data.nickname })
    .eq('id', user.id)

  if (error) {
    return { error: '닉네임 변경에 실패했습니다. 다시 시도해주세요.' }
  }

  revalidatePath('/', 'layout')
  return { success: true }
}
