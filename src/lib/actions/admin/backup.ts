'use server'

import { revalidatePath } from 'next/cache'
import { requireAdmin } from './auth-guard'
import { createAdminClient } from '@/lib/supabase/admin'
import { seasonId as generateSeasonId } from '@/lib/nanoid'
import { generateWeeks } from '@/lib/utils/week-generator'
import {
  backupFileSchema,
  restoreOptionsSchema,
  archiveAndCreateSeasonSchema,
  MAX_BACKUP_FILE_SIZE,
  type BackupFile,
  type RestoreOptions,
  type ArchiveAndCreateSeasonInput,
} from '@/lib/schemas/backup'
import { seasonIdSchema } from '@/lib/schemas/admin'

// FK 순서대로 upsert할 테이블 목록
const UPSERT_ORDER = [
  'profiles',
  'seasons',
  'season_members',
  'invite_codes',
  'weeks',
  'summaries',
  'shared_links',
  'comments',
  'economic_indicators',
] as const

export async function restoreBackupAction(
  fileContent: string,
  options: RestoreOptions = { conflictStrategy: 'skip' }
) {
  const auth = await requireAdmin()
  if (!auth.authorized) return auth.response

  // 파일 크기 제한
  if (fileContent.length > MAX_BACKUP_FILE_SIZE) {
    return { success: false, error: '파일 크기가 50MB를 초과합니다.' }
  }

  // JSON 파싱
  let parsed: unknown
  try {
    parsed = JSON.parse(fileContent)
  } catch {
    return { success: false, error: '올바른 JSON 파일이 아닙니다.' }
  }

  // 스키마 검증
  const validated = backupFileSchema.safeParse(parsed)
  if (!validated.success) {
    return { success: false, error: `백업 파일 형식이 올바르지 않습니다: ${validated.error.issues[0].message}` }
  }

  const optionsParsed = restoreOptionsSchema.safeParse(options)
  if (!optionsParsed.success) {
    return { success: false, error: '복원 옵션이 올바르지 않습니다.' }
  }

  const backup: BackupFile = validated.data
  const conflictStrategy = optionsParsed.data.conflictStrategy
  const adminClient = createAdminClient()

  const results: Record<string, { inserted: number; skipped: number; errors: string[] }> = {}

  for (const table of UPSERT_ORDER) {
    const rows = backup.data[table]
    if (!rows || rows.length === 0) {
      results[table] = { inserted: 0, skipped: 0, errors: [] }
      continue
    }

    const tableResult = { inserted: 0, skipped: 0, errors: [] as string[] }

    if (conflictStrategy === 'overwrite') {
      // upsert (덮어쓰기)
      const { error } = await adminClient
        .from(table)
        .upsert(rows as Record<string, unknown>[], { onConflict: 'id' })

      if (error) {
        tableResult.errors.push(error.message)
      } else {
        tableResult.inserted = rows.length
      }
    } else {
      // skip (충돌 무시) - 개별 insert로 처리
      for (const row of rows) {
        const { error } = await adminClient
          .from(table)
          .insert(row as Record<string, unknown>)

        if (error) {
          if (error.code === '23505') {
            // unique violation → skip
            tableResult.skipped++
          } else {
            tableResult.errors.push(`${(row as Record<string, unknown>).id}: ${error.message}`)
          }
        } else {
          tableResult.inserted++
        }
      }
    }

    results[table] = tableResult
  }

  revalidatePath('/admin/backup')
  revalidatePath('/dashboard')

  const totalInserted = Object.values(results).reduce((sum, r) => sum + r.inserted, 0)
  const totalSkipped = Object.values(results).reduce((sum, r) => sum + r.skipped, 0)
  const totalErrors = Object.values(results).reduce((sum, r) => sum + r.errors.length, 0)

  return {
    success: true,
    results,
    summary: {
      inserted: totalInserted,
      skipped: totalSkipped,
      errors: totalErrors,
    },
  }
}

// A. 시즌 데이터 삭제 (시즌/멤버는 유지, 하위 데이터만 삭제)
export async function resetSeasonDataAction(targetSeasonId: string) {
  const auth = await requireAdmin()
  if (!auth.authorized) return auth.response

  const parsed = seasonIdSchema.safeParse(targetSeasonId)
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message }
  }

  const adminClient = createAdminClient()

  // 시즌 존재 확인
  const { data: season, error: seasonError } = await adminClient
    .from('seasons')
    .select('id, name')
    .eq('id', targetSeasonId)
    .single()

  if (seasonError || !season) {
    return { success: false, error: '시즌을 찾을 수 없습니다.' }
  }

  // 주차 ID 조회
  const { data: weeks } = await adminClient
    .from('weeks')
    .select('id')
    .eq('season_id', targetSeasonId)

  const weekIds = (weeks ?? []).map((w) => w.id)

  // 삭제 순서: comments → summaries → economic_indicators → shared_links → weeks
  let deletedCounts: Record<string, number> = {}

  if (weekIds.length > 0) {
    // summaries의 id 먼저 조회 (comments 삭제용)
    const { data: summaries } = await adminClient
      .from('summaries')
      .select('id')
      .in('week_id', weekIds)

    const summaryIds = (summaries ?? []).map((s) => s.id)

    if (summaryIds.length > 0) {
      const { count: commentsCount } = await adminClient
        .from('comments')
        .delete({ count: 'exact' })
        .in('summary_id', summaryIds)
      deletedCounts.comments = commentsCount ?? 0
    }

    const { count: summariesCount } = await adminClient
      .from('summaries')
      .delete({ count: 'exact' })
      .in('week_id', weekIds)
    deletedCounts.summaries = summariesCount ?? 0

    const { count: indicatorsCount } = await adminClient
      .from('economic_indicators')
      .delete({ count: 'exact' })
      .in('week_id', weekIds)
    deletedCounts.economic_indicators = indicatorsCount ?? 0
  }

  // shared_links는 season_id로 직접 삭제
  const { count: linksCount } = await adminClient
    .from('shared_links')
    .delete({ count: 'exact' })
    .eq('season_id', targetSeasonId)
  deletedCounts.shared_links = linksCount ?? 0

  // weeks 삭제
  if (weekIds.length > 0) {
    const { count: weeksCount } = await adminClient
      .from('weeks')
      .delete({ count: 'exact' })
      .eq('season_id', targetSeasonId)
    deletedCounts.weeks = weeksCount ?? 0
  }

  revalidatePath('/admin/backup')
  revalidatePath('/dashboard')

  return {
    success: true,
    seasonName: season.name,
    deletedCounts,
  }
}

// B. 시즌 완전 삭제 (CASCADE로 하위 데이터 자동 삭제)
export async function deleteSeasonAction(targetSeasonId: string) {
  const auth = await requireAdmin()
  if (!auth.authorized) return auth.response

  const parsed = seasonIdSchema.safeParse(targetSeasonId)
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message }
  }

  const adminClient = createAdminClient()

  // 시즌 존재 확인
  const { data: season, error: seasonError } = await adminClient
    .from('seasons')
    .select('id, name, is_active')
    .eq('id', targetSeasonId)
    .single()

  if (seasonError || !season) {
    return { success: false, error: '시즌을 찾을 수 없습니다.' }
  }

  // 활성 시즌은 삭제 불가
  if (season.is_active) {
    return { success: false, error: '활성 시즌은 삭제할 수 없습니다. 먼저 비활성화하세요.' }
  }

  const { error } = await adminClient
    .from('seasons')
    .delete()
    .eq('id', targetSeasonId)

  if (error) {
    return { success: false, error: `시즌 삭제 실패: ${error.message}` }
  }

  revalidatePath('/admin/backup')
  revalidatePath('/admin/seasons')
  revalidatePath('/dashboard')

  return { success: true, seasonName: season.name }
}

// C. 시즌 아카이브 + 새 시즌 생성
export async function archiveAndCreateSeasonAction(input: ArchiveAndCreateSeasonInput) {
  const auth = await requireAdmin()
  if (!auth.authorized) return auth.response

  const parsed = archiveAndCreateSeasonSchema.safeParse(input)
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message }
  }

  const { seasonId: oldSeasonId, newName, startDate, endDate, copyMembers } = parsed.data
  const adminClient = createAdminClient()

  // 기존 시즌 확인
  const { data: oldSeason, error: oldError } = await adminClient
    .from('seasons')
    .select('id, name')
    .eq('id', oldSeasonId)
    .single()

  if (oldError || !oldSeason) {
    return { success: false, error: '기존 시즌을 찾을 수 없습니다.' }
  }

  // 1. 모든 시즌 비활성화
  const { error: deactivateError } = await adminClient
    .from('seasons')
    .update({ is_active: false })
    .neq('id', '')  // 전체 업데이트

  if (deactivateError) {
    return { success: false, error: '시즌 비활성화 실패' }
  }

  // 모든 주차 is_current = false
  const { error: weekResetError } = await adminClient
    .from('weeks')
    .update({ is_current: false })
    .eq('is_current', true)

  if (weekResetError) {
    return { success: false, error: '주차 초기화 실패' }
  }

  // 2. 새 시즌 생성
  const newSeasonId = generateSeasonId()

  const { error: createError } = await adminClient
    .from('seasons')
    .insert({
      id: newSeasonId,
      name: newName,
      start_date: startDate,
      end_date: endDate,
      is_active: true,
    })

  if (createError) {
    // 롤백: 기존 시즌 다시 활성화
    await adminClient
      .from('seasons')
      .update({ is_active: true })
      .eq('id', oldSeasonId)
    return { success: false, error: `새 시즌 생성 실패: ${createError.message}` }
  }

  // 3. 주차 생성
  const weeks = generateWeeks(startDate, endDate, newSeasonId)
  const { error: weeksError } = await adminClient.from('weeks').insert(weeks)

  if (weeksError) {
    // 롤백
    await adminClient.from('seasons').delete().eq('id', newSeasonId)
    await adminClient.from('seasons').update({ is_active: true }).eq('id', oldSeasonId)
    return { success: false, error: `주차 생성 실패: ${weeksError.message}` }
  }

  // 4. 멤버 복사 (옵션)
  let copiedMembers = 0
  if (copyMembers) {
    const { data: oldMembers } = await adminClient
      .from('season_members')
      .select('user_id')
      .eq('season_id', oldSeasonId)

    if (oldMembers && oldMembers.length > 0) {
      const newMembers = oldMembers.map((m) => ({
        season_id: newSeasonId,
        user_id: m.user_id,
      }))

      const { error: membersError } = await adminClient
        .from('season_members')
        .insert(newMembers)

      if (membersError) {
        console.error('[Archive] 멤버 복사 실패:', membersError.message)
      } else {
        copiedMembers = newMembers.length
      }
    }
  }

  revalidatePath('/admin/backup')
  revalidatePath('/admin/seasons')
  revalidatePath('/dashboard')

  return {
    success: true,
    oldSeasonName: oldSeason.name,
    newSeasonId,
    newSeasonName: newName,
    copiedMembers,
    weeksCreated: weeks.length,
  }
}
