import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
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
    const { data: profile } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', data.user.id)
      .maybeSingle()

    // 신규 사용자인 경우 초대 코드 검증
    if (!profile && inviteCode) {
      // service_role로 초대 코드 검증
      const adminClient = createAdminClient()

      const { data: codeData } = await adminClient
        .from('invite_codes')
        .select()
        .eq('code', inviteCode.toUpperCase())
        .eq('is_used', false)
        .maybeSingle()

      if (!codeData) {
        // 초대 코드 없음 - 계정 삭제하고 에러
        await supabase.auth.signOut()
        return NextResponse.redirect(
          `${requestUrl.origin}/google?error=${encodeURIComponent('유효하지 않은 초대 코드입니다.')}`
        )
      }

      // 초대 코드 원자적 사용 처리 (DB 함수로 race condition 방지)
      const { data: acquired } = await adminClient.rpc('acquire_invite_code', {
        code_input: inviteCode,
        user_id_input: data.user.id,
      })

      if (!acquired) {
        console.error('초대 코드 사용 실패 (OAuth):', {
          code: inviteCode,
          userId: data.user.id,
        })
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
