'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { parseFormData } from '@/lib/actions/types'
import { getCurrentSeason } from '@/lib/queries/season'
import {
  createSharedLinkSchema,
  deleteSharedLinkSchema,
} from '@/lib/schemas/shared-link'

export async function createSharedLink(formData: FormData) {
  const rawData = {
    url: formData.get('url') as string,
    title: formData.get('title') as string,
    category: formData.get('category') as string,
    comment: formData.get('comment') as string,
  }

  const result = parseFormData(createSharedLinkSchema, rawData)
  if (!result.success) return { error: result.error }

  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: '로그인이 필요합니다.' }
  }

  const currentSeason = await getCurrentSeason(supabase)
  if (!currentSeason) {
    return { error: '현재 활성 시즌이 없습니다.' }
  }

  const { error } = await supabase.from('shared_links').insert({
    season_id: currentSeason.id,
    author_id: user.id,
    url: result.data.url,
    title: result.data.title,
    category: result.data.category,
    comment: result.data.comment ?? null,
  })

  if (error) {
    return { error: '링크 공유에 실패했습니다.' }
  }

  revalidatePath('/links')
  return { success: true }
}

export async function deleteSharedLink(formData: FormData) {
  const rawData = {
    linkId: formData.get('linkId') as string,
  }

  const result = parseFormData(deleteSharedLinkSchema, rawData)
  if (!result.success) return { error: result.error }

  const supabase = await createClient()

  const { error } = await supabase
    .from('shared_links')
    .delete()
    .eq('id', result.data.linkId)

  if (error) {
    return { error: '링크 삭제에 실패했습니다.' }
  }

  revalidatePath('/links')
  return { success: true }
}
