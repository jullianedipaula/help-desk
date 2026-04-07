import { type Router as ExpressRouter, Router } from 'express'
import { authenticate, authorize } from '../auth/auth.middleware'
import {
  changeMyPasswordSchema,
  setupAccountSchema,
  updateAvailabilitySchema,
  updateMyProfileSchema,
} from './technician.schema'
import {
  changeMyPassword,
  getTechnicianByUserId,
  listMyCalls,
  setupAccount,
  updateAvailability,
  updateAvatar,
  updateMyProfile,
} from './technician.service'
import { addCallServices, updateCallStatusAsTechnician } from '../call/call.service'
import { addCallServicesSchema, technicianUpdateStatusSchema } from '../call/call.schema'
import { avatarUpload } from '../../lib/upload'
import { handleServiceError } from '../../lib/errors'

const router: ExpressRouter = Router()

router.use(authenticate, authorize('TECHNICIAN'))

router.post('/me/setup', async (req, res) => {
  const parsed = setupAccountSchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ message: 'Validation error', errors: parsed.error.flatten().fieldErrors })
    return
  }
  try {
    res.json(await setupAccount(req.user!.id, parsed.data))
  } catch (err) {
    handleServiceError(err, res)
  }
})

router.get('/me', async (req, res) => {
  try {
    res.json(await getTechnicianByUserId(req.user!.id))
  } catch (err) {
    handleServiceError(err, res)
  }
})

router.patch('/me', async (req, res) => {
  const parsed = updateMyProfileSchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ message: 'Validation error', errors: parsed.error.flatten().fieldErrors })
    return
  }
  try {
    res.json(await updateMyProfile(req.user!.id, parsed.data))
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
    res.json(await updateAvatar(req.user!.id, req.file.filename))
  } catch (err) {
    handleServiceError(err, res)
  }
})

router.patch('/me/password', async (req, res) => {
  const parsed = changeMyPasswordSchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ message: 'Validation error', errors: parsed.error.flatten().fieldErrors })
    return
  }
  try {
    await changeMyPassword(req.user!.id, parsed.data)
    res.json({ message: 'Password updated' })
  } catch (err) {
    handleServiceError(err, res)
  }
})

router.patch('/me/availability', async (req, res) => {
  const parsed = updateAvailabilitySchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ message: 'Validation error', errors: parsed.error.flatten().fieldErrors })
    return
  }
  try {
    res.json(await updateAvailability(req.user!.id, parsed.data))
  } catch (err) {
    handleServiceError(err, res)
  }
})

router.get('/me/calls', async (req, res) => {
  try {
    res.json(await listMyCalls(req.user!.id))
  } catch (err) {
    handleServiceError(err, res)
  }
})

router.post('/me/calls/:callId/services', async (req, res) => {
  const parsed = addCallServicesSchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ message: 'Validation error', errors: parsed.error.flatten().fieldErrors })
    return
  }
  try {
    res.json(await addCallServices(req.user!.id, req.params.callId, parsed.data))
  } catch (err) {
    handleServiceError(err, res)
  }
})

router.patch('/me/calls/:callId/status', async (req, res) => {
  const parsed = technicianUpdateStatusSchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ message: 'Validation error', errors: parsed.error.flatten().fieldErrors })
    return
  }
  try {
    res.json(await updateCallStatusAsTechnician(req.user!.id, req.params.callId, parsed.data))
  } catch (err) {
    handleServiceError(err, res)
  }
})

export default router
