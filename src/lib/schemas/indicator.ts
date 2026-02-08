import { z } from 'zod'

export const indicatorRowSchema = z.object({
  id: z.string().uuid(),
  indicator_code: z.string(),
  stat_code: z.string(),
  item_code: z.string(),
  data_value: z.number(),
  unit_name: z.string().nullable(),
  time_label: z.string(),
  week_id: z.string().nullable(),
  fetched_at: z.string(),
})

export type IndicatorRow = z.infer<typeof indicatorRowSchema>
