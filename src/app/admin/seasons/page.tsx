import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import { SeasonsList } from '@/components/admin/seasons/seasons-list'
import { CreateSeasonDialog } from '@/components/admin/seasons/create-season-dialog'

export default async function SeasonsPage() {
  const supabase = await createClient()

  // 전체 시즌 조회 (최신순)
  const { data: seasons } = await supabase
    .from('seasons')
    .select('*')
    .order('created_at', { ascending: false })

  // 각 시즌의 멤버 수 조회
  const seasonsWithMemberCount = await Promise.all(
    (seasons || []).map(async (season) => {
      const { count } = await supabase
        .from('season_members')
        .select('*', { count: 'exact', head: true })
        .eq('season_id', season.id)

      return {
        ...season,
        memberCount: count || 0,
      }
    })
  )

  return (
    <div>
      <div className="mb-4 flex flex-col gap-3 sm:mb-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold sm:text-3xl">시즌 관리</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            시즌 생성 및 멤버 관리
          </p>
        </div>
        <CreateSeasonDialog>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            시즌 생성
          </Button>
        </CreateSeasonDialog>
      </div>

      <SeasonsList seasons={seasonsWithMemberCount} />
    </div>
  )
}
