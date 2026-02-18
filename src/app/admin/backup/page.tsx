import { createClient } from '@/lib/supabase/server'
import { BackupControls } from '@/components/admin/backup/backup-controls'
import { RestoreControls } from '@/components/admin/backup/restore-controls'
import { SeasonResetControls } from '@/components/admin/backup/season-reset-controls'

export default async function BackupPage() {
  const supabase = await createClient()

  const { data: seasons } = await supabase
    .from('seasons')
    .select('id, name, is_active')
    .order('created_at', { ascending: false })

  return (
    <div>
      <div className="mb-4 sm:mb-6">
        <h1 className="text-2xl font-bold sm:text-3xl">백업 / 복원</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          데이터 백업, 복원, 시즌 관리
        </p>
      </div>

      <div className="space-y-6">
        {/* 백업 다운로드 */}
        <BackupControls seasons={seasons ?? []} />

        {/* 데이터 복원 */}
        <RestoreControls />

        {/* 시즌 관리 */}
        <SeasonResetControls seasons={seasons ?? []} />
      </div>
    </div>
  )
}
