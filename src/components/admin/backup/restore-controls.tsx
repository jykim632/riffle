'use client'

import { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
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
import { Upload, Loader2, FileJson } from 'lucide-react'
import { toast } from 'sonner'
import { restoreBackupAction } from '@/lib/actions/admin/backup'
import type { RestoreOptions } from '@/lib/schemas/backup'

const MAX_FILE_SIZE = 50 * 1024 * 1024 // 50MB

export function RestoreControls() {
  const [file, setFile] = useState<File | null>(null)
  const [conflictStrategy, setConflictStrategy] = useState<'skip' | 'overwrite'>('skip')
  const [isRestoring, setIsRestoring] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [restoreResult, setRestoreResult] = useState<{
    inserted: number
    skipped: number
    errors: number
  } | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0]
    if (!selected) return

    if (selected.size > MAX_FILE_SIZE) {
      toast.error('파일 크기가 50MB를 초과합니다.')
      return
    }

    if (!selected.name.endsWith('.json')) {
      toast.error('JSON 파일만 업로드할 수 있습니다.')
      return
    }

    setFile(selected)
    setRestoreResult(null)
  }

  const handleRestore = async () => {
    if (!file) return

    setIsRestoring(true)
    setShowConfirm(false)

    try {
      const content = await file.text()
      const options: RestoreOptions = { conflictStrategy }
      const result = await restoreBackupAction(content, options)

      if (result.success && 'summary' in result && result.summary) {
        const summary = result.summary
        setRestoreResult(summary)
        toast.success(
          `복원 완료: ${summary.inserted}건 추가, ${summary.skipped}건 건너뜀`
        )
      } else if ('error' in result) {
        toast.error(result.error)
      }
    } catch {
      toast.error('복원 중 오류 발생')
    } finally {
      setIsRestoring(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>데이터 복원</CardTitle>
        <CardDescription>
          백업 JSON 파일을 업로드하여 데이터를 복원합니다. (최대 50MB)
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="space-y-2">
            <label className="text-sm font-medium">백업 파일</label>
            <div
              className="flex cursor-pointer items-center gap-2 rounded-md border border-dashed p-3 transition-colors hover:bg-muted/50"
              onClick={() => fileInputRef.current?.click()}
            >
              <FileJson className="h-5 w-5 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">
                {file ? file.name : 'JSON 파일을 선택하세요'}
              </span>
              <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                onChange={handleFileChange}
                className="hidden"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">충돌 전략</label>
            <Select
              value={conflictStrategy}
              onValueChange={(v) => setConflictStrategy(v as 'skip' | 'overwrite')}
            >
              <SelectTrigger className="w-[200px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="skip">건너뛰기 (기존 유지)</SelectItem>
                <SelectItem value="overwrite">덮어쓰기</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button
            onClick={() => setShowConfirm(true)}
            disabled={!file || isRestoring}
          >
            {isRestoring ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Upload className="mr-2 h-4 w-4" />
            )}
            {isRestoring ? '복원 중...' : '복원 시작'}
          </Button>
        </div>

        {restoreResult && (
          <div className="rounded-md bg-muted p-3 text-sm">
            <p>추가: <strong>{restoreResult.inserted}건</strong></p>
            <p>건너뜀: <strong>{restoreResult.skipped}건</strong></p>
            {restoreResult.errors > 0 && (
              <p className="text-destructive">오류: <strong>{restoreResult.errors}건</strong></p>
            )}
          </div>
        )}

        <AlertDialog open={showConfirm} onOpenChange={setShowConfirm}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>데이터 복원 확인</AlertDialogTitle>
              <AlertDialogDescription>
                {conflictStrategy === 'overwrite'
                  ? '덮어쓰기 모드로 복원합니다. 기존 데이터가 변경될 수 있습니다.'
                  : '건너뛰기 모드로 복원합니다. 기존 데이터는 변경되지 않습니다.'}
                <br />
                계속하시겠습니까?
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>취소</AlertDialogCancel>
              <AlertDialogAction onClick={handleRestore}>
                복원 시작
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardContent>
    </Card>
  )
}
