'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { addMonths, format } from 'date-fns'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { DatePicker } from '@/components/ui/date-picker'
import { createSeasonAction } from '@/lib/actions/admin/seasons'

const seasonSchema = z.object({
  name: z.string().min(1, '시즌명을 입력하세요'),
  start_date: z.date({ message: '시작일을 선택하세요' }),
  end_date: z.date({ message: '종료일을 선택하세요' }),
})

type SeasonFormData = z.infer<typeof seasonSchema>

interface CreateSeasonDialogProps {
  children: React.ReactNode
}

export function CreateSeasonDialog({ children }: CreateSeasonDialogProps) {
  const [open, setOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
    reset,
  } = useForm<SeasonFormData>({
    resolver: zodResolver(seasonSchema),
    defaultValues: {
      name: '',
    },
  })

  const startDate = watch('start_date')
  const endDate = watch('end_date')

  // 시작일 변경 시 종료일 자동 설정 (+3개월)
  const handleStartDateChange = (date: Date | undefined) => {
    if (date) {
      setValue('start_date', date)
      if (!endDate) {
        setValue('end_date', addMonths(date, 3))
      }
    }
  }

  const onSubmit = async (data: SeasonFormData) => {
    setIsSubmitting(true)
    try {
      const result = await createSeasonAction({
        name: data.name,
        start_date: format(data.start_date, 'yyyy-MM-dd'),
        end_date: format(data.end_date, 'yyyy-MM-dd'),
      })

      if (result.success) {
        setOpen(false)
        reset()
      } else {
        alert(`시즌 생성 실패: ${result.error}`)
      }
    } catch (error) {
      alert('시즌 생성 중 오류 발생')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleSubmit(onSubmit)}>
          <DialogHeader>
            <DialogTitle>새 시즌 생성</DialogTitle>
            <DialogDescription>
              시즌 정보를 입력하세요. 시즌 생성 시 주차가 자동으로 생성됩니다.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">시즌명</Label>
              <Input
                id="name"
                placeholder="예: 2024년 1분기"
                {...register('name')}
              />
              {errors.name && (
                <p className="text-sm text-destructive">{errors.name.message}</p>
              )}
            </div>

            <div className="grid gap-2">
              <Label>시작일</Label>
              <DatePicker
                date={startDate}
                onSelect={handleStartDateChange}
                placeholder="시작일 선택"
              />
              {errors.start_date && (
                <p className="text-sm text-destructive">
                  {errors.start_date.message}
                </p>
              )}
            </div>

            <div className="grid gap-2">
              <Label>종료일</Label>
              <DatePicker
                date={endDate}
                onSelect={(date) => date && setValue('end_date', date)}
                placeholder="종료일 선택"
              />
              {errors.end_date && (
                <p className="text-sm text-destructive">
                  {errors.end_date.message}
                </p>
              )}
              {startDate && endDate && (
                <p className="text-xs text-muted-foreground">
                  총{' '}
                  {Math.ceil(
                    (endDate.getTime() - startDate.getTime()) /
                      (1000 * 60 * 60 * 24 * 7)
                  )}
                  주 (약{' '}
                  {Math.floor(
                    (endDate.getTime() - startDate.getTime()) /
                      (1000 * 60 * 60 * 24 * 30)
                  )}
                  개월)
                </p>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isSubmitting}
            >
              취소
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? '생성 중...' : '생성'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
