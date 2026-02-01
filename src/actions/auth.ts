'use server'

import { redirect } from 'next/navigation'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/server'
import { loginSchema, signupSchema } from '@/lib/schemas'

// 로그인
export async function login(formData: FormData) {
  const rawData = {
    email: formData.get('email') as string,
    password: formData.get('password') as string,
  }

  // 입력값 검증
  const result = loginSchema.safeParse(rawData)
  if (!result.success) {
    return { error: '입력값이 올바르지 않습니다.' }
  }

  const { email, password } = result.data
  const supabase = await createClient()

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
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
  const rawData = {
    email: formData.get('email') as string,
    password: formData.get('password') as string,
    nickname: formData.get('nickname') as string,
    inviteCode: formData.get('inviteCode') as string,
  }

  // 입력값 검증
  const validationResult = signupSchema.safeParse(rawData)
  if (!validationResult.success) {
    const errors = validationResult.error.errors
    return { error: errors[0]?.message || '입력값이 올바르지 않습니다.' }
  }

  const { email, password, nickname, inviteCode } = validationResult.data

  // 1. service_role로 초대 코드 검증 (RLS 우회)
  const adminClient = createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  )

  const { data: code } = await adminClient
    .from('invite_codes')
    .select()
    .eq('code', inviteCode.toUpperCase())
    .eq('is_used', false)
    .single()

  if (!code) {
    return { error: '유효하지 않은 초대 코드입니다.' }
  }

  // 2. 회원가입 (트리거가 profiles 자동 생성)
  const supabase = await createClient()
  const { data: authData, error: signUpError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { nickname }, // raw_user_meta_data에 저장
    },
  })

  if (signUpError) {
    return { error: signUpError.message }
  }

  if (!authData.user) {
    return { error: '회원가입에 실패했습니다.' }
  }

  // 3. 초대 코드 사용 처리
  await adminClient
    .from('invite_codes')
    .update({
      is_used: true,
      used_by: authData.user.id,
      used_at: new Date().toISOString(),
    })
    .eq('id', code.id)

  redirect('/dashboard')
}
