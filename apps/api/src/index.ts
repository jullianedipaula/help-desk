import 'dotenv/config'
import { env } from './config/env'
import cors from 'cors'
import express from 'express'
import routes from './routes'

const app = express()

app.use(cors())
app.use(express.json())
app.use('/api', routes)

app.listen(env.PORT, () => {
  console.log(`API running on http://localhost:${env.PORT}`)
})
