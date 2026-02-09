'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Plus, Loader2 } from 'lucide-react'
import { createInviteCodeAction } from '@/lib/actions/admin/invite-codes'
import { toast } from 'sonner'

interface Season {
  id: string
  name: string
  isActive: boolean
}

interface CreateCodesButtonProps {
  seasons: Season[]
  activeSeasonId: string | null
}

const NO_SEASON = '__none__'

export function CreateCodesButton({ seasons, activeSeasonId }: CreateCodesButtonProps) {
  const [loading, setLoading] = useState(false)
  const [selectedSeason, setSelectedSeason] = useState<string>(
    activeSeasonId ?? NO_SEASON
  )

  const handleCreate = async (count: number) => {
    setLoading(true)
    try {
      const seasonId = selectedSeason === NO_SEASON ? null : selectedSeason
      const result = await createInviteCodeAction(count, seasonId)
      if (!result.success) {
        toast.error(`생성 실패: ${result.error}`)
      }
    } catch {
      toast.error('생성 중 오류 발생')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
      <Select value={selectedSeason} onValueChange={setSelectedSeason}>
        <SelectTrigger className="w-full sm:w-48">
          <SelectValue placeholder="시즌 선택" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={NO_SEASON}>시즌 없음</SelectItem>
          {seasons.map((season) => (
            <SelectItem key={season.id} value={season.id}>
              {season.name}
              {season.isActive ? ' (활성)' : ''}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
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
    </div>
  )
}
