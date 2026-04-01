import express from 'express'
import router from './routes'

const app = express()
const PORT = process.env.PORT ?? 3001

app.use(express.json())
app.use('/api', router)

app.listen(PORT, () => {
  console.log(`API running on http://localhost:${PORT}`)
})
