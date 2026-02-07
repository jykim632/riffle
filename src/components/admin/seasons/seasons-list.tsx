'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Users } from 'lucide-react'
import { toggleSeasonActiveAction } from '@/lib/actions/admin/seasons'
import { Database } from '@/lib/types/database'
import { format } from 'date-fns'
import { ko } from 'date-fns/locale'
import { ManageMembersDialog } from './manage-members-dialog'

type Season = Database['public']['Tables']['seasons']['Row'] & {
  memberCount: number
}

interface SeasonsListProps {
  seasons: Season[]
}

export function SeasonsList({ seasons }: SeasonsListProps) {
  const [loading, setLoading] = useState<string | null>(null)

  const handleToggleActive = async (seasonId: string, currentState: boolean) => {
    setLoading(seasonId)
    try {
      const result = await toggleSeasonActiveAction(seasonId, !currentState)
      if (!result.success) {
        alert(`활성화 변경 실패: ${result.error}`)
      }
    } catch {
      alert('활성화 변경 중 오류 발생')
    } finally {
      setLoading(null)
    }
  }

  if (!seasons || seasons.length === 0) {
    return (
      <div className="rounded-lg border border-dashed p-8 text-center">
        <p className="text-muted-foreground">등록된 시즌이 없습니다.</p>
      </div>
    )
  }

  return (
    <div className="rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>시즌명</TableHead>
            <TableHead>기간</TableHead>
            <TableHead className="text-center">멤버 수</TableHead>
            <TableHead className="text-center">활성 상태</TableHead>
            <TableHead className="text-right">관리</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {seasons.map((season) => {
            const startDate = format(new Date(season.start_date), 'yyyy.MM.dd', {
              locale: ko,
            })
            const endDate = format(new Date(season.end_date), 'yyyy.MM.dd', {
              locale: ko,
            })

            return (
              <TableRow key={season.id}>
                <TableCell className="font-medium">{season.name}</TableCell>
                <TableCell className="text-muted-foreground">
                  {startDate} ~ {endDate}
                </TableCell>
                <TableCell className="text-center">{season.memberCount}명</TableCell>
                <TableCell className="text-center">
                  <div className="flex items-center justify-center gap-2">
                    <Switch
                      checked={season.is_active}
                      onCheckedChange={() =>
                        handleToggleActive(season.id, season.is_active)
                      }
                      disabled={loading === season.id}
                    />
                    {season.is_active && (
                      <span className="text-xs font-medium text-green-600">활성</span>
                    )}
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  <ManageMembersDialog
                    seasonId={season.id}
                    seasonName={season.name}
                  >
                    <Button variant="outline" size="sm">
                      <Users className="mr-1 h-4 w-4" />
                      멤버 관리
                    </Button>
                  </ManageMembersDialog>
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </div>
  )
}
