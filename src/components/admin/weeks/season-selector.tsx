'use client'

import { useRouter } from 'next/navigation'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface Season {
  id: string
  name: string
  is_active: boolean
}

interface SeasonSelectorProps {
  seasons: Season[]
  selectedSeasonId?: string
}

export function SeasonSelector({
  seasons,
  selectedSeasonId,
}: SeasonSelectorProps) {
  const router = useRouter()

  const handleSeasonChange = (seasonId: string) => {
    router.push(`/admin/weeks?season=${seasonId}`)
  }

  return (
    <Select value={selectedSeasonId} onValueChange={handleSeasonChange}>
      <SelectTrigger className="w-[240px]">
        <SelectValue placeholder="시즌 선택" />
      </SelectTrigger>
      <SelectContent>
        {seasons.map((season) => (
          <SelectItem key={season.id} value={season.id}>
            {season.name}
            {season.is_active && ' (활성)'}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
