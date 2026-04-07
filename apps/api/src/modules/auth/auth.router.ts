import { type Router as ExpressRouter, Router } from 'express'
import { authenticate } from './auth.middleware'
import { changePasswordSchema, loginSchema, registerSchema } from './auth.schema'
import { changePassword, login, register } from './auth.service'
import { handleServiceError } from '../../lib/errors'

const router: ExpressRouter = Router()

router.post('/register', async (req, res) => {
  const parsed = registerSchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ message: 'Validation error', errors: parsed.error.flatten().fieldErrors })
    return
  }

  try {
    const user = await register(parsed.data)
    res.status(201).json(user)
  } catch (err) {
    handleServiceError(err, res)
  }
})

router.post('/login', async (req, res) => {
  const parsed = loginSchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ message: 'Validation error', errors: parsed.error.flatten().fieldErrors })
    return
  }

  try {
    const result = await login(parsed.data)
    res.json(result)
  } catch (err) {
    res.status(401).json({ message: err instanceof Error ? err.message : 'Login failed' })
  }
})

router.patch('/change-password', authenticate, async (req, res) => {
  const parsed = changePasswordSchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ message: 'Validation error', errors: parsed.error.flatten().fieldErrors })
    return
  }

  try {
    const result = await changePassword(req.user!.id, parsed.data)
    res.json(result)
  } catch (err) {
    res.status(401).json({ message: err instanceof Error ? err.message : 'Password change failed' })
  }
})

export default router
