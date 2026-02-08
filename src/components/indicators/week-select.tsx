'use client'

import { useRouter } from 'next/navigation'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

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

function formatDateRange(startDate: string, endDate: string) {
  const start = new Date(startDate + 'T00:00:00')
  const end = new Date(endDate + 'T00:00:00')
  const fmt = (d: Date) => `${d.getMonth() + 1}/${d.getDate()}`
  return `${fmt(start)} ~ ${fmt(end)}`
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
            {week.week_number}주차 ({formatDateRange(week.start_date, week.end_date)})
            {week.is_current && ' — 이번 주'}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
