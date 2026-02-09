'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { updatePasswordSchema, type UpdatePasswordInput } from '@/lib/schemas'
import { Button } from '@/components/ui/button'
import { PasswordInput } from '@/components/ui/password-input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { updatePassword } from '@/actions/password'
import { Loader2, AlertCircle, Lock } from 'lucide-react'

export function UpdatePasswordForm() {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const passwordInputRef = useRef<HTMLInputElement>(null)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<UpdatePasswordInput>({
    resolver: zodResolver(updatePasswordSchema),
  })

  useEffect(() => {
    passwordInputRef.current?.focus()
  }, [])

  const onSubmit = async (data: UpdatePasswordInput) => {
    setLoading(true)
    setError(null)

    const formData = new FormData()
    formData.append('password', data.password)
    formData.append('confirmPassword', data.confirmPassword)

    const result = await updatePassword(formData)

    if (result?.error) {
      setError(result.error)
      setLoading(false)
    } else {
      router.push('/login?message=' + encodeURIComponent('비밀번호가 변경되었습니다. 새 비밀번호로 로그인해주세요.'))
    }
  }

  return (
    <Card className="border-2 shadow-xl backdrop-blur-sm bg-background/95">
      <CardHeader className="space-y-1 pb-4">
        <CardTitle className="text-2xl font-bold tracking-tight">새 비밀번호 설정</CardTitle>
        <CardDescription className="text-sm">
          새로운 비밀번호를 입력해주세요
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
            <Label htmlFor="password" className="text-xs font-semibold text-foreground/90">
              새 비밀번호
            </Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none z-10" />
              <PasswordInput
                id="password"
                placeholder="••••••••"
                {...register('password')}
                ref={(e) => {
                  register('password').ref(e)
                  passwordInputRef.current = e
                }}
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
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword" className="text-xs font-semibold text-foreground/90">
              비밀번호 확인
            </Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none z-10" />
              <PasswordInput
                id="confirmPassword"
                placeholder="••••••••"
                {...register('confirmPassword')}
                disabled={loading}
                autoComplete="new-password"
                className="h-10 pl-9 text-sm bg-muted/50 border-2 focus-visible:bg-background transition-colors"
              />
            </div>
            {errors.confirmPassword && (
              <p className="text-xs text-destructive flex items-center gap-1 animate-in fade-in slide-in-from-top-1 duration-200">
                <AlertCircle className="h-3 w-3" />
                {errors.confirmPassword.message}
              </p>
            )}
          </div>
        </CardContent>
        <CardFooter className="pt-2">
          <Button
            type="submit"
            className="w-full h-10 text-sm font-semibold bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-700 hover:to-violet-700 shadow-lg shadow-blue-500/20 transition-all duration-200"
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                변경 중...
              </>
            ) : (
              '비밀번호 변경'
            )}
          </Button>
        </CardFooter>
      </form>
    </Card>
  )
}
