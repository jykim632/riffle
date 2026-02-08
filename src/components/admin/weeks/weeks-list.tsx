'use client'

import { useState } from 'react'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { toggleWeekCurrentAction } from '@/lib/actions/admin/weeks'
import { toast } from 'sonner'
import { Database } from '@/lib/types/database'
import { formatShortDateWithDay } from '@/lib/utils/date'

type Week = Database['public']['Tables']['weeks']['Row']

interface WeeksListProps {
  weeks: Week[]
}

export function WeeksList({ weeks }: WeeksListProps) {
  const [loading, setLoading] = useState<string | null>(null)

  const handleToggleCurrent = async (weekId: string, currentState: boolean) => {
    setLoading(weekId)
    try {
      const result = await toggleWeekCurrentAction(weekId, !currentState)
      if (!result.success) {
        toast.error(`현재 주차 변경 실패: ${result.error}`)
      }
    } catch {
      toast.error('현재 주차 변경 중 오류 발생')
    } finally {
      setLoading(null)
    }
  }

  if (!weeks || weeks.length === 0) {
    return (
      <div className="rounded-lg border border-dashed p-8 text-center">
        <p className="text-muted-foreground">등록된 주차가 없습니다.</p>
      </div>
    )
  }

  return (
    <div className="overflow-x-auto rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-20">주차</TableHead>
            <TableHead>제목</TableHead>
            <TableHead>기간</TableHead>
            <TableHead className="w-28 text-center">현재 주차</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {weeks.map((week) => {
            const startDate = formatShortDateWithDay(week.start_date)
            const endDate = formatShortDateWithDay(week.end_date)

            return (
              <TableRow key={week.id}>
                <TableCell>
                  <Badge variant={week.is_current ? 'default' : 'secondary'}>
                    {week.week_number}주차
                  </Badge>
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {week.title || '-'}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {startDate} ~ {endDate}
                </TableCell>
                <TableCell className="text-center">
                  <div className="flex items-center justify-center gap-2">
                    <Switch
                      checked={week.is_current}
                      onCheckedChange={() =>
                        handleToggleCurrent(week.id, week.is_current)
                      }
                      disabled={loading === week.id}
                    />
                    {week.is_current && (
                      <span className="text-xs font-medium text-green-600">활성</span>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </div>
  )
}
