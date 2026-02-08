import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import type { EmailOtpType } from '@supabase/supabase-js'

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const tokenHash = requestUrl.searchParams.get('token_hash')
  const type = requestUrl.searchParams.get('type') as EmailOtpType | null
  const next = requestUrl.searchParams.get('next') || '/'

  // next 경로 검증 (open redirect 방지)
  const safeNext = next.startsWith('/') ? next : '/'

  if (!tokenHash || !type) {
    return NextResponse.redirect(
      `${requestUrl.origin}/login?error=${encodeURIComponent('잘못된 링크입니다.')}`
    )
  }

  const supabase = await createClient()

  const { error } = await supabase.auth.verifyOtp({
    type,
    token_hash: tokenHash,
  })

  if (error) {
    const errorRedirect = type === 'recovery'
      ? `/reset-password?error=${encodeURIComponent('링크가 만료되었습니다. 다시 요청해주세요.')}`
      : `/login?error=${encodeURIComponent('링크가 만료되었습니다. 다시 요청해주세요.')}`
    return NextResponse.redirect(`${requestUrl.origin}${errorRedirect}`)
  }

  return NextResponse.redirect(`${requestUrl.origin}${safeNext}`)
}
