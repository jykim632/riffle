'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { updateNicknameSchema } from '@/lib/schemas'

export async function updateNickname(formData: FormData) {
  const rawData = {
    nickname: formData.get('nickname') as string,
  }

  const result = updateNicknameSchema.safeParse(rawData)
  if (!result.success) {
    const firstError = result.error.issues[0]
    return { error: firstError?.message || '입력값이 올바르지 않습니다.' }
  }

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
