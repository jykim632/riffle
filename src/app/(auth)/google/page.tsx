'use client'

import { useState, useEffect } from 'react'
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

const inviteCodeSchema = z.object({
  inviteCode: z
    .string()
    .min(8, '초대 코드는 8자여야 합니다')
    .max(8, '초대 코드는 8자여야 합니다')
    .regex(/^[A-Z0-9]+$/, '유효하지 않은 초대 코드입니다'),
})

type InviteCodeInput = z.infer<typeof inviteCodeSchema>

export default function GoogleLoginPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  // URL 쿼리 파라미터에서 에러 메시지 읽기
  useEffect(() => {
    const errorParam = searchParams.get('error')
    if (errorParam) {
      setError(decodeURIComponent(errorParam))
    }
  }, [searchParams])

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
    <Card>
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-bold">Google 로그인</CardTitle>
        <CardDescription>
          초대 코드를 입력하고 Google 계정으로 로그인하세요
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit(onSubmit)}>
        <CardContent className="space-y-4">
          {error && (
            <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-md">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="inviteCode">초대 코드</Label>
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
              disabled={loading}
              className="uppercase"
            />
            {errors.inviteCode && (
              <p className="text-sm text-destructive">{errors.inviteCode.message}</p>
            )}
          </div>
        </CardContent>
        <CardFooter className="flex flex-col space-y-4">
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Google 로그인 중...' : 'Google로 계속하기'}
          </Button>
          <p className="text-sm text-muted-foreground text-center">
            이메일로 로그인하시겠어요?{' '}
            <Link href="/login" className="text-primary hover:underline">
              이메일 로그인
            </Link>
          </p>
        </CardFooter>
      </form>
    </Card>
  )
}
