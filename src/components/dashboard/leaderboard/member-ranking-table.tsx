'use client'

import { useState } from 'react'
import { Trophy, Flame, ArrowUpDown } from 'lucide-react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Progress } from '@/components/ui/progress'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { MemberStats } from '@/lib/queries/stats'

interface MemberRankingTableProps {
  members: MemberStats[]
  totalWeeks: number
}

type SortKey = 'rank' | 'submissionRate' | 'currentStreak' | 'longestStreak'

function getRankDisplay(rank: number) {
  if (rank === 1) return { emoji: '🥇', className: 'text-amber-600 font-bold' }
  if (rank === 2) return { emoji: '🥈', className: 'text-gray-500 font-bold' }
  if (rank === 3) return { emoji: '🥉', className: 'text-orange-700 font-bold' }
  return { emoji: '', className: 'text-muted-foreground' }
}

export function MemberRankingTable({ members, totalWeeks }: MemberRankingTableProps) {
  const [sortKey, setSortKey] = useState<SortKey>('rank')
  const [sortAsc, setSortAsc] = useState(true)

  const sorted = [...members].sort((a, b) => {
    const dir = sortAsc ? 1 : -1
    if (sortKey === 'rank') return (a.rank - b.rank) * dir
    if (sortKey === 'submissionRate')
      return (a.submissionRate - b.submissionRate) * dir
    if (sortKey === 'currentStreak')
      return (a.currentStreak - b.currentStreak) * dir
    return (a.longestStreak - b.longestStreak) * dir
  })

  function handleSort(key: SortKey) {
    if (sortKey === key) {
      setSortAsc(!sortAsc)
    } else {
      setSortKey(key)
      // rank는 오름차순 기본, 나머지는 내림차순 기본
      setSortAsc(key === 'rank')
    }
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Trophy className="h-5 w-5 text-amber-500" />
          멤버 랭킹
        </CardTitle>
      </CardHeader>
      <CardContent className="px-0 sm:px-6">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-16 text-center">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-auto gap-1 p-0 text-xs font-medium"
                  onClick={() => handleSort('rank')}
                >
                  순위
                  <ArrowUpDown className="h-3 w-3" />
                </Button>
              </TableHead>
              <TableHead>멤버</TableHead>
              <TableHead className="hidden sm:table-cell">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-auto gap-1 p-0 text-xs font-medium"
                  onClick={() => handleSort('submissionRate')}
                >
                  제출률
                  <ArrowUpDown className="h-3 w-3" />
                </Button>
              </TableHead>
              <TableHead>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-auto gap-1 p-0 text-xs font-medium"
                  onClick={() => handleSort('submissionRate')}
                >
                  제출
                  <ArrowUpDown className="h-3 w-3" />
                </Button>
              </TableHead>
              <TableHead className="text-center">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-auto gap-1 p-0 text-xs font-medium"
                  onClick={() => handleSort('currentStreak')}
                >
                  <Flame className="h-3 w-3 text-orange-500" />
                  연속
                  <ArrowUpDown className="h-3 w-3" />
                </Button>
              </TableHead>
              <TableHead className="hidden text-center sm:table-cell">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-auto gap-1 p-0 text-xs font-medium"
                  onClick={() => handleSort('longestStreak')}
                >
                  최장
                  <ArrowUpDown className="h-3 w-3" />
                </Button>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sorted.map((member) => {
              const { emoji, className } = getRankDisplay(member.rank)
              const ratePercent = Math.round(member.submissionRate * 100)

              return (
                <TableRow key={member.userId}>
                  <TableCell className={`text-center ${className}`}>
                    {emoji || member.rank}
                  </TableCell>
                  <TableCell className="font-medium">
                    {member.nickname}
                  </TableCell>
                  <TableCell className="hidden sm:table-cell">
                    <div className="flex items-center gap-2">
                      <Progress value={ratePercent} className="h-2 w-20" />
                      <span className="text-xs text-muted-foreground">
                        {ratePercent}%
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm">
                      {member.totalSubmissions}
                      <span className="text-muted-foreground">/{totalWeeks}</span>
                    </span>
                  </TableCell>
                  <TableCell className="text-center">
                    <span className="text-sm font-medium">
                      {member.currentStreak > 0 ? `${member.currentStreak}주` : '-'}
                    </span>
                  </TableCell>
                  <TableCell className="hidden text-center sm:table-cell">
                    <span className="text-sm text-muted-foreground">
                      {member.longestStreak > 0 ? `${member.longestStreak}주` : '-'}
                    </span>
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
