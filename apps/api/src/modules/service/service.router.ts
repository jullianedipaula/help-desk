import { type Router as ExpressRouter, Router } from 'express'
import { authenticate, authorize } from '../auth/auth.middleware'
import { createServiceSchema, updateServiceSchema } from './service.schema'
import {
  createService,
  getService,
  listServices,
  softDeleteService,
  updateService,
} from './service.service'
import { handleServiceError } from '../../lib/errors'

const router: ExpressRouter = Router()

router.use(authenticate, authorize('ADMIN'))

router.post('/', async (req, res) => {
  const parsed = createServiceSchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ message: 'Validation error', errors: parsed.error.flatten().fieldErrors })
    return
  }
  try {
    res.status(201).json(await createService(parsed.data))
  } catch (err) {
    handleServiceError(err, res)
  }
})

router.get('/', async (_req, res) => {
  try {
    res.json(await listServices())
  } catch (err) {
    handleServiceError(err, res)
  }
})

router.get('/:id', async (req, res) => {
  try {
    res.json(await getService(req.params.id))
  } catch (err) {
    handleServiceError(err, res)
  }
})

router.patch('/:id', async (req, res) => {
  const parsed = updateServiceSchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ message: 'Validation error', errors: parsed.error.flatten().fieldErrors })
    return
  }
  try {
    res.json(await updateService(req.params.id, parsed.data))
  } catch (err) {
    handleServiceError(err, res)
  }
})

router.delete('/:id', async (req, res) => {
  try {
    res.json(await softDeleteService(req.params.id))
  } catch (err) {
    handleServiceError(err, res)
  }
})

export default router
