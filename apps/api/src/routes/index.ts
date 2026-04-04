import { type IRouter, Router } from 'express'
import adminRouter from './admin'
import authRouter from './auth'

const router: IRouter = Router()

router.use('/auth', authRouter)
router.use('/admin', adminRouter)

export default router
