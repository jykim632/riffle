import { z } from 'zod'

// --- Members ---
export const userIdSchema = z.string().uuid('유효하지 않은 사용자 ID입니다.')

export const updateMemberRoleSchema = z.object({
  userId: userIdSchema,
  role: z.enum(['admin', 'member'], { message: '역할은 admin 또는 member만 가능합니다.' }),
})

// --- Seasons ---
export const seasonIdSchema = z.string().min(1, '시즌 ID가 필요합니다.')

export const createSeasonSchema = z.object({
  name: z.string().min(1, '시즌 이름을 입력하세요.').max(100, '시즌 이름은 100자 이하로 입력하세요.'),
  start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, '날짜 형식이 올바르지 않습니다. (YYYY-MM-DD)'),
  end_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, '날짜 형식이 올바르지 않습니다. (YYYY-MM-DD)'),
}).refine(
  (data) => data.start_date < data.end_date,
  { message: '종료일은 시작일보다 이후여야 합니다.', path: ['end_date'] }
)

export const addSeasonMembersSchema = z.object({
  seasonId: seasonIdSchema,
  userIds: z.array(userIdSchema).min(1, '최소 1명의 멤버를 선택하세요.'),
})

// --- Weeks ---
export const weekIdSchema = z.string().min(1, '주차 ID가 필요합니다.')

export const updateWeekSchema = z.object({
  title: z.string().max(200, '제목은 200자 이하로 입력하세요.').nullable().optional(),
})

// --- Invite Codes ---
export const adminCreateInviteCodeSchema = z.object({
  count: z.number().int().min(1, '최소 1개').max(50, '최대 50개'),
  seasonId: z.string().nullable().optional(),
})

export const inviteCodeIdSchema = z.string().uuid('유효하지 않은 초대 코드 ID입니다.')
