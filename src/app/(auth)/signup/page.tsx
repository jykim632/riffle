'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { signupSchema, type SignupInput } from '@/lib/schemas'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { PasswordInput } from '@/components/ui/password-input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { signup } from '@/actions/auth'
import { Loader2, AlertCircle, Mail, Lock, User, Ticket } from 'lucide-react'

export default function SignupPage() {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const inviteCodeInputRef = useRef<HTMLInputElement>(null)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignupInput>({
    resolver: zodResolver(signupSchema),
  })

  useEffect(() => {
    inviteCodeInputRef.current?.focus()
  }, [])

  const onSubmit = async (data: SignupInput) => {
    setLoading(true)
    setError(null)

    const formData = new FormData()
    formData.append('email', data.email)
    formData.append('password', data.password)
    formData.append('nickname', data.nickname)
    formData.append('inviteCode', data.inviteCode)

    const result = await signup(formData)

    if (result?.error) {
      setError(result.error)
      setLoading(false)
    } else {
      router.push('/dashboard')
    }
  }

  return (
    <Card className="border-2 shadow-xl backdrop-blur-sm bg-background/95">
      <CardHeader className="space-y-1 pb-4">
        <CardTitle className="text-2xl font-bold tracking-tight">회원가입</CardTitle>
        <CardDescription className="text-sm">
          초대 코드를 입력하여 경제 스터디에 참여하세요
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
                placeholder="8자리 초대 코드"
                maxLength={8}
                {...register('inviteCode')}
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

          <div className="space-y-2">
            <Label htmlFor="nickname" className="text-xs font-semibold text-foreground/90">
              닉네임
            </Label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
              <Input
                id="nickname"
                type="text"
                placeholder="홍길동"
                maxLength={20}
                {...register('nickname')}
                disabled={loading}
                autoComplete="nickname"
                className="h-10 pl-9 text-sm bg-muted/50 border-2 focus-visible:bg-background transition-colors"
              />
            </div>
            {errors.nickname && (
              <p className="text-xs text-destructive flex items-center gap-1 animate-in fade-in slide-in-from-top-1 duration-200">
                <AlertCircle className="h-3 w-3" />
                {errors.nickname.message}
              </p>
            )}
          </div>

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

          <div className="space-y-2">
            <Label htmlFor="password" className="text-xs font-semibold text-foreground/90">
              비밀번호
            </Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none z-10" />
              <PasswordInput
                id="password"
                placeholder="6자 이상"
                {...register('password')}
                disabled={loading}
                autoComplete="new-password"
                className="h-10 pl-9 text-sm bg-muted/50 border-2 focus-visible:bg-background transition-colors"
              />
            </div>
            {errors.password && (
              <p className="text-xs text-destructive flex items-center gap-1 animate-in fade-in slide-in-from-top-1 duration-200">
                <AlertCircle className="h-3 w-3" />
                {errors.password.message}
              </p>
            )}
            <p className="text-xs text-muted-foreground pl-1">
              비밀번호는 최소 6자 이상이어야 합니다
            </p>
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
                가입 중...
              </>
            ) : (
              '회원가입'
            )}
          </Button>

          <div className="relative w-full">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-muted-foreground/20" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-3 text-muted-foreground font-medium">또는</span>
            </div>
          </div>

          <Button
            type="button"
            variant="outline"
            className="w-full h-10 text-sm font-medium border-2 hover:bg-muted/50 hover:border-muted-foreground/40 transition-all duration-200"
            onClick={() => router.push('/google')}
            disabled={loading}
          >
            <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
              <path
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                fill="#4285F4"
              />
              <path
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                fill="#34A853"
              />
              <path
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                fill="#FBBC05"
              />
              <path
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                fill="#EA4335"
              />
            </svg>
            Google로 가입
          </Button>

          <p className="text-xs text-muted-foreground text-center pt-1">
            이미 계정이 있으신가요?{' '}
            <Link href="/login" className="text-primary hover:text-primary/80 underline-offset-4 hover:underline font-semibold transition-colors">
              로그인
            </Link>
          </p>
        </CardFooter>
      </form>
    </Card>
  )
}
