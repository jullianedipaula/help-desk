import 'dotenv/config'
import { env } from './config/env'
import cors from 'cors'
import express from 'express'
import path from 'node:path'
import routes from './routes'

const app = express()

app.use(cors())
app.use(express.json())
app.use('/uploads', express.static(path.join(__dirname, '../uploads')))
app.use('/api', routes)

app.listen(env.PORT, () => {
  console.log(`API running on http://localhost:${env.PORT}`)
})
