'use client'

import { useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ConfirmDialog } from '@/components/confirm-dialog'
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
import { formatDate } from '@/lib/utils/date'
import { toast } from 'sonner'
import { KeyRound, Trash2, Mail, Chrome, Ghost } from 'lucide-react'

interface MemberWithSeasons {
  id: string
  nickname: string
  email: string
  role: 'admin' | 'member'
  created_at: string
  providers: string[]
  lastSignIn: string | null
  seasons: string[]
  hasPassword: boolean
}

interface OrphanUser {
  id: string
  email: string
  providers: string[]
  created_at: string
}

interface MembersListProps {
  members: MemberWithSeasons[]
  currentUserId: string
  orphanUsers?: OrphanUser[]
}

export function MembersList({ members, currentUserId, orphanUsers = [] }: MembersListProps) {
  const [loading, setLoading] = useState<string | null>(null)
  const [resetting, setResetting] = useState<string | null>(null)
  const [deleting, setDeleting] = useState<string | null>(null)

  const handleDeleteAccount = async (userId: string) => {
    setDeleting(userId)
    try {
      const result = await deleteUserAccountAction(userId)
      if (result.success) {
        toast.success('계정이 삭제되었습니다.')
      } else {
        toast.error(`계정 삭제 실패: ${result.error}`)
      }
    } catch {
      toast.error('계정 삭제 중 오류 발생')
    } finally {
      setDeleting(null)
    }
  }

  const handlePasswordReset = async (userId: string) => {
    setResetting(userId)
    try {
      const result = await resetMemberPasswordAction(userId)
      if (result.success) {
        toast.success('비밀번호가 초기화되었습니다.')
      } else {
        toast.error(`비밀번호 초기화 실패: ${result.error}`)
      }
    } catch {
      toast.error('비밀번호 초기화 중 오류 발생')
    } finally {
      setResetting(null)
    }
  }

  const handleRoleChange = async (userId: string, newRole: 'admin' | 'member') => {
    setLoading(userId)
    try {
      const result = await updateMemberRoleAction(userId, newRole)
      if (!result.success) {
        toast.error(`역할 변경 실패: ${result.error}`)
      }
    } catch {
      toast.error('역할 변경 중 오류 발생')
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
    <>
    <div className="overflow-x-auto rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>닉네임</TableHead>
            <TableHead>이메일</TableHead>
            <TableHead>로그인 방식</TableHead>
            <TableHead>가입일</TableHead>
            <TableHead>마지막 로그인</TableHead>
            <TableHead>소속 시즌</TableHead>
            <TableHead className="w-32">역할</TableHead>
            <TableHead className="w-24">관리</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {members.map((member) => {
            const createdAt = formatDate(member.created_at)
            const isCurrentUser = member.id === currentUserId

            return (
              <TableRow key={member.id}>
                <TableCell className="font-medium">
                  {member.nickname}
                  {isCurrentUser && (
                    <span className="ml-2 text-xs text-muted-foreground">(나)</span>
                  )}
                </TableCell>
                <TableCell className="text-muted-foreground text-sm">
                  {member.email}
                </TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    {member.providers.includes('email') && (
                      <Badge variant="outline" className="text-xs gap-1">
                        <Mail className="h-3 w-3" />
                        이메일
                      </Badge>
                    )}
                    {member.providers.includes('google') && (
                      <Badge variant="outline" className="text-xs gap-1">
                        <Chrome className="h-3 w-3" />
                        Google
                      </Badge>
                    )}
                  </div>
                </TableCell>
                <TableCell className="text-muted-foreground">{createdAt}</TableCell>
                <TableCell className="text-muted-foreground">
                  {member.lastSignIn ? formatDate(member.lastSignIn) : '-'}
                </TableCell>
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
                      <ConfirmDialog
                        trigger={
                          <Button
                            variant="ghost"
                            size="icon"
                            disabled={resetting === member.id}
                          >
                            <KeyRound className="h-4 w-4" />
                          </Button>
                        }
                        title="비밀번호 초기화"
                        description={`정말 ${member.nickname}님의 비밀번호를 초기화하시겠습니까?`}
                        onConfirm={() => handlePasswordReset(member.id)}
                        loading={resetting === member.id}
                        confirmText="초기화"
                      />
                    )}
                    {!isCurrentUser && (
                      <ConfirmDialog
                        trigger={
                          <Button
                            variant="ghost"
                            size="icon"
                            disabled={deleting === member.id}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        }
                        title="계정 삭제"
                        description={`정말 ${member.nickname}님의 계정을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다. 작성한 요약본은 익명화되어 보존됩니다.`}
                        onConfirm={() => handleDeleteAccount(member.id)}
                        loading={deleting === member.id}
                        confirmText="삭제"
                        variant="destructive"
                      />
                    )}
                  </div>
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </div>

    {orphanUsers.length > 0 && (
      <div className="mt-6">
        <div className="mb-3 flex items-center gap-2">
          <Ghost className="h-5 w-5 text-muted-foreground" />
          <h3 className="text-lg font-semibold">유령 계정</h3>
          <Badge variant="secondary" className="text-xs">
            {orphanUsers.length}
          </Badge>
        </div>
        <p className="mb-3 text-sm text-muted-foreground">
          인증 시스템에만 남아있고 프로필이 없는 계정입니다. 삭제해도 안전합니다.
        </p>
        <div className="overflow-x-auto rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>이메일</TableHead>
                <TableHead>로그인 방식</TableHead>
                <TableHead>가입일</TableHead>
                <TableHead className="w-24">관리</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orphanUsers.map((orphan) => (
                <TableRow key={orphan.id}>
                  <TableCell className="text-sm">
                    {orphan.email || <span className="text-muted-foreground">-</span>}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      {orphan.providers.includes('email') && (
                        <Badge variant="outline" className="text-xs gap-1">
                          <Mail className="h-3 w-3" />
                          이메일
                        </Badge>
                      )}
                      {orphan.providers.includes('google') && (
                        <Badge variant="outline" className="text-xs gap-1">
                          <Chrome className="h-3 w-3" />
                          Google
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {formatDate(orphan.created_at)}
                  </TableCell>
                  <TableCell>
                    <ConfirmDialog
                      trigger={
                        <Button
                          variant="ghost"
                          size="icon"
                          disabled={deleting === orphan.id}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      }
                      title="유령 계정 삭제"
                      description={`${orphan.email || '알 수 없는 계정'}을 삭제하시겠습니까? 이 계정은 프로필이 없는 유령 계정입니다.`}
                      onConfirm={() => handleDeleteAccount(orphan.id)}
                      loading={deleting === orphan.id}
                      confirmText="삭제"
                      variant="destructive"
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    )}
    </>
  )
}
