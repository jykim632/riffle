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
import { MarkdownEditor } from './markdown-editor'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { SummaryContent } from './summary-content'
import { createSummary, updateSummary } from '@/actions/summaries'
import { formatDateRange } from '@/lib/utils/date'

interface Week {
  id: string
  week_number: number
  title: string | null
  start_date: string
  end_date: string
  is_current: boolean
}

interface SummaryFormProps {
  mode: 'create' | 'edit'
  weeks: Week[]
  initialWeekId: string
  summaryId?: string
  initialContent?: string
}

export function SummaryForm({ mode, weeks, initialWeekId, summaryId, initialContent = '' }: SummaryFormProps) {
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [content, setContent] = useState(initialContent)
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)
  const [pendingData, setPendingData] = useState<CreateSummaryInput | UpdateSummaryInput | null>(null)

  const schema = mode === 'create' ? createSummarySchema : updateSummarySchema

  const {
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<CreateSummaryInput | UpdateSummaryInput>({
    resolver: zodResolver(schema),
    defaultValues:
      mode === 'create'
        ? { weekId: initialWeekId, content: initialContent }
        : { summaryId, weekId: initialWeekId, content: initialContent },
  })

  const selectedWeekId = watch('weekId')

  const executeSubmit = async (data: CreateSummaryInput | UpdateSummaryInput) => {
    setLoading(true)
    setError(null)

    const formData = new FormData()

    if (mode === 'create') {
      formData.append('weekId', (data as CreateSummaryInput).weekId)
    } else {
      formData.append('summaryId', (data as UpdateSummaryInput).summaryId)
      formData.append('weekId', (data as UpdateSummaryInput).weekId)
    }

    formData.append('content', data.content)

    const action = mode === 'create' ? createSummary : updateSummary
    const result = await action(formData)

    if (result?.error) {
      setError(result.error)
      setLoading(false)
    }
  }

  const onSubmit = async (data: CreateSummaryInput | UpdateSummaryInput) => {
    if (mode === 'edit') {
      setPendingData(data)
      setShowConfirmDialog(true)
    } else {
      await executeSubmit(data)
    }
  }

  const handleConfirm = async () => {
    if (pendingData) {
      setShowConfirmDialog(false)
      await executeSubmit(pendingData)
      setPendingData(null)
    }
  }

  const getWeekLabel = (week: Week) => {
    const dateRange = formatDateRange(week.start_date, week.end_date)
    const currentLabel = week.is_current ? ' ← 현재' : ''
    return `${week.week_number}주차 (${dateRange})${currentLabel}`
  }

  const getWeekTitle = (weekId: string) => {
    const week = weeks.find(w => w.id === weekId)
    if (!week) return ''
    return `${week.week_number}주차`
  }

  const isWeekChanged = mode === 'edit' && selectedWeekId !== initialWeekId

  return (
    <>
      <div className="grid gap-6 lg:grid-cols-2">
        {/* 입력 폼 */}
        <Card>
          <CardHeader>
            <CardTitle>{mode === 'create' ? '요약본 작성' : '요약본 수정'}</CardTitle>
            <CardDescription>
              {mode === 'create' ? '경제 라디오 요약본을 작성해주세요' : '요약본을 수정하세요'}
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit(onSubmit)}>
            <CardContent className="space-y-4">
              {error && (
                <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-md">
                  {error}
                </div>
              )}

              {/* 주차 선택 */}
              <div className="space-y-2">
                <Label htmlFor="weekId">제출 주차</Label>
                <Select
                  value={selectedWeekId}
                  onValueChange={(value) => setValue('weekId', value)}
                >
                  <SelectTrigger id="weekId">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {weeks.map((week) => (
                      <SelectItem key={week.id} value={week.id}>
                        {getWeekLabel(week)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.weekId && (
                  <p className="text-sm text-destructive">{errors.weekId.message}</p>
                )}
              </div>

              {/* 내용 입력 */}
              <div className="space-y-2">
                <Label>내용 (마크다운 지원)</Label>
                <MarkdownEditor
                  value={content}
                  onChange={(val) => {
                    setContent(val)
                    setValue('content', val, { shouldValidate: true })
                  }}
                  disabled={loading}
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

      {/* 수정 확인 모달 */}
      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>요약본 수정</AlertDialogTitle>
            <AlertDialogDescription>
              {isWeekChanged ? (
                <>
                  주차를 변경하고 요약본을 수정하시겠습니까?
                  <br />
                  <span className="font-medium">
                    {getWeekTitle(initialWeekId)} → {getWeekTitle(selectedWeekId)}
                  </span>
                </>
              ) : (
                '요약본을 수정하시겠습니까? 수정된 내용은 새로운 버전으로 저장됩니다.'
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={loading}>취소</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirm} disabled={loading}>
              {loading ? '수정 중...' : '수정'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
