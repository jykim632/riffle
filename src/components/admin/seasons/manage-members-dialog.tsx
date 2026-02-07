'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import {
  addSeasonMembersAction,
  removeSeasonMemberAction,
} from '@/lib/actions/admin/seasons'
import { createClient } from '@/lib/supabase/client'

interface Member {
  id: string
  nickname: string
  role: 'admin' | 'member'
}

interface ManageMembersDialogProps {
  children: React.ReactNode
  seasonId: string
  seasonName: string
}

export function ManageMembersDialog({
  children,
  seasonId,
  seasonName,
}: ManageMembersDialogProps) {
  const [open, setOpen] = useState(false)
  const [allMembers, setAllMembers] = useState<Member[]>([])
  const [seasonMemberIds, setSeasonMemberIds] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const loadMembers = useCallback(async () => {
    setLoading(true)
    try {
      const supabase = createClient()

      // 전체 멤버 조회
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, nickname, role')
        .order('nickname')

      // 시즌 멤버 조회
      const { data: seasonMembers } = await supabase
        .from('season_members')
        .select('user_id')
        .eq('season_id', seasonId)

      setAllMembers(profiles || [])
      setSeasonMemberIds(
        new Set((seasonMembers || []).map((sm) => sm.user_id))
      )
    } catch {
      alert('멤버 목록 로드 실패')
    } finally {
      setLoading(false)
    }
  }, [seasonId])

  useEffect(() => {
    if (open) {
      loadMembers()
    }
  }, [open, loadMembers])

  const handleToggleMember = (userId: string) => {
    setSeasonMemberIds((prev) => {
      const next = new Set(prev)
      if (next.has(userId)) {
        next.delete(userId)
      } else {
        next.add(userId)
      }
      return next
    })
  }

  const handleSave = async () => {
    setIsSubmitting(true)
    try {
      const supabase = createClient()

      // 기존 시즌 멤버 조회
      const { data: currentMembers } = await supabase
        .from('season_members')
        .select('user_id')
        .eq('season_id', seasonId)

      const currentMemberIds = new Set(
        (currentMembers || []).map((m) => m.user_id)
      )

      // 추가할 멤버
      const toAdd = Array.from(seasonMemberIds).filter(
        (id) => !currentMemberIds.has(id)
      )

      // 제거할 멤버
      const toRemove = Array.from(currentMemberIds).filter(
        (id) => !seasonMemberIds.has(id)
      )

      // 추가
      if (toAdd.length > 0) {
        const result = await addSeasonMembersAction(seasonId, toAdd)
        if (!result.success) {
          alert(`멤버 추가 실패: ${result.error}`)
          return
        }
      }

      // 제거
      for (const userId of toRemove) {
        const result = await removeSeasonMemberAction(seasonId, userId)
        if (!result.success) {
          alert(`멤버 제거 실패: ${result.error}`)
          return
        }
      }

      setOpen(false)
    } catch {
      alert('멤버 관리 중 오류 발생')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{seasonName} 멤버 관리</DialogTitle>
          <DialogDescription>
            시즌에 참여할 멤버를 선택하세요.
          </DialogDescription>
        </DialogHeader>

        <div className="max-h-[400px] space-y-4 overflow-y-auto py-4">
          {loading ? (
            <p className="text-center text-sm text-muted-foreground">
              로딩 중...
            </p>
          ) : allMembers.length === 0 ? (
            <p className="text-center text-sm text-muted-foreground">
              등록된 멤버가 없습니다.
            </p>
          ) : (
            allMembers.map((member) => (
              <div
                key={member.id}
                className="flex items-center space-x-2 rounded-md border p-3"
              >
                <Checkbox
                  id={member.id}
                  checked={seasonMemberIds.has(member.id)}
                  onCheckedChange={() => handleToggleMember(member.id)}
                />
                <Label
                  htmlFor={member.id}
                  className="flex-1 cursor-pointer text-sm font-normal"
                >
                  {member.nickname}
                  {member.role === 'admin' && (
                    <span className="ml-2 text-xs text-muted-foreground">
                      (관리자)
                    </span>
                  )}
                </Label>
              </div>
            ))
          )}
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={isSubmitting}
          >
            취소
          </Button>
          <Button onClick={handleSave} disabled={isSubmitting || loading}>
            {isSubmitting ? '저장 중...' : '저장'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
