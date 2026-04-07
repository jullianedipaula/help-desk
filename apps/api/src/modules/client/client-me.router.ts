import { type Router as ExpressRouter, Router } from 'express'
import { authenticate, authorize } from '../auth/auth.middleware'
import {
  changeMyClientPasswordSchema,
  createMyCallSchema,
  setupClientAccountSchema,
  updateMyClientProfileSchema,
} from './client.schema'
import {
  changeMyClientPassword,
  createMyCall,
  deleteMyClientAccount,
  getClientByUserId,
  listAvailableTechnicians,
  listMyClientCalls,
  setupClientAccount,
  updateClientAvatar,
  updateMyClientProfile,
} from './client.service'
import { avatarUpload } from '../../lib/upload'
import { handleServiceError } from '../../lib/errors'

const router: ExpressRouter = Router()

router.use(authenticate, authorize('CLIENT'))

router.post('/me/setup', async (req, res) => {
  const parsed = setupClientAccountSchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ message: 'Validation error', errors: parsed.error.flatten().fieldErrors })
    return
  }
  try {
    res.json(await setupClientAccount(req.user!.id, parsed.data))
  } catch (err) {
    handleServiceError(err, res)
  }
})

router.get('/me', async (req, res) => {
  try {
    res.json(await getClientByUserId(req.user!.id))
  } catch (err) {
    handleServiceError(err, res)
  }
})

router.patch('/me', async (req, res) => {
  const parsed = updateMyClientProfileSchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ message: 'Validation error', errors: parsed.error.flatten().fieldErrors })
    return
  }
  try {
    res.json(await updateMyClientProfile(req.user!.id, parsed.data))
  } catch (err) {
    handleServiceError(err, res)
  }
})

router.delete('/me', async (req, res) => {
  try {
    await deleteMyClientAccount(req.user!.id)
    res.status(204).send()
  } catch (err) {
    handleServiceError(err, res)
  }
})

router.post('/me/avatar', avatarUpload.single('avatar'), async (req, res) => {
  if (!req.file) {
    res.status(400).json({ message: 'No file uploaded or invalid file type' })
    return
  }
  try {
    res.json(await updateClientAvatar(req.user!.id, req.file.filename))
  } catch (err) {
    handleServiceError(err, res)
  }
})

router.patch('/me/password', async (req, res) => {
  const parsed = changeMyClientPasswordSchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ message: 'Validation error', errors: parsed.error.flatten().fieldErrors })
    return
  }
  try {
    await changeMyClientPassword(req.user!.id, parsed.data)
    res.json({ message: 'Password updated' })
  } catch (err) {
    handleServiceError(err, res)
  }
})

router.get('/me/calls', async (req, res) => {
  try {
    res.json(await listMyClientCalls(req.user!.id))
  } catch (err) {
    handleServiceError(err, res)
  }
})

router.post('/me/calls', async (req, res) => {
  const parsed = createMyCallSchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ message: 'Validation error', errors: parsed.error.flatten().fieldErrors })
    return
  }
  try {
    res.status(201).json(await createMyCall(req.user!.id, parsed.data))
  } catch (err) {
    handleServiceError(err, res)
  }
})

router.get('/technicians', async (_req, res) => {
  try {
    res.json(await listAvailableTechnicians())
  } catch (err) {
    handleServiceError(err, res)
  }
})

export default router
