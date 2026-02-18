'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Download, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

interface Season {
  id: string
  name: string
}

interface BackupControlsProps {
  seasons: Season[]
}

export function BackupControls({ seasons }: BackupControlsProps) {
  const [backupType, setBackupType] = useState<'full' | 'season'>('full')
  const [selectedSeasonId, setSelectedSeasonId] = useState<string>('')
  const [isDownloading, setIsDownloading] = useState(false)

  const handleDownload = async () => {
    setIsDownloading(true)
    try {
      const params = new URLSearchParams({ type: backupType })
      if (backupType === 'season' && selectedSeasonId) {
        params.set('seasonId', selectedSeasonId)
      }

      const response = await fetch(`/api/admin/backup?${params}`)

      if (!response.ok) {
        const error = await response.json()
        toast.error(error.error || '백업 다운로드 실패')
        return
      }

      // 파일 다운로드
      const blob = await response.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = response.headers.get('Content-Disposition')
        ?.split('filename=')[1]
        ?.replace(/"/g, '') || 'backup.json'
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      toast.success('백업 파일이 다운로드되었습니다.')
    } catch {
      toast.error('백업 다운로드 중 오류 발생')
    } finally {
      setIsDownloading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>백업 다운로드</CardTitle>
        <CardDescription>
          전체 데이터 또는 특정 시즌 데이터를 JSON 파일로 백업합니다.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="space-y-2">
            <label className="text-sm font-medium">백업 유형</label>
            <Select
              value={backupType}
              onValueChange={(v) => setBackupType(v as 'full' | 'season')}
            >
              <SelectTrigger className="w-[200px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="full">전체 백업</SelectItem>
                <SelectItem value="season">시즌 백업</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {backupType === 'season' && (
            <div className="space-y-2">
              <label className="text-sm font-medium">시즌 선택</label>
              <Select
                value={selectedSeasonId}
                onValueChange={setSelectedSeasonId}
              >
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="시즌 선택" />
                </SelectTrigger>
                <SelectContent>
                  {seasons.map((season) => (
                    <SelectItem key={season.id} value={season.id}>
                      {season.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <Button
            onClick={handleDownload}
            disabled={isDownloading || (backupType === 'season' && !selectedSeasonId)}
          >
            {isDownloading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Download className="mr-2 h-4 w-4" />
            )}
            {isDownloading ? '다운로드 중...' : '백업 다운로드'}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
