'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Pencil, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ConfirmDialog } from '@/components/confirm-dialog'
import { deleteSummary } from '@/actions/summaries'

interface SummaryActionsProps {
  summaryId: string
  isAuthor: boolean
}

export function SummaryActions({ summaryId, isAuthor }: SummaryActionsProps) {
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

      <ConfirmDialog
        trigger={
          <Button variant="destructive" size="icon" disabled={loading}>
            <Trash2 className="h-4 w-4" />
          </Button>
        }
        open={open}
        onOpenChange={setOpen}
        title="요약본 삭제"
        description="정말로 이 요약본을 삭제하시겠습니까? 삭제된 요약본은 복구할 수 없습니다."
        onConfirm={handleDelete}
        loading={loading}
        confirmText="삭제"
        variant="destructive"
      />
    </div>
  )
}
