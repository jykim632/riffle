import { z } from 'zod'

/**
 * ECOS Open API 응답 스키마
 * https://ecos.bok.or.kr/api/#/
 */

const ecosRowSchema = z.object({
  STAT_CODE: z.string(),
  STAT_NAME: z.string(),
  ITEM_CODE1: z.string(),
  ITEM_NAME1: z.string(),
  ITEM_CODE2: z.string().nullish(),
  ITEM_NAME2: z.string().nullish(),
  ITEM_CODE3: z.string().nullish(),
  ITEM_NAME3: z.string().nullish(),
  ITEM_CODE4: z.string().nullish(),
  ITEM_NAME4: z.string().nullish(),
  UNIT_NAME: z.string().nullish(),
  WGT: z.union([z.string(), z.number()]).nullish(),
  TIME: z.string(),
  DATA_VALUE: z.string(),
})

export const ecosResponseSchema = z.object({
  StatisticSearch: z.object({
    list_total_count: z.number(),
    row: z.array(ecosRowSchema),
  }),
})

export type EcosRow = z.infer<typeof ecosRowSchema>
export type EcosResponse = z.infer<typeof ecosResponseSchema>

/**
 * 정규화된 지표 데이터 (DB 저장용)
 */
export interface NormalizedIndicator {
  indicatorCode: string
  statCode: string
  itemCode: string
  dataValue: number
  unitName: string | null
  timeLabel: string
}
