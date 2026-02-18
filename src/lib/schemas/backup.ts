import { z } from 'zod'

// --- Backup Meta ---
export const backupMetaSchema = z.object({
  version: z.literal(1),
  type: z.enum(['full', 'season']),
  created_at: z.string(),
  created_by: z.string(),
  season_id: z.string().optional(),
  season_name: z.string().optional(),
  table_counts: z.record(z.string(), z.number()),
})

// --- Backup Data ---
export const backupDataSchema = z.object({
  profiles: z.array(z.record(z.string(), z.unknown())).default([]),
  seasons: z.array(z.record(z.string(), z.unknown())).default([]),
  season_members: z.array(z.record(z.string(), z.unknown())).default([]),
  weeks: z.array(z.record(z.string(), z.unknown())).default([]),
  summaries: z.array(z.record(z.string(), z.unknown())).default([]),
  comments: z.array(z.record(z.string(), z.unknown())).default([]),
  invite_codes: z.array(z.record(z.string(), z.unknown())).default([]),
  shared_links: z.array(z.record(z.string(), z.unknown())).default([]),
  economic_indicators: z.array(z.record(z.string(), z.unknown())).default([]),
})

// --- Backup File ---
export const backupFileSchema = z.object({
  meta: backupMetaSchema,
  data: backupDataSchema,
})

export type BackupMeta = z.infer<typeof backupMetaSchema>
export type BackupData = z.infer<typeof backupDataSchema>
export type BackupFile = z.infer<typeof backupFileSchema>

// --- Restore Options ---
export const restoreOptionsSchema = z.object({
  conflictStrategy: z.enum(['skip', 'overwrite']).default('skip'),
})

export type RestoreOptions = z.infer<typeof restoreOptionsSchema>

// --- Season Reset ---
export const archiveAndCreateSeasonSchema = z.object({
  seasonId: z.string().min(1, '시즌 ID가 필요합니다.'),
  newName: z.string().min(1, '새 시즌 이름을 입력하세요.').max(100, '시즌 이름은 100자 이하로 입력하세요.'),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, '날짜 형식이 올바르지 않습니다. (YYYY-MM-DD)'),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, '날짜 형식이 올바르지 않습니다. (YYYY-MM-DD)'),
  copyMembers: z.boolean().default(false),
}).refine(
  (data) => data.startDate < data.endDate,
  { message: '종료일은 시작일보다 이후여야 합니다.', path: ['endDate'] }
)

export type ArchiveAndCreateSeasonInput = z.infer<typeof archiveAndCreateSeasonSchema>

// 50MB 파일 크기 제한
export const MAX_BACKUP_FILE_SIZE = 50 * 1024 * 1024
