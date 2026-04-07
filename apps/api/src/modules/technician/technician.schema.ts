import { z } from 'zod'

export const createTechnicianSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  availableFrom: z.number().int().min(0).max(23).default(8),
  availableTo: z.number().int().min(0).max(23).default(17),
})

export const updateTechnicianSchema = z.object({
  name: z.string().min(2).optional(),
  email: z.string().email().optional(),
  availableFrom: z.number().int().min(0).max(23).optional(),
  availableTo: z.number().int().min(0).max(23).optional(),
})

export const setupAccountSchema = z.object({
  password: z.string().min(8),
  name: z.string().min(2).optional(),
})

export const updateMyProfileSchema = z
  .object({
    name: z.string().min(2).optional(),
    email: z.string().email().optional(),
  })
  .refine((d) => d.name !== undefined || d.email !== undefined, {
    message: 'At least one field must be provided',
  })

export const changeMyPasswordSchema = z.object({
  currentPassword: z.string(),
  newPassword: z.string().min(8),
})

export const updateAvailabilitySchema = z
  .object({
    availableFrom: z.number().int().min(0).max(23),
    availableTo: z.number().int().min(1).max(24),
  })
  .refine((d) => d.availableFrom < d.availableTo, {
    message: 'availableFrom must be less than availableTo',
  })

export type CreateTechnicianInput = z.infer<typeof createTechnicianSchema>
export type UpdateTechnicianInput = z.infer<typeof updateTechnicianSchema>
export type SetupAccountInput = z.infer<typeof setupAccountSchema>
export type UpdateMyProfileInput = z.infer<typeof updateMyProfileSchema>
export type ChangeMyPasswordInput = z.infer<typeof changeMyPasswordSchema>
export type UpdateAvailabilityInput = z.infer<typeof updateAvailabilitySchema>
