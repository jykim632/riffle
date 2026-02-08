'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Copy, Trash2 } from 'lucide-react'
import { ConfirmDialog } from '@/components/confirm-dialog'
import { deleteInviteCodeAction } from '@/lib/actions/admin/invite-codes'
import { toast } from 'sonner'
import { formatDateTime } from '@/lib/utils/date'

interface InviteCode {
  id: string
  code: string
  is_used: boolean
  created_at: string
  used_at: string | null
  created_by_nickname: string | null
  used_by_nickname: string | null
}

interface InviteCodesListProps {
  codes: InviteCode[]
}

export function InviteCodesList({ codes }: InviteCodesListProps) {
  const [loading, setLoading] = useState<string | null>(null)
  const [copied, setCopied] = useState<string | null>(null)

  const handleCopy = async (code: string) => {
    await navigator.clipboard.writeText(code)
    setCopied(code)
    setTimeout(() => setCopied(null), 2000)
  }

  const handleDelete = async (codeId: string) => {
    setLoading(codeId)
    try {
      const result = await deleteInviteCodeAction(codeId)
      if (!result.success) {
        toast.error(`삭제 실패: ${result.error}`)
      }
    } catch {
      toast.error('삭제 중 오류 발생')
    } finally {
      setLoading(null)
    }
  }

  if (!codes || codes.length === 0) {
    return (
      <div className="rounded-lg border border-dashed p-8 text-center">
        <p className="text-muted-foreground">생성된 초대 코드가 없습니다.</p>
      </div>
    )
  }

  return (
    <div className="overflow-x-auto rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>코드</TableHead>
            <TableHead>상태</TableHead>
            <TableHead>생성자</TableHead>
            <TableHead>생성일</TableHead>
            <TableHead>사용자</TableHead>
            <TableHead className="w-24 text-right">작업</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {codes.map((code) => {
            const createdAt = formatDateTime(code.created_at)
            const usedAt = code.used_at
              ? formatDateTime(code.used_at)
              : null

            return (
              <TableRow key={code.id}>
                <TableCell>
                  <code className="rounded bg-muted px-2 py-1 font-mono text-sm">
                    {code.code}
                  </code>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="ml-2 h-6 w-6 p-0"
                    onClick={() => handleCopy(code.code)}
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                  {copied === code.code && (
                    <span className="ml-1 text-xs text-green-600">복사됨</span>
                  )}
                </TableCell>
                <TableCell>
                  <Badge variant={code.is_used ? 'secondary' : 'default'}>
                    {code.is_used ? '사용됨' : '미사용'}
                  </Badge>
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {code.created_by_nickname || '-'}
                </TableCell>
                <TableCell className="text-muted-foreground">{createdAt}</TableCell>
                <TableCell>
                  {code.is_used ? (
                    <span className="text-muted-foreground">
                      {code.used_by_nickname} ({usedAt})
                    </span>
                  ) : (
                    <span className="text-muted-foreground">-</span>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  {!code.is_used && (
                    <ConfirmDialog
                      trigger={
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                          disabled={loading === code.id}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      }
                      title="초대 코드 삭제"
                      description="이 초대 코드를 삭제하시겠습니까?"
                      onConfirm={() => handleDelete(code.id)}
                      loading={loading === code.id}
                      confirmText="삭제"
                      variant="destructive"
                    />
                  )}
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </div>
  )
}
