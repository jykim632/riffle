'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { updateNicknameSchema, type UpdateNicknameInput } from '@/lib/schemas'
import { updateNickname } from '@/actions/profile'
import Link from 'next/link'
import { Loader2, AlertCircle, CheckCircle2, KeyRound } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'

interface ProfileFormProps {
  email: string
  nickname: string
  role: string
  createdAt: string
  hasPassword: boolean
}

export function ProfileForm({ email, nickname, role, createdAt, hasPassword }: ProfileFormProps) {
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
  } = useForm<UpdateNicknameInput>({
    resolver: zodResolver(updateNicknameSchema),
    defaultValues: { nickname },
  })

  const onSubmit = async (data: UpdateNicknameInput) => {
    setLoading(true)
    setError(null)
    setSuccess(false)

    const formData = new FormData()
    formData.append('nickname', data.nickname)

    const result = await updateNickname(formData)

    if (result?.error) {
      setError(result.error)
    } else {
      setSuccess(true)
    }
    setLoading(false)
  }

  const roleLabel = role === 'admin' ? '관리자' : '멤버'
  const formattedDate = new Date(createdAt).toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">내 정보</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          프로필 정보를 확인하고 수정할 수 있습니다
        </p>
      </div>

      {success && (
        <div className="mb-4 flex items-center gap-2 p-3 text-sm text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-950/30 rounded-lg border border-green-200 dark:border-green-900 animate-in fade-in slide-in-from-top-1 duration-300">
          <CheckCircle2 className="h-4 w-4 flex-shrink-0" />
          <span>닉네임이 변경되었습니다.</span>
        </div>
      )}

      {error && (
        <div className="mb-4 flex items-center gap-2 p-3 text-sm text-destructive bg-destructive/10 rounded-lg border border-destructive/20 animate-in fade-in slide-in-from-top-1 duration-300">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="space-y-6">
        {/* 기본 정보 섹션 */}
        <div className="grid gap-6 sm:grid-cols-2">
          {/* 이메일 */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">이메일</Label>
            <Input
              value={email}
              disabled
              className="h-10 text-sm bg-muted/50"
            />
          </div>

          {/* 닉네임 */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-2">
            <Label htmlFor="nickname" className="text-sm font-medium">
              닉네임
            </Label>
            <div className="flex gap-2">
              <Input
                id="nickname"
                {...register('nickname')}
                disabled={loading}
                className="h-10 text-sm"
              />
              <Button
                type="submit"
                size="sm"
                className="h-10 px-4 text-sm font-semibold"
                disabled={loading || !isDirty}
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : '저장'}
              </Button>
            </div>
            {errors.nickname && (
              <p className="text-xs text-destructive flex items-center gap-1 animate-in fade-in slide-in-from-top-1 duration-200">
                <AlertCircle className="h-3 w-3" />
                {errors.nickname.message}
              </p>
            )}
          </form>

          {/* 역할 */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">역할</Label>
            <div>
              <Badge variant={role === 'admin' ? 'default' : 'secondary'}>
                {roleLabel}
              </Badge>
            </div>
          </div>

          {/* 가입일 */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">가입일</Label>
            <p className="text-sm text-muted-foreground">{formattedDate}</p>
          </div>
        </div>

        {/* 비밀번호 변경 링크 */}
        {hasPassword && (
          <div className="border-t pt-6">
            <Button variant="outline" asChild className="h-10 text-sm">
              <Link href="/settings/password">
                <KeyRound className="mr-2 h-4 w-4" />
                비밀번호 변경
              </Link>
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
