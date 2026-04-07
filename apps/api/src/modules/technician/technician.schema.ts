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

export type CreateTechnicianInput = z.infer<typeof createTechnicianSchema>
export type UpdateTechnicianInput = z.infer<typeof updateTechnicianSchema>
