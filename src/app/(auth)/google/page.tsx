'use client'

import { useState, useEffect, Suspense, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { createClient } from '@/lib/supabase/client'
import { Loader2, AlertCircle, Ticket } from 'lucide-react'

const inviteCodeSchema = z.object({
  inviteCode: z
    .string()
    .min(8, '초대 코드는 8자여야 합니다')
    .max(8, '초대 코드는 8자여야 합니다')
    .regex(/^[A-Z0-9]+$/, '유효하지 않은 초대 코드입니다'),
})

type InviteCodeInput = z.infer<typeof inviteCodeSchema>

function GoogleLoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const inviteCodeInputRef = useRef<HTMLInputElement>(null)

  // URL 쿼리 파라미터에서 에러 메시지 읽기
  useEffect(() => {
    const errorParam = searchParams.get('error')
    if (errorParam) {
      setError(decodeURIComponent(errorParam))
    }
  }, [searchParams])

  useEffect(() => {
    inviteCodeInputRef.current?.focus()
  }, [])

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<InviteCodeInput>({
    resolver: zodResolver(inviteCodeSchema),
  })

  const onSubmit = async (data: InviteCodeInput) => {
    setLoading(true)
    setError(null)

    try {
      const supabase = createClient()
      const origin = window.location.origin

      const { error: oauthError } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${origin}/auth/callback?invite_code=${data.inviteCode.toUpperCase()}`,
        },
      })

      if (oauthError) {
        setError(oauthError.message)
        setLoading(false)
      }
      // OAuth로 리다이렉트되면 로딩 상태 유지
    } catch (err) {
      setError('로그인 중 오류가 발생했습니다.')
      setLoading(false)
    }
  }

  return (
    <Card className="border-2 shadow-xl backdrop-blur-sm bg-background/95">
      <CardHeader className="space-y-1 pb-4">
        <CardTitle className="text-2xl font-bold tracking-tight">Google 로그인</CardTitle>
        <CardDescription className="text-sm">
          초대 코드를 입력하고 Google 계정으로 로그인하세요
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit(onSubmit)}>
        <CardContent className="space-y-4">
          {error && (
            <div className="flex items-center gap-2 p-3 text-sm text-destructive bg-destructive/10 rounded-lg border border-destructive/20 animate-in fade-in slide-in-from-top-1 duration-300">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="inviteCode" className="text-xs font-semibold text-foreground/90">
              초대 코드
            </Label>
            <div className="relative">
              <Ticket className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
              <Input
                id="inviteCode"
                type="text"
                placeholder="ABC12XYZ"
                maxLength={8}
                {...register('inviteCode', {
                  onChange: (e) => {
                    e.target.value = e.target.value.toUpperCase()
                  },
                })}
                ref={(e) => {
                  register('inviteCode').ref(e)
                  inviteCodeInputRef.current = e
                }}
                disabled={loading}
                className="h-10 pl-9 text-sm bg-muted/50 border-2 focus-visible:bg-background transition-colors uppercase"
                autoComplete="off"
              />
            </div>
            {errors.inviteCode && (
              <p className="text-xs text-destructive flex items-center gap-1 animate-in fade-in slide-in-from-top-1 duration-200">
                <AlertCircle className="h-3 w-3" />
                {errors.inviteCode.message}
              </p>
            )}
          </div>
        </CardContent>
        <CardFooter className="flex flex-col space-y-3 pt-2">
          <Button
            type="submit"
            className="w-full h-10 text-sm font-semibold bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-700 hover:to-violet-700 shadow-lg shadow-blue-500/20 transition-all duration-200"
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Google 로그인 중...
              </>
            ) : (
              'Google로 계속하기'
            )}
          </Button>
          <p className="text-xs text-muted-foreground text-center pt-1">
            이메일로 로그인하시겠어요?{' '}
            <Link href="/login" className="text-primary hover:text-primary/80 underline-offset-4 hover:underline font-semibold transition-colors">
              이메일 로그인
            </Link>
          </p>
        </CardFooter>
      </form>
    </Card>
  )
}

export default function GoogleLoginPage() {
  return (
    <Suspense fallback={
      <Card className="border-2 shadow-xl backdrop-blur-sm bg-background/95">
        <CardContent className="flex items-center justify-center p-8">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </CardContent>
      </Card>
    }>
      <GoogleLoginForm />
    </Suspense>
  )
}
