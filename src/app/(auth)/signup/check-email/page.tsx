'use client'

import { Suspense, useState, useEffect, useCallback } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Mail, RotateCw } from 'lucide-react'
import { resendVerificationEmail } from '@/actions/auth'

const COOLDOWN_SECONDS = 60

function CheckEmailContent() {
  const searchParams = useSearchParams()
  const email = searchParams.get('email')
  const [resendState, setResendState] = useState<'idle' | 'loading' | 'sent' | 'error'>('idle')
  const [errorMessage, setErrorMessage] = useState('')
  const [cooldown, setCooldown] = useState(0)

  useEffect(() => {
    if (cooldown <= 0) return
    const timer = setInterval(() => setCooldown((c) => c - 1), 1000)
    return () => clearInterval(timer)
  }, [cooldown])

  const handleResend = useCallback(async () => {
    if (!email || cooldown > 0) return

    setResendState('loading')
    setErrorMessage('')

    const result = await resendVerificationEmail(email)

    if (result.error) {
      setResendState('error')
      setErrorMessage(result.error)
    } else {
      setResendState('sent')
      setCooldown(COOLDOWN_SECONDS)
    }
  }, [email, cooldown])

  return (
    <Card className="border-2 shadow-xl backdrop-blur-sm bg-background/95">
      <CardHeader className="space-y-1 pb-4 text-center">
        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-950/50">
          <Mail className="h-6 w-6 text-blue-600 dark:text-blue-400" />
        </div>
        <CardTitle className="text-2xl font-bold tracking-tight">인증 메일을 확인해주세요</CardTitle>
      </CardHeader>
      <CardContent className="text-center space-y-3">
        <p className="text-sm text-muted-foreground">
          {email ? (
            <>
              <span className="font-medium text-foreground">{email}</span>
              <span>로 인증 메일을 발송했습니다.</span>
            </>
          ) : (
            '입력하신 이메일로 인증 메일을 발송했습니다.'
          )}
        </p>
        <p className="text-sm text-muted-foreground">
          메일의 인증 링크를 클릭하면 가입이 완료됩니다.
        </p>
        <p className="text-xs text-muted-foreground/80 bg-muted/50 rounded-md px-3 py-2">
          메일이 보이지 않으면 <span className="font-semibold text-foreground">스팸함</span>을 확인해주세요.
        </p>
      </CardContent>
      <CardFooter className="flex flex-col space-y-3 pt-2">
        {email && (
          <div className="w-full space-y-2">
            <Button
              variant="default"
              className="w-full h-10 text-sm font-medium transition-all duration-200"
              onClick={handleResend}
              disabled={resendState === 'loading' || cooldown > 0}
            >
              {resendState === 'loading' ? (
                <>
                  <RotateCw className="mr-2 h-4 w-4 animate-spin" />
                  발송 중...
                </>
              ) : cooldown > 0 ? (
                `${cooldown}초 후 다시 보내기`
              ) : (
                '인증 메일 다시 보내기'
              )}
            </Button>
            {resendState === 'sent' && (
              <p className="text-xs text-center text-green-600 dark:text-green-400">
                인증 메일을 다시 발송했습니다.
              </p>
            )}
            {resendState === 'error' && errorMessage && (
              <p className="text-xs text-center text-destructive">
                {errorMessage}
              </p>
            )}
          </div>
        )}
        <Button
          asChild
          variant="outline"
          className="w-full h-10 text-sm font-medium border-2 hover:bg-muted/50 hover:border-muted-foreground/40 transition-all duration-200"
        >
          <Link href="/login">로그인 페이지로 이동</Link>
        </Button>
      </CardFooter>
    </Card>
  )
}

export default function CheckEmailPage() {
  return (
    <Suspense>
      <CheckEmailContent />
    </Suspense>
  )
}
