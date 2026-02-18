'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { parseFormData } from '@/lib/actions/types'
import { resetRequestSchema, updatePasswordSchema, changePasswordSchema } from '@/lib/schemas'
import { rateLimit } from '@/lib/rate-limit'
import { getClientIp } from '@/lib/utils/ip'

const RATE_LIMIT_ERROR = '요청이 너무 많습니다. 잠시 후 다시 시도해주세요.'

// 비밀번호 초기화 이메일 요청
export async function requestPasswordReset(formData: FormData) {
  const ip = await getClientIp()
  if ((await rateLimit(`reset:${ip}`, { limit: 3, windowMs: 60_000 })).limited) {
    return { error: RATE_LIMIT_ERROR }
  }

  const rawData = {
    email: formData.get('email') as string,
  }

  const result = parseFormData(resetRequestSchema, rawData)
  if (!result.success) return { error: result.error }

  // 이메일 존재 여부에 관계없이 동일 응답 (열거 공격 방지)
  const adminClient = createAdminClient()
  const { data: exists } = await adminClient.rpc('check_email_exists', {
    email_input: result.data.email,
  })

  if (exists) {
    const origin = process.env.NEXT_PUBLIC_APP_URL
    const supabase = await createClient()

    await supabase.auth.resetPasswordForEmail(result.data.email, {
      redirectTo: `${origin}/auth/confirm?next=/reset-password/update`,
    })
  }

  return { success: true }
}

// 새 비밀번호 설정
export async function updatePassword(formData: FormData) {
  const ip = await getClientIp()
  if ((await rateLimit(`update-pw:${ip}`, { limit: 5, windowMs: 60_000 })).limited) {
    return { error: RATE_LIMIT_ERROR }
  }

  const rawData = {
    password: formData.get('password') as string,
    confirmPassword: formData.get('confirmPassword') as string,
  }

  const result = parseFormData(updatePasswordSchema, rawData)
  if (!result.success) return { error: result.error }

  const supabase = await createClient()

  const { error } = await supabase.auth.updateUser({
    password: result.data.password,
  })

  if (error) {
    return { error: '비밀번호 변경에 실패했습니다. 다시 시도해주세요.' }
  }

  await supabase.auth.signOut()
  return { success: true }
}

// 비밀번호 변경 (로그인 상태)
export async function changePassword(formData: FormData) {
  const ip = await getClientIp()
  if ((await rateLimit(`change-pw:${ip}`, { limit: 5, windowMs: 60_000 })).limited) {
    return { error: RATE_LIMIT_ERROR }
  }

  const rawData = {
    currentPassword: formData.get('currentPassword') as string,
    newPassword: formData.get('newPassword') as string,
    confirmPassword: formData.get('confirmPassword') as string,
  }

  const result = parseFormData(changePasswordSchema, rawData)
  if (!result.success) return { error: result.error }

  const supabase = await createClient()

  // 현재 사용자 확인
  const { data: { user } } = await supabase.auth.getUser()
  if (!user?.email) {
    return { error: '로그인이 필요합니다.' }
  }

  // 현재 비밀번호 검증
  const { error: signInError } = await supabase.auth.signInWithPassword({
    email: user.email,
    password: result.data.currentPassword,
  })

  if (signInError) {
    return { error: '현재 비밀번호가 올바르지 않습니다.' }
  }

  // 새 비밀번호 설정
  const { error } = await supabase.auth.updateUser({
    password: result.data.newPassword,
  })

  if (error) {
    return { error: '비밀번호 변경에 실패했습니다. 다시 시도해주세요.' }
  }

  return { success: true }
}
