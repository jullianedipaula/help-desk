import { z } from 'zod'

export const createClientSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8),
})

export const updateClientSchema = z.object({
  name: z.string().min(2).optional(),
  email: z.string().email().optional(),
})

export const setupClientAccountSchema = z.object({
  name: z.string().min(2).optional(),
})

export const updateMyClientProfileSchema = z
  .object({
    name: z.string().min(2).optional(),
    email: z.string().email().optional(),
  })
  .refine((d) => d.name !== undefined || d.email !== undefined, {
    message: 'At least one field must be provided',
  })

export const changeMyClientPasswordSchema = z.object({
  currentPassword: z.string(),
  newPassword: z.string().min(8),
})

export const createMyCallSchema = z.object({
  description: z.string().min(10),
  technicianId: z.string().cuid().optional(),
  serviceIds: z.array(z.string().cuid()).min(1).optional(),
})

export type CreateClientInput = z.infer<typeof createClientSchema>
export type UpdateClientInput = z.infer<typeof updateClientSchema>
export type SetupClientAccountInput = z.infer<typeof setupClientAccountSchema>
export type UpdateMyClientProfileInput = z.infer<typeof updateMyClientProfileSchema>
export type ChangeMyClientPasswordInput = z.infer<typeof changeMyClientPasswordSchema>
export type CreateMyCallInput = z.infer<typeof createMyCallSchema>
