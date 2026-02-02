'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Pencil, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { deleteSummary } from '@/actions/summaries'

interface SummaryActionsProps {
  summaryId: string
  isAuthor: boolean
}

export function SummaryActions({ summaryId, isAuthor }: SummaryActionsProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)

  if (!isAuthor) return null

  const handleDelete = async () => {
    setLoading(true)

    const formData = new FormData()
    formData.append('summaryId', summaryId)

    const result = await deleteSummary(formData)

    if (result?.error) {
      alert(result.error)
      setLoading(false)
      setOpen(false)
    }
    // 성공 시 redirect가 자동으로 실행됨
  }

  return (
    <div className="flex gap-2">
      <Button asChild variant="outline" size="icon">
        <Link href={`/summaries/${summaryId}/edit`}>
          <Pencil className="h-4 w-4" />
        </Link>
      </Button>

      <AlertDialog open={open} onOpenChange={setOpen}>
        <AlertDialogTrigger asChild>
          <Button variant="destructive" size="icon" disabled={loading}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>요약본 삭제</AlertDialogTitle>
            <AlertDialogDescription>
              정말로 이 요약본을 삭제하시겠습니까? 삭제된 요약본은 복구할 수 없습니다.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={loading}>취소</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault()
                handleDelete()
              }}
              disabled={loading}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {loading ? '삭제 중...' : '삭제'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
