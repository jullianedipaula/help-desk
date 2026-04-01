import { type IRouter, Router } from 'express'
import authRouter from './auth'

const router: IRouter = Router()

router.use('/auth', authRouter)

export default router
