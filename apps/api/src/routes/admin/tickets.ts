import { eq } from 'drizzle-orm'
import { type IRouter, Router } from 'express'
import { db } from '../../db'
import { services, tickets, users } from '../../db/schema'

const router: IRouter = Router()

// GET /api/admin/tickets
router.get('/', async (_req, res) => {
  const clientUser = db.$with('client_user').as(
    db.select({ id: users.id, name: users.name, email: users.email }).from(users)
  )

  const rows = await db
    .select({
      id: tickets.id,
      title: tickets.title,
      description: tickets.description,
      status: tickets.status,
      serviceId: tickets.serviceId,
      serviceName: services.name,
      clientId: tickets.clientId,
      technicianId: tickets.technicianId,
      createdAt: tickets.createdAt,
      updatedAt: tickets.updatedAt,
    })
    .from(tickets)
    .innerJoin(services, eq(tickets.serviceId, services.id))
    .orderBy(tickets.createdAt)

  res.json(rows)
})

// PATCH /api/admin/tickets/:id/status
router.patch('/:id/status', async (req, res) => {
  const { id } = req.params
  const { status } = req.body as { status?: 'open' | 'in_progress' | 'closed' }

  if (!status || !['open', 'in_progress', 'closed'].includes(status)) {
    res.status(400).json({ error: 'VALIDATION_ERROR' })
    return
  }

  const [existing] = await db.select().from(tickets).where(eq(tickets.id, id)).limit(1)
  if (!existing) {
    res.status(404).json({ error: 'NOT_FOUND' })
    return
  }

  const [updated] = await db
    .update(tickets)
    .set({ status, updatedAt: new Date() })
    .where(eq(tickets.id, id))
    .returning()

  res.json(updated)
})

export default router
