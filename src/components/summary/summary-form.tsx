'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  createSummarySchema,
  updateSummarySchema,
  type CreateSummaryInput,
  type UpdateSummaryInput,
} from '@/lib/schemas/summary'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { SummaryContent } from './summary-content'
import { createSummary, updateSummary } from '@/actions/summaries'

interface SummaryFormProps {
  mode: 'create' | 'edit'
  weekId?: string
  summaryId?: string
  initialContent?: string
  weekTitle?: string
}

export function SummaryForm({ mode, weekId, summaryId, initialContent = '', weekTitle }: SummaryFormProps) {
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [content, setContent] = useState(initialContent)

  const schema = mode === 'create' ? createSummarySchema : updateSummarySchema

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CreateSummaryInput | UpdateSummaryInput>({
    resolver: zodResolver(schema),
    defaultValues:
      mode === 'create'
        ? { weekId, content: initialContent }
        : { summaryId, content: initialContent },
  })

  const onSubmit = async (data: CreateSummaryInput | UpdateSummaryInput) => {
    setLoading(true)
    setError(null)

    const formData = new FormData()

    if (mode === 'create') {
      formData.append('weekId', (data as CreateSummaryInput).weekId)
    } else {
      formData.append('summaryId', (data as UpdateSummaryInput).summaryId)
    }

    formData.append('content', data.content)

    const action = mode === 'create' ? createSummary : updateSummary
    const result = await action(formData)

    if (result?.error) {
      setError(result.error)
      setLoading(false)
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {/* 입력 폼 */}
      <Card>
        <CardHeader>
          <CardTitle>{mode === 'create' ? '요약본 작성' : '요약본 수정'}</CardTitle>
          {weekTitle && <CardDescription>{weekTitle}</CardDescription>}
        </CardHeader>
        <form onSubmit={handleSubmit(onSubmit)}>
          <CardContent className="space-y-4">
            {error && (
              <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-md">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="content">내용 (마크다운 지원)</Label>
              <Textarea
                id="content"
                rows={20}
                placeholder="# 제목&#10;&#10;**볼드**, *이탤릭*, [링크](https://example.com)&#10;&#10;- 리스트 항목&#10;- 리스트 항목"
                {...register('content')}
                disabled={loading}
                className="font-mono text-sm"
                onChange={(e) => setContent(e.target.value)}
              />
              {errors.content && (
                <p className="text-sm text-destructive">{errors.content.message}</p>
              )}
              <p className="text-xs text-muted-foreground">
                10자 이상, 10000자 이하로 작성해주세요
              </p>
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? '제출 중...' : mode === 'create' ? '제출하기' : '수정하기'}
            </Button>
          </CardContent>
        </form>
      </Card>

      {/* 실시간 프리뷰 */}
      <Card>
        <CardHeader>
          <CardTitle>미리보기</CardTitle>
          <CardDescription>작성 중인 내용이 어떻게 보일지 확인하세요</CardDescription>
        </CardHeader>
        <CardContent>
          {content.trim() ? (
            <SummaryContent content={content} />
          ) : (
            <p className="text-sm text-muted-foreground">
              내용을 입력하면 미리보기가 여기에 표시됩니다
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
