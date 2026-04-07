import { z } from 'zod'

export const updateCallStatusSchema = z.object({
  status: z.enum(['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED']),
})

export const addCallServicesSchema = z.object({
  serviceIds: z.string().array().min(1),
})

export const technicianUpdateStatusSchema = z.object({
  status: z.enum(['IN_PROGRESS', 'CLOSED']),
})

export type UpdateCallStatusInput = z.infer<typeof updateCallStatusSchema>
export type AddCallServicesInput = z.infer<typeof addCallServicesSchema>
export type TechnicianUpdateStatusInput = z.infer<typeof technicianUpdateStatusSchema>
