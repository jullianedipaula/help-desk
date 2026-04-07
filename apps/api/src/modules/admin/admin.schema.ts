import { z } from 'zod'

export const createAdminSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8),
})

export const updateAdminSchema = z.object({
  name: z.string().min(2).optional(),
  email: z.string().email().optional(),
})

export type CreateAdminInput = z.infer<typeof createAdminSchema>
export type UpdateAdminInput = z.infer<typeof updateAdminSchema>
