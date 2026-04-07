import { type Router as ExpressRouter, Router } from 'express'
import { authenticate, authorize } from '../auth/auth.middleware'
import { createTechnicianSchema, updateTechnicianSchema } from './technician.schema'
import {
  createTechnician,
  deleteTechnician,
  getTechnician,
  listTechnicians,
  resetTechnicianPassword,
  updateTechnician,
} from './technician.service'
import { handleServiceError } from '../../lib/errors'

const router: ExpressRouter = Router()

router.use(authenticate, authorize('ADMIN'))

router.post('/', async (req, res) => {
  const parsed = createTechnicianSchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ message: 'Validation error', errors: parsed.error.flatten().fieldErrors })
    return
  }
  try {
    res.status(201).json(await createTechnician(parsed.data))
  } catch (err) {
    handleServiceError(err, res)
  }
})

router.get('/', async (_req, res) => {
  try {
    res.json(await listTechnicians())
  } catch (err) {
    handleServiceError(err, res)
  }
})

router.get('/:id', async (req, res) => {
  try {
    res.json(await getTechnician(req.params.id))
  } catch (err) {
    handleServiceError(err, res)
  }
})

router.patch('/:id', async (req, res) => {
  const parsed = updateTechnicianSchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ message: 'Validation error', errors: parsed.error.flatten().fieldErrors })
    return
  }
  try {
    res.json(await updateTechnician(req.params.id, parsed.data))
  } catch (err) {
    handleServiceError(err, res)
  }
})

router.delete('/:id', async (req, res) => {
  try {
    await deleteTechnician(req.params.id)
    res.status(204).send()
  } catch (err) {
    handleServiceError(err, res)
  }
})

router.post('/:id/reset-password', async (req, res) => {
  try {
    res.json(await resetTechnicianPassword(req.params.id))
  } catch (err) {
    handleServiceError(err, res)
  }
})

export default router
