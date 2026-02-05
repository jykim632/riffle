'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Plus, Loader2 } from 'lucide-react'
import { createInviteCodeAction } from '@/lib/actions/admin/invite-codes'

export function CreateCodesButton() {
  const [loading, setLoading] = useState(false)

  const handleCreate = async (count: number) => {
    setLoading(true)
    try {
      const result = await createInviteCodeAction(count)
      if (!result.success) {
        alert(`생성 실패: ${result.error}`)
      }
    } catch {
      alert('생성 중 오류 발생')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex gap-2">
      <Button onClick={() => handleCreate(1)} disabled={loading}>
        {loading ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <Plus className="mr-2 h-4 w-4" />
        )}
        코드 생성
      </Button>
      <Button variant="outline" onClick={() => handleCreate(5)} disabled={loading}>
        5개 생성
      </Button>
    </div>
  )
}
