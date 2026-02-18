'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Loader2, Trash2, Archive, Plus } from 'lucide-react'
import { toast } from 'sonner'
import {
  resetSeasonDataAction,
  deleteSeasonAction,
  archiveAndCreateSeasonAction,
} from '@/lib/actions/admin/backup'

interface Season {
  id: string
  name: string
  is_active: boolean
}

interface SeasonResetControlsProps {
  seasons: Season[]
}

type ActionType = 'resetData' | 'delete' | 'archive'

export function SeasonResetControls({ seasons }: SeasonResetControlsProps) {
  const [selectedSeasonId, setSelectedSeasonId] = useState<string>('')
  const [activeAction, setActiveAction] = useState<ActionType | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  // 아카이브용 폼 상태
  const [newSeasonName, setNewSeasonName] = useState('')
  const [newStartDate, setNewStartDate] = useState('')
  const [newEndDate, setNewEndDate] = useState('')
  const [copyMembers, setCopyMembers] = useState(true)

  const selectedSeason = seasons.find((s) => s.id === selectedSeasonId)

  const handleResetData = async () => {
    if (!selectedSeasonId) return
    setIsLoading(true)
    setActiveAction(null)

    try {
      const result = await resetSeasonDataAction(selectedSeasonId)
      if (result.success && 'deletedCounts' in result) {
        const counts = result.deletedCounts as Record<string, number>
        const total = Object.values(counts).reduce((sum, c) => sum + c, 0)
        toast.success(`${result.seasonName} 데이터 ${total}건 삭제 완료`)
      } else if ('error' in result) {
        toast.error(result.error)
      }
    } catch {
      toast.error('시즌 데이터 삭제 중 오류 발생')
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!selectedSeasonId) return
    setIsLoading(true)
    setActiveAction(null)

    try {
      const result = await deleteSeasonAction(selectedSeasonId)
      if (result.success && 'seasonName' in result) {
        toast.success(`${result.seasonName} 시즌이 삭제되었습니다.`)
        setSelectedSeasonId('')
      } else if ('error' in result) {
        toast.error(result.error)
      }
    } catch {
      toast.error('시즌 삭제 중 오류 발생')
    } finally {
      setIsLoading(false)
    }
  }

  const handleArchive = async () => {
    if (!selectedSeasonId || !newSeasonName || !newStartDate || !newEndDate) return
    setIsLoading(true)
    setActiveAction(null)

    try {
      const result = await archiveAndCreateSeasonAction({
        seasonId: selectedSeasonId,
        newName: newSeasonName,
        startDate: newStartDate,
        endDate: newEndDate,
        copyMembers,
      })

      if (result.success && 'newSeasonName' in result) {
        toast.success(
          `${result.oldSeasonName} 아카이브 완료. 새 시즌 "${result.newSeasonName}" 생성 (${result.weeksCreated}주, 멤버 ${result.copiedMembers}명 복사)`
        )
        setSelectedSeasonId('')
        setNewSeasonName('')
        setNewStartDate('')
        setNewEndDate('')
      } else if ('error' in result) {
        toast.error(result.error)
      }
    } catch {
      toast.error('시즌 아카이브 중 오류 발생')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      {/* 시즌 선택 (공통) */}
      <Card>
        <CardHeader>
          <CardTitle>시즌 관리</CardTitle>
          <CardDescription>
            시즌 데이터 정리, 시즌 삭제, 또는 새 시즌으로 전환합니다.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Label>관리할 시즌</Label>
            <Select
              value={selectedSeasonId}
              onValueChange={setSelectedSeasonId}
            >
              <SelectTrigger className="w-[300px]">
                <SelectValue placeholder="시즌을 선택하세요" />
              </SelectTrigger>
              <SelectContent>
                {seasons.map((season) => (
                  <SelectItem key={season.id} value={season.id}>
                    {season.name} {season.is_active ? '(활성)' : ''}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {selectedSeasonId && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {/* A. 시즌 데이터 삭제 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Trash2 className="h-4 w-4 text-destructive" />
                데이터 초기화
              </CardTitle>
              <CardDescription>
                시즌의 주차, 요약, 댓글, 지표, 링크를 삭제합니다. 시즌과 멤버는 유지됩니다.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                variant="destructive"
                onClick={() => setActiveAction('resetData')}
                disabled={isLoading}
                className="w-full"
              >
                {isLoading && activeAction === 'resetData' ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Trash2 className="mr-2 h-4 w-4" />
                )}
                데이터 초기화
              </Button>
            </CardContent>
          </Card>

          {/* B. 시즌 완전 삭제 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Trash2 className="h-4 w-4 text-destructive" />
                시즌 삭제
              </CardTitle>
              <CardDescription>
                시즌과 모든 소속 데이터를 완전히 삭제합니다. 프로필은 유지됩니다.
                {selectedSeason?.is_active && (
                  <span className="mt-1 block text-destructive">
                    활성 시즌은 삭제할 수 없습니다.
                  </span>
                )}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                variant="destructive"
                onClick={() => setActiveAction('delete')}
                disabled={isLoading || selectedSeason?.is_active}
                className="w-full"
              >
                {isLoading && activeAction === 'delete' ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Trash2 className="mr-2 h-4 w-4" />
                )}
                시즌 완전 삭제
              </Button>
            </CardContent>
          </Card>

          {/* C. 아카이브 + 새 시즌 */}
          <Card className="md:col-span-2 lg:col-span-1">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Archive className="h-4 w-4" />
                아카이브 + 새 시즌
              </CardTitle>
              <CardDescription>
                현재 시즌을 아카이브하고 새 시즌을 생성합니다.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2">
                <Label htmlFor="newSeasonName">새 시즌 이름</Label>
                <Input
                  id="newSeasonName"
                  placeholder="예: 2026년 1분기"
                  value={newSeasonName}
                  onChange={(e) => setNewSeasonName(e.target.value)}
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-2">
                  <Label htmlFor="startDate">시작일</Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={newStartDate}
                    onChange={(e) => setNewStartDate(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="endDate">종료일</Label>
                  <Input
                    id="endDate"
                    type="date"
                    value={newEndDate}
                    onChange={(e) => setNewEndDate(e.target.value)}
                  />
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="copyMembers"
                  checked={copyMembers}
                  onCheckedChange={(checked) => setCopyMembers(checked === true)}
                />
                <Label htmlFor="copyMembers" className="text-sm font-normal">
                  기존 멤버를 새 시즌에 복사
                </Label>
              </div>
              <Button
                onClick={() => setActiveAction('archive')}
                disabled={isLoading || !newSeasonName || !newStartDate || !newEndDate}
                className="w-full"
              >
                {isLoading && activeAction === 'archive' ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Plus className="mr-2 h-4 w-4" />
                )}
                아카이브 + 새 시즌 생성
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      {/* 확인 다이얼로그 - 데이터 초기화 */}
      <AlertDialog open={activeAction === 'resetData'} onOpenChange={(open) => !open && setActiveAction(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>시즌 데이터 초기화</AlertDialogTitle>
            <AlertDialogDescription>
              <strong>{selectedSeason?.name}</strong> 시즌의 모든 데이터(주차, 요약, 댓글, 경제지표, 공유 링크)가 삭제됩니다.
              시즌과 멤버 정보는 유지됩니다.
              <br /><br />
              이 작업은 되돌릴 수 없습니다. 계속하시겠습니까?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>취소</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleResetData}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              삭제 확인
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* 확인 다이얼로그 - 시즌 삭제 */}
      <AlertDialog open={activeAction === 'delete'} onOpenChange={(open) => !open && setActiveAction(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>시즌 완전 삭제</AlertDialogTitle>
            <AlertDialogDescription>
              <strong>{selectedSeason?.name}</strong> 시즌과 모든 소속 데이터가 완전히 삭제됩니다.
              이 작업은 되돌릴 수 없습니다.
              <br /><br />
              삭제 전 백업을 권장합니다. 계속하시겠습니까?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>취소</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              완전 삭제
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* 확인 다이얼로그 - 아카이브 */}
      <AlertDialog open={activeAction === 'archive'} onOpenChange={(open) => !open && setActiveAction(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>시즌 아카이브 + 새 시즌 생성</AlertDialogTitle>
            <AlertDialogDescription>
              <strong>{selectedSeason?.name}</strong> 시즌을 비활성화하고
              새 시즌 <strong>&quot;{newSeasonName}&quot;</strong>을 생성합니다.
              {copyMembers && ' 기존 멤버가 새 시즌에 복사됩니다.'}
              <br /><br />
              계속하시겠습니까?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>취소</AlertDialogCancel>
            <AlertDialogAction onClick={handleArchive}>
              아카이브 + 생성
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
