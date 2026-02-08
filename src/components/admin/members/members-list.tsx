'use client'

import { useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  updateMemberRoleAction,
  resetMemberPasswordAction,
  deleteUserAccountAction,
} from '@/lib/actions/admin/members'
import { format } from 'date-fns'
import { ko } from 'date-fns/locale'
import { KeyRound, Trash2 } from 'lucide-react'

interface MemberWithSeasons {
  id: string
  nickname: string
  role: 'admin' | 'member'
  created_at: string
  seasons: string[]
  hasPassword: boolean
}

interface MembersListProps {
  members: MemberWithSeasons[]
  currentUserId: string
}

export function MembersList({ members, currentUserId }: MembersListProps) {
  const [loading, setLoading] = useState<string | null>(null)
  const [resetting, setResetting] = useState<string | null>(null)
  const [deleting, setDeleting] = useState<string | null>(null)

  const handleDeleteAccount = async (userId: string) => {
    setDeleting(userId)
    try {
      const result = await deleteUserAccountAction(userId)
      if (result.success) {
        alert('계정이 삭제되었습니다.')
      } else {
        alert(`계정 삭제 실패: ${result.error}`)
      }
    } catch {
      alert('계정 삭제 중 오류 발생')
    } finally {
      setDeleting(null)
    }
  }

  const handlePasswordReset = async (userId: string) => {
    setResetting(userId)
    try {
      const result = await resetMemberPasswordAction(userId)
      if (result.success) {
        alert('비밀번호가 초기화되었습니다.')
      } else {
        alert(`비밀번호 초기화 실패: ${result.error}`)
      }
    } catch {
      alert('비밀번호 초기화 중 오류 발생')
    } finally {
      setResetting(null)
    }
  }

  const handleRoleChange = async (userId: string, newRole: 'admin' | 'member') => {
    setLoading(userId)
    try {
      const result = await updateMemberRoleAction(userId, newRole)
      if (!result.success) {
        alert(`역할 변경 실패: ${result.error}`)
      }
    } catch {
      alert('역할 변경 중 오류 발생')
    } finally {
      setLoading(null)
    }
  }

  if (!members || members.length === 0) {
    return (
      <div className="rounded-lg border border-dashed p-8 text-center">
        <p className="text-muted-foreground">등록된 멤버가 없습니다.</p>
      </div>
    )
  }

  return (
    <div className="rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>닉네임</TableHead>
            <TableHead>가입일</TableHead>
            <TableHead>소속 시즌</TableHead>
            <TableHead className="w-32">역할</TableHead>
            <TableHead className="w-24">관리</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {members.map((member) => {
            const createdAt = format(new Date(member.created_at), 'yyyy.MM.dd', {
              locale: ko,
            })
            const isCurrentUser = member.id === currentUserId

            return (
              <TableRow key={member.id}>
                <TableCell className="font-medium">
                  {member.nickname}
                  {isCurrentUser && (
                    <span className="ml-2 text-xs text-muted-foreground">(나)</span>
                  )}
                </TableCell>
                <TableCell className="text-muted-foreground">{createdAt}</TableCell>
                <TableCell>
                  {member.seasons.length > 0 ? (
                    <div className="flex flex-wrap gap-1">
                      {member.seasons.map((season) => (
                        <Badge key={season} variant="secondary" className="text-xs">
                          {season}
                        </Badge>
                      ))}
                    </div>
                  ) : (
                    <span className="text-muted-foreground">-</span>
                  )}
                </TableCell>
                <TableCell>
                  <Select
                    value={member.role}
                    onValueChange={(value: 'admin' | 'member') =>
                      handleRoleChange(member.id, value)
                    }
                    disabled={loading === member.id || isCurrentUser}
                  >
                    <SelectTrigger className="w-28">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">관리자</SelectItem>
                      <SelectItem value="member">멤버</SelectItem>
                    </SelectContent>
                  </Select>
                </TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    {member.hasPassword && (
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            disabled={resetting === member.id}
                          >
                            <KeyRound className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>비밀번호 초기화</AlertDialogTitle>
                            <AlertDialogDescription>
                              정말 {member.nickname}님의 비밀번호를 초기화하시겠습니까?
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>취소</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handlePasswordReset(member.id)}
                            >
                              초기화
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    )}
                    {!isCurrentUser && (
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            disabled={deleting === member.id}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>계정 삭제</AlertDialogTitle>
                            <AlertDialogDescription>
                              정말 {member.nickname}님의 계정을 삭제하시겠습니까?
                              이 작업은 되돌릴 수 없습니다. 작성한 요약본은 익명화되어
                              보존됩니다.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>취소</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDeleteAccount(member.id)}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              {deleting === member.id ? '삭제 중...' : '삭제'}
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
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
