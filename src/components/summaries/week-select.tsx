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

interface WeekSelectProps {
  weeks: Week[]
  currentWeekId?: string
  filter?: string
}

function buildHref(params: { week?: string; filter?: string }) {
  const sp = new URLSearchParams()
  if (params.filter) sp.set('filter', params.filter)
  if (params.week) sp.set('week', params.week)
  const qs = sp.toString()
  return `/summaries${qs ? `?${qs}` : ''}`
}

export function WeekSelect({ weeks, currentWeekId, filter }: WeekSelectProps) {
  const router = useRouter()

  return (
    <Select
      value={currentWeekId ?? 'all'}
      onValueChange={(value) => {
        const week = value === 'all' ? undefined : value
        router.push(buildHref({ week, filter }))
      }}
    >
      <SelectTrigger size="sm" className="w-[180px]">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">전체 주차</SelectItem>
        {weeks.map((week) => (
          <SelectItem key={week.id} value={week.id} className={week.is_current ? 'text-primary font-semibold' : ''}>
            {week.week_number}주차 ({formatShortDateRange(week.start_date, week.end_date)})
            {week.is_current && ' — 이번 주'}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
