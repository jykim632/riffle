'use client'

import { Suspense, useState, useRef, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { resetRequestSchema, type ResetRequestInput } from '@/lib/schemas'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { requestPasswordReset } from '@/actions/password'
import { Loader2, AlertCircle, Mail, CheckCircle2, ArrowLeft } from 'lucide-react'

function ResetPasswordForm() {
  const searchParams = useSearchParams()
  const urlError = searchParams.get('error')

  const [error, setError] = useState<string | null>(urlError)
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const emailInputRef = useRef<HTMLInputElement>(null)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetRequestInput>({
    resolver: zodResolver(resetRequestSchema),
  })

  useEffect(() => {
    emailInputRef.current?.focus()
  }, [])

  const onSubmit = async (data: ResetRequestInput) => {
    setLoading(true)
    setError(null)

    const formData = new FormData()
    formData.append('email', data.email)
    formData.append('origin', window.location.origin)

    const result = await requestPasswordReset(formData)

    if (result?.error) {
      setError(result.error)
      setLoading(false)
    } else {
      setSent(true)
      setLoading(false)
    }
  }

  if (sent) {
    return (
      <Card className="border-2 shadow-xl backdrop-blur-sm bg-background/95">
        <CardHeader className="space-y-1 pb-4">
          <CardTitle className="text-2xl font-bold tracking-tight">이메일을 확인해주세요</CardTitle>
          <CardDescription className="text-sm">
            비밀번호 초기화 링크를 이메일로 전송했습니다
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-2 p-3 text-sm text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-950/30 rounded-lg border border-green-200 dark:border-green-900">
            <CheckCircle2 className="h-4 w-4 flex-shrink-0" />
            <span>입력하신 이메일로 비밀번호 초기화 링크를 보냈습니다. 이메일을 확인해주세요.</span>
          </div>
        </CardContent>
        <CardFooter className="pt-2">
          <Link
            href="/login"
            className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            로그인으로 돌아가기
          </Link>
        </CardFooter>
      </Card>
    )
  }

  return (
    <Card className="border-2 shadow-xl backdrop-blur-sm bg-background/95">
      <CardHeader className="space-y-1 pb-4">
        <CardTitle className="text-2xl font-bold tracking-tight">비밀번호 초기화</CardTitle>
        <CardDescription className="text-sm">
          가입한 이메일을 입력하면 비밀번호 초기화 링크를 보내드립니다
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
            <Label htmlFor="email" className="text-xs font-semibold text-foreground/90">
              이메일
            </Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
              <Input
                id="email"
                type="email"
                placeholder="your@email.com"
                {...register('email')}
                ref={(e) => {
                  register('email').ref(e)
                  emailInputRef.current = e
                }}
                disabled={loading}
                autoComplete="email"
                className="h-10 pl-9 text-sm bg-muted/50 border-2 focus-visible:bg-background transition-colors"
              />
            </div>
            {errors.email && (
              <p className="text-xs text-destructive flex items-center gap-1 animate-in fade-in slide-in-from-top-1 duration-200">
                <AlertCircle className="h-3 w-3" />
                {errors.email.message}
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
                전송 중...
              </>
            ) : (
              '초기화 링크 보내기'
            )}
          </Button>

          <Link
            href="/login"
            className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            로그인으로 돌아가기
          </Link>
        </CardFooter>
      </form>
    </Card>
  )
}

export default function ResetPasswordPage() {
  return (
    <Suspense>
      <ResetPasswordForm />
    </Suspense>
  )
}
