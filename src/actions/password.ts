'use server'

import { headers } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import { resetRequestSchema, updatePasswordSchema } from '@/lib/schemas'
import { rateLimit } from '@/lib/rate-limit'

const RATE_LIMIT_ERROR = '요청이 너무 많습니다. 잠시 후 다시 시도해주세요.'

async function getClientIp(): Promise<string> {
  const h = await headers()
  return h.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'
}

// 비밀번호 초기화 이메일 요청
export async function requestPasswordReset(formData: FormData) {
  const ip = await getClientIp()
  if (rateLimit(`reset:${ip}`, { limit: 3, windowMs: 60_000 }).limited) {
    return { error: RATE_LIMIT_ERROR }
  }

  const rawData = {
    email: formData.get('email') as string,
  }

  const result = resetRequestSchema.safeParse(rawData)
  if (!result.success) {
    return { error: '유효한 이메일을 입력해주세요.' }
  }

  const origin = formData.get('origin') as string
  const supabase = await createClient()

  await supabase.auth.resetPasswordForEmail(result.data.email, {
    redirectTo: `${origin}/auth/confirm?next=/reset-password/update`,
  })

  // 이메일 존재 여부와 무관하게 항상 성공 응답 (보안)
  return { success: true }
}

// 새 비밀번호 설정
export async function updatePassword(formData: FormData) {
  const ip = await getClientIp()
  if (rateLimit(`update-pw:${ip}`, { limit: 5, windowMs: 60_000 }).limited) {
    return { error: RATE_LIMIT_ERROR }
  }

  const rawData = {
    password: formData.get('password') as string,
    confirmPassword: formData.get('confirmPassword') as string,
  }

  const result = updatePasswordSchema.safeParse(rawData)
  if (!result.success) {
    const firstError = result.error.issues[0]
    return { error: firstError?.message || '입력값이 올바르지 않습니다.' }
  }

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
