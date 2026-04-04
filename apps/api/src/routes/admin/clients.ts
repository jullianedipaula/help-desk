import { eq } from 'drizzle-orm'
import { type IRouter, Router } from 'express'
import { db } from '../../db'
import { clients, tickets, users } from '../../db/schema'

const router: IRouter = Router()

// GET /api/admin/clients
router.get('/', async (_req, res) => {
  const rows = await db
    .select({
      id: clients.id,
      userId: users.id,
      name: users.name,
      email: users.email,
      createdAt: clients.createdAt,
    })
    .from(clients)
    .innerJoin(users, eq(clients.userId, users.id))

  res.json(rows)
})

// PATCH /api/admin/clients/:id
router.patch('/:id', async (req, res) => {
  const { id } = req.params
  const { name, email } = req.body as { name?: string; email?: string }

  const [client] = await db.select().from(clients).where(eq(clients.id, id)).limit(1)
  if (!client) {
    res.status(404).json({ error: 'NOT_FOUND' })
    return
  }

  if (email) {
    const conflict = await db.select().from(users).where(eq(users.email, email)).limit(1)
    if (conflict.length > 0 && conflict[0].id !== client.userId) {
      res.status(409).json({ error: 'EMAIL_ALREADY_EXISTS' })
      return
    }
  }

  await db
    .update(users)
    .set({ ...(name && { name }), ...(email && { email }) })
    .where(eq(users.id, client.userId))

  const [updated] = await db
    .select({
      id: clients.id,
      userId: users.id,
      name: users.name,
      email: users.email,
      createdAt: clients.createdAt,
    })
    .from(clients)
    .innerJoin(users, eq(clients.userId, users.id))
    .where(eq(clients.id, id))
    .limit(1)

  res.json(updated)
})

// DELETE /api/admin/clients/:id
// Deletes all tickets for this client, then the client profile, then the user account
router.delete('/:id', async (req, res) => {
  const { id } = req.params

  const [client] = await db.select().from(clients).where(eq(clients.id, id)).limit(1)
  if (!client) {
    res.status(404).json({ error: 'NOT_FOUND' })
    return
  }

  // tickets.clientId references users.id with onDelete cascade,
  // so deleting the user cascades to tickets and clients automatically
  await db.delete(users).where(eq(users.id, client.userId))

  res.status(204).send()
})

export default router
