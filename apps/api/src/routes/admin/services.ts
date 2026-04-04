import { eq } from 'drizzle-orm'
import { type IRouter, Router } from 'express'
import { db } from '../../db'
import { services } from '../../db/schema'

const router: IRouter = Router()

// POST /api/admin/services
router.post('/', async (req, res) => {
  const { name, description } = req.body as { name?: string; description?: string }
  if (!name || !description) {
    res.status(400).json({ error: 'VALIDATION_ERROR' })
    return
  }

  const [service] = await db.insert(services).values({ name, description }).returning()
  res.status(201).json(service)
})

// GET /api/admin/services
router.get('/', async (_req, res) => {
  const rows = await db.select().from(services).orderBy(services.name)
  res.json(rows)
})

// PATCH /api/admin/services/:id
router.patch('/:id', async (req, res) => {
  const { id } = req.params
  const { name, description } = req.body as { name?: string; description?: string }

  const [existing] = await db.select().from(services).where(eq(services.id, id)).limit(1)
  if (!existing) {
    res.status(404).json({ error: 'NOT_FOUND' })
    return
  }

  const [updated] = await db
    .update(services)
    .set({
      ...(name && { name }),
      ...(description && { description }),
      updatedAt: new Date(),
    })
    .where(eq(services.id, id))
    .returning()

  res.json(updated)
})

// DELETE /api/admin/services/:id  (soft delete)
router.delete('/:id', async (req, res) => {
  const { id } = req.params

  const [existing] = await db.select().from(services).where(eq(services.id, id)).limit(1)
  if (!existing) {
    res.status(404).json({ error: 'NOT_FOUND' })
    return
  }

  const [updated] = await db
    .update(services)
    .set({ isActive: false, updatedAt: new Date() })
    .where(eq(services.id, id))
    .returning()

  res.json(updated)
})

export default router
