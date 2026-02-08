'use client'

import { useRouter } from 'next/navigation'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { formatShortDateRange } from '@/lib/utils/date'

interface Week {
  id: string
  week_number: number
  title: string | null
  start_date: string
  end_date: string
  is_current: boolean
}

interface IndicatorWeekSelectProps {
  weeks: Week[]
  currentWeekId: string
}

export function IndicatorWeekSelect({ weeks, currentWeekId }: IndicatorWeekSelectProps) {
  const router = useRouter()

  return (
    <Select
      value={currentWeekId}
      onValueChange={(value) => {
        router.push(`/indicators?week=${value}`)
      }}
    >
      <SelectTrigger size="sm" className="w-[200px]">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {weeks.map((week) => (
          <SelectItem
            key={week.id}
            value={week.id}
            className={week.is_current ? 'text-primary font-semibold' : ''}
          >
            {week.week_number}주차 ({formatShortDateRange(week.start_date, week.end_date)})
            {week.is_current && ' — 이번 주'}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
