'use server'

import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { parseFormData } from '@/lib/actions/types'
import { loginSchema, signupSchema } from '@/lib/schemas'
import { rateLimit } from '@/lib/rate-limit'
import { getClientIp } from '@/lib/utils/ip'

const RATE_LIMIT_ERROR = '요청이 너무 많습니다. 잠시 후 다시 시도해주세요.'

// 로그인
export async function login(formData: FormData) {
  const ip = await getClientIp()
  if ((await rateLimit(`login:${ip}`, { limit: 10, windowMs: 60_000 })).limited) {
    return { error: RATE_LIMIT_ERROR }
  }

  const rawData = {
    email: formData.get('email') as string,
    password: formData.get('password') as string,
  }

  const result = parseFormData(loginSchema, rawData)
  if (!result.success) return { error: result.error }

  const { email, password } = result.data
  const supabase = await createClient()

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    if (error.message.includes('Email not confirmed')) {
      return { error: '이메일 인증이 완료되지 않았습니다. 메일함을 확인해주세요.' }
    }
    return { error: '이메일 또는 비밀번호가 올바르지 않습니다.' }
  }

  redirect('/dashboard')
}

// 로그아웃
export async function logout() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/login')
}

// 회원가입
export async function signup(formData: FormData) {
  const ip = await getClientIp()
  if ((await rateLimit(`signup:${ip}`, { limit: 5, windowMs: 60_000 })).limited) {
    return { error: RATE_LIMIT_ERROR }
  }

  const rawData = {
    email: formData.get('email') as string,
    password: formData.get('password') as string,
    nickname: formData.get('nickname') as string,
    inviteCode: formData.get('inviteCode') as string,
  }

  const validationResult = parseFormData(signupSchema, rawData)
  if (!validationResult.success) return { error: validationResult.error }

  const { email, password, nickname, inviteCode } = validationResult.data

  // 1. service_role로 초대 코드 검증 (RLS 우회)
  const adminClient = createAdminClient()

  const { data: code } = await adminClient
    .from('invite_codes')
    .select()
    .eq('code', inviteCode.toUpperCase())
    .eq('is_used', false)
    .maybeSingle()

  if (!code) {
    return { error: '유효하지 않은 초대 코드입니다.' }
  }

  // 2. 회원가입 (트리거가 profiles 자동 생성)
  const h = await headers()
  const origin = h.get('origin') || h.get('x-forwarded-proto') + '://' + h.get('host')

  const supabase = await createClient()
  const { data: authData, error: signUpError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { nickname }, // raw_user_meta_data에 저장
      emailRedirectTo: `${origin}/auth/confirm?next=/dashboard`,
    },
  })

  if (signUpError) {
    return { error: '회원가입에 실패했습니다. 다시 시도해주세요.' }
  }

  if (!authData.user) {
    return { error: '회원가입에 실패했습니다.' }
  }

  // 3. 초대 코드 원자적 사용 처리 (DB 함수로 race condition 방지)
  const { data: acquired } = await adminClient.rpc('acquire_invite_code', {
    code_input: inviteCode,
    user_id_input: authData.user.id,
  })

  if (!acquired) {
    // 초대 코드 사용 실패 → 생성된 계정 정리
    console.error('초대 코드 사용 실패 (이미 사용됨):', {
      code: inviteCode,
      userId: authData.user.id,
    })
    await adminClient.auth.admin.deleteUser(authData.user.id)
    return { error: '초대 코드가 이미 사용되었습니다. 다른 코드를 사용해주세요.' }
  }

  return { success: true, email }
}
