'use client'

import { useState } from 'react'
import { RefreshCw, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { refreshIndicatorsAction, deleteTodayIndicatorsAction } from '@/lib/actions/admin/indicators'

interface ActionResult {
  success: boolean
  error?: string
  count?: number
}

export function RefreshIndicatorsButton() {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<ActionResult | null>(null)

  async function handleRefresh() {
    setLoading(true)
    setResult(null)
    try {
      const res = await refreshIndicatorsAction()
      setResult(res as ActionResult)
    } catch {
      setResult({ success: false, error: '요청 중 오류가 발생했습니다.' })
    } finally {
      setLoading(false)
    }
  }

  async function handleDelete() {
    if (!confirm('오늘 수집한 데이터를 삭제하시겠습니까?')) return
    setLoading(true)
    setResult(null)
    try {
      const res = await deleteTodayIndicatorsAction()
      setResult(res as ActionResult)
    } catch {
      setResult({ success: false, error: '요청 중 오류가 발생했습니다.' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <Button onClick={handleRefresh} disabled={loading}>
          <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          {loading ? '처리 중...' : '경제지표 수집'}
        </Button>
        <Button variant="outline" onClick={handleDelete} disabled={loading}>
          <Trash2 className="mr-2 h-4 w-4" />
          오늘 데이터 삭제
        </Button>
      </div>
      {result && (
        <p className={`text-sm ${result.success ? 'text-green-600' : 'text-destructive'}`}>
          {result.success
            ? `${result.count}건 처리 완료`
            : result.error}
        </p>
      )}
    </div>
  )
}
