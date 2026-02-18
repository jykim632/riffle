import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { isAdmin } from '@/lib/utils/season-membership'
import type { BackupFile, BackupData } from '@/lib/schemas/backup'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const TABLES = [
  'profiles',
  'seasons',
  'season_members',
  'weeks',
  'summaries',
  'comments',
  'invite_codes',
  'shared_links',
  'economic_indicators',
] as const

export async function GET(request: Request) {
  // 인증 확인
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 })
  }

  const admin = await isAdmin(user.id)
  if (!admin) {
    return NextResponse.json({ error: '권한이 없습니다.' }, { status: 403 })
  }

  const { searchParams } = new URL(request.url)
  const type = searchParams.get('type') === 'season' ? 'season' : 'full'
  const seasonId = searchParams.get('seasonId')

  if (type === 'season' && !seasonId) {
    return NextResponse.json({ error: '시즌 ID가 필요합니다.' }, { status: 400 })
  }

  const adminClient = createAdminClient()

  try {
    let data: BackupData

    if (type === 'full') {
      data = await fetchFullBackup(adminClient)
    } else {
      data = await fetchSeasonBackup(adminClient, seasonId!)
    }

    // 시즌 이름 조회
    let seasonName: string | undefined
    if (type === 'season' && seasonId) {
      const season = data.seasons.find((s: Record<string, unknown>) => s.id === seasonId)
      seasonName = season?.name as string | undefined
    }

    const tableCounts: Record<string, number> = {}
    for (const table of TABLES) {
      tableCounts[table] = data[table]?.length ?? 0
    }

    const backup: BackupFile = {
      meta: {
        version: 1,
        type,
        created_at: new Date().toISOString(),
        created_by: user.id,
        ...(type === 'season' && { season_id: seasonId!, season_name: seasonName }),
        table_counts: tableCounts,
      },
      data,
    }

    const timestamp = new Date().toISOString().slice(0, 10)
    const filename = type === 'full'
      ? `riffle-backup-full-${timestamp}.json`
      : `riffle-backup-season-${seasonId}-${timestamp}.json`

    return new NextResponse(JSON.stringify(backup, null, 2), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    })
  } catch (error) {
    console.error('[Backup] 백업 생성 실패:', error)
    return NextResponse.json(
      { error: '백업 생성에 실패했습니다.' },
      { status: 500 }
    )
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function fetchFullBackup(client: any): Promise<BackupData> {
  const results = await Promise.all(
    TABLES.map(async (table) => {
      const { data, error } = await client.from(table).select('*')
      if (error) throw new Error(`${table} 조회 실패: ${error.message}`)
      return [table, data ?? []] as const
    })
  )

  return Object.fromEntries(results) as unknown as BackupData
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function fetchSeasonBackup(client: any, seasonId: string): Promise<BackupData> {
  // 시즌 조회
  const { data: season, error: seasonError } = await client
    .from('seasons')
    .select('*')
    .eq('id', seasonId)
    .single()

  if (seasonError) throw new Error(`시즌 조회 실패: ${seasonError.message}`)

  // 시즌 멤버
  const { data: seasonMembers } = await client
    .from('season_members')
    .select('*')
    .eq('season_id', seasonId)

  // 주차
  const { data: weeks } = await client
    .from('weeks')
    .select('*')
    .eq('season_id', seasonId)

  const weekIds = (weeks ?? []).map((w: Record<string, unknown>) => w.id)
  const memberUserIds = (seasonMembers ?? []).map((m: Record<string, unknown>) => m.user_id)

  // 요약본
  const { data: summaries } = weekIds.length > 0
    ? await client.from('summaries').select('*').in('week_id', weekIds)
    : { data: [] }

  const summaryIds = (summaries ?? []).map((s: Record<string, unknown>) => s.id)

  // 댓글
  const { data: comments } = summaryIds.length > 0
    ? await client.from('comments').select('*').in('summary_id', summaryIds)
    : { data: [] }

  // 공유 링크
  const { data: sharedLinks } = await client
    .from('shared_links')
    .select('*')
    .eq('season_id', seasonId)

  // 경제지표
  const { data: indicators } = weekIds.length > 0
    ? await client.from('economic_indicators').select('*').in('week_id', weekIds)
    : { data: [] }

  // 초대 코드 (시즌 연결된 것만)
  const { data: inviteCodes } = await client
    .from('invite_codes')
    .select('*')
    .eq('season_id', seasonId)

  // 관련 프로필 수집 (멤버 + 요약 작성자 + 댓글 작성자 + 공유 링크 작성자)
  const authorIds = new Set<string>(memberUserIds)
  for (const s of summaries ?? []) if (s.author_id) authorIds.add(s.author_id as string)
  for (const c of comments ?? []) if (c.author_id) authorIds.add(c.author_id as string)
  for (const l of sharedLinks ?? []) if (l.author_id) authorIds.add(l.author_id as string)

  const { data: profiles } = authorIds.size > 0
    ? await client.from('profiles').select('*').in('id', Array.from(authorIds))
    : { data: [] }

  return {
    profiles: profiles ?? [],
    seasons: [season],
    season_members: seasonMembers ?? [],
    weeks: weeks ?? [],
    summaries: summaries ?? [],
    comments: comments ?? [],
    invite_codes: inviteCodes ?? [],
    shared_links: sharedLinks ?? [],
    economic_indicators: indicators ?? [],
  }
}
