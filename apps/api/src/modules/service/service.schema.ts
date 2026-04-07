import { z } from 'zod'

export const createServiceSchema = z.object({
  name: z.string().min(2),
  description: z.string().optional(),
})

export const updateServiceSchema = z.object({
  name: z.string().min(2).optional(),
  description: z.string().optional(),
  isActive: z.boolean().optional(),
})

export type CreateServiceInput = z.infer<typeof createServiceSchema>
export type UpdateServiceInput = z.infer<typeof updateServiceSchema>
