import { createClient } from '@/lib/supabase/server'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const inviteCode = requestUrl.searchParams.get('invite_code')

  if (code) {
    const supabase = await createClient()

    // OAuth 코드를 세션으로 교환
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)

    if (error) {
      return NextResponse.redirect(
        `${requestUrl.origin}/login?error=${encodeURIComponent(error.message)}`
      )
    }

    if (!data.user) {
      return NextResponse.redirect(`${requestUrl.origin}/login?error=no_user`)
    }

    // 신규 사용자 확인 (profiles 테이블 조회)
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', data.user.id)
      .single()

    // 신규 사용자인 경우 초대 코드 검증
    if (!profile && inviteCode) {
      // service_role로 초대 코드 검증
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

      const { data: codeData } = await adminClient
        .from('invite_codes')
        .select()
        .eq('code', inviteCode.toUpperCase())
        .eq('is_used', false)
        .single()

      if (!codeData) {
        // 초대 코드 없음 - 계정 삭제하고 에러
        await supabase.auth.signOut()
        return NextResponse.redirect(
          `${requestUrl.origin}/google?error=${encodeURIComponent('유효하지 않은 초대 코드입니다.')}`
        )
      }

      // 초대 코드 사용 처리 (optimistic locking)
      const { data: updatedCode } = await adminClient
        .from('invite_codes')
        .update({
          is_used: true,
          used_by: data.user.id,
          used_at: new Date().toISOString(),
        })
        .eq('id', codeData.id)
        .eq('is_used', false)
        .select()
        .single()

      if (!updatedCode) {
        // 극히 드문 케이스: race condition
        console.error('초대 코드 중복 사용 감지 (OAuth):', {
          code: inviteCode,
          userId: data.user.id,
          email: data.user.email,
        })
        // 로그만 남기고 진행
      }
    } else if (!profile && !inviteCode) {
      // 신규 사용자인데 초대 코드 없음 - 회원가입 페이지로 안내
      await supabase.auth.signOut()
      return NextResponse.redirect(
        `${requestUrl.origin}/signup?error=${encodeURIComponent('회원가입이 필요합니다. 초대 코드를 입력해주세요.')}`
      )
    }

    // profiles는 트리거가 자동 생성했을 것 (auth.users INSERT 시)
    // 성공 - 대시보드로 리다이렉트
    return NextResponse.redirect(`${requestUrl.origin}/dashboard`)
  }

  // code 파라미터 없음
  return NextResponse.redirect(`${requestUrl.origin}/login`)
}
