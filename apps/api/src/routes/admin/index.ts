import { type IRouter, Router } from 'express'
import { requireRole } from '../../middlewares/auth'
import clientsRouter from './clients'
import servicesRouter from './services'
import techniciansRouter from './technicians'
import ticketsRouter from './tickets'

const router: IRouter = Router()

router.use(requireRole('admin'))

router.use('/technicians', techniciansRouter)
router.use('/services', servicesRouter)
router.use('/clients', clientsRouter)
router.use('/tickets', ticketsRouter)

export default router
