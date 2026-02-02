'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Pencil, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { deleteSummary } from '@/actions/summaries'

interface SummaryActionsProps {
  summaryId: string
  isAuthor: boolean
}

export function SummaryActions({ summaryId, isAuthor }: SummaryActionsProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  if (!isAuthor) return null

  const handleDelete = async () => {
    if (!confirm('정말로 이 요약본을 삭제하시겠습니까?')) {
      return
    }

    setLoading(true)

    const formData = new FormData()
    formData.append('summaryId', summaryId)

    const result = await deleteSummary(formData)

    if (result?.error) {
      alert(result.error)
      setLoading(false)
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
      <Button variant="destructive" size="icon" onClick={handleDelete} disabled={loading}>
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  )
}
