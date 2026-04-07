import { type Router as ExpressRouter, Router } from 'express'
import { authenticate, authorize } from '../auth/auth.middleware'
import { updateCallStatusSchema } from './call.schema'
import { getCall, listCalls, updateCallStatus } from './call.service'
import { handleServiceError } from '../../lib/errors'

const router: ExpressRouter = Router()

router.use(authenticate, authorize('ADMIN'))

router.get('/', async (_req, res) => {
  try {
    res.json(await listCalls())
  } catch (err) {
    handleServiceError(err, res)
  }
})

router.get('/:id', async (req, res) => {
  try {
    res.json(await getCall(req.params.id))
  } catch (err) {
    handleServiceError(err, res)
  }
})

router.patch('/:id/status', async (req, res) => {
  const parsed = updateCallStatusSchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ message: 'Validation error', errors: parsed.error.flatten().fieldErrors })
    return
  }
  try {
    res.json(await updateCallStatus(req.params.id, parsed.data))
  } catch (err) {
    handleServiceError(err, res)
  }
})

export default router
