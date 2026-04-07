import { z } from 'zod'

export const updateCallStatusSchema = z.object({
  status: z.enum(['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED']),
})

export type UpdateCallStatusInput = z.infer<typeof updateCallStatusSchema>
