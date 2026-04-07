import { type Router as ExpressRouter, Router } from 'express'
import authRouter from '../modules/auth/auth.router'
import adminRouter from '../modules/admin/admin.router'
import technicianRouter from '../modules/technician/technician.router'
import technicianMeRouter from '../modules/technician/technician-me.router'
import serviceRouter from '../modules/service/service.router'
import clientRouter from '../modules/client/client.router'
import callRouter from '../modules/call/call.router'
import clientMeRouter from '../modules/client/client-me.router'

const router: ExpressRouter = Router()

router.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

router.use('/auth', authRouter)
router.use('/admin/admins', adminRouter)
router.use('/admin/technicians', technicianRouter)
router.use('/admin/services', serviceRouter)
router.use('/admin/clients', clientRouter)
router.use('/admin/calls', callRouter)
router.use('/technician', technicianMeRouter)
router.use('/client', clientMeRouter)

export default router
