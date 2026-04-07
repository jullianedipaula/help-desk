import { type Router as ExpressRouter, Router } from 'express'
import { authenticate, authorize } from '../auth/auth.middleware'
import { createAdminSchema, updateAdminSchema } from './admin.schema'
import { createAdmin, deleteAdmin, getAdmin, listAdmins, updateAdmin } from './admin.service'
import { handleServiceError } from '../../lib/errors'

const router: ExpressRouter = Router()

router.use(authenticate, authorize('ADMIN'))

router.post('/', async (req, res) => {
  const parsed = createAdminSchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ message: 'Validation error', errors: parsed.error.flatten().fieldErrors })
    return
  }
  try {
    const admin = await createAdmin(parsed.data)
    res.status(201).json(admin)
  } catch (err) {
    handleServiceError(err, res)
  }
})

router.get('/', async (_req, res) => {
  try {
    res.json(await listAdmins())
  } catch (err) {
    handleServiceError(err, res)
  }
})

router.get('/:id', async (req, res) => {
  try {
    res.json(await getAdmin(req.params.id))
  } catch (err) {
    handleServiceError(err, res)
  }
})

router.patch('/:id', async (req, res) => {
  const parsed = updateAdminSchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ message: 'Validation error', errors: parsed.error.flatten().fieldErrors })
    return
  }
  try {
    res.json(await updateAdmin(req.params.id, parsed.data))
  } catch (err) {
    handleServiceError(err, res)
  }
})

router.delete('/:id', async (req, res) => {
  try {
    await deleteAdmin(req.params.id, req.user!.id)
    res.status(204).send()
  } catch (err) {
    handleServiceError(err, res)
  }
})

export default router
