import bcrypt from 'bcrypt'
import { eq } from 'drizzle-orm'
import { type IRouter, Router } from 'express'
import { db } from '../../db'
import { technicians, users } from '../../db/schema'

const router: IRouter = Router()

const BCRYPT_ROUNDS = 12
const DEFAULT_SLOTS = ['08:00', '09:00', '10:00', '11:00', '14:00', '15:00', '16:00', '17:00']

function generateProvisionalPassword(): string {
  const chars = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789'
  let pwd = 'Tmp@'
  for (let i = 0; i < 8; i++) {
    pwd += chars[Math.floor(Math.random() * chars.length)]
  }
  return pwd
}

// POST /api/admin/technicians
router.post('/', async (req, res) => {
  const { name, email } = req.body as { name?: string; email?: string }
  if (!name || !email) {
    res.status(400).json({ error: 'VALIDATION_ERROR' })
    return
  }

  const existing = await db.select().from(users).where(eq(users.email, email)).limit(1)
  if (existing.length > 0) {
    res.status(409).json({ error: 'EMAIL_ALREADY_EXISTS' })
    return
  }

  const provisionalPassword = generateProvisionalPassword()
  const passwordHash = await bcrypt.hash(provisionalPassword, BCRYPT_ROUNDS)

  const [user] = await db
    .insert(users)
    .values({ name, email, passwordHash, role: 'technician', mustChangePassword: true })
    .returning()

  const [technician] = await db
    .insert(technicians)
    .values({ userId: user.id, availabilitySlots: DEFAULT_SLOTS })
    .returning()

  res.status(201).json({
    id: technician.id,
    userId: user.id,
    name: user.name,
    email: user.email,
    availabilitySlots: technician.availabilitySlots,
    provisionalPassword,
  })
})

// GET /api/admin/technicians
router.get('/', async (_req, res) => {
  const rows = await db
    .select({
      id: technicians.id,
      userId: users.id,
      name: users.name,
      email: users.email,
      availabilitySlots: technicians.availabilitySlots,
      mustChangePassword: users.mustChangePassword,
      createdAt: technicians.createdAt,
    })
    .from(technicians)
    .innerJoin(users, eq(technicians.userId, users.id))

  res.json(rows)
})

// PATCH /api/admin/technicians/:id
router.patch('/:id', async (req, res) => {
  const { id } = req.params
  const { name, email, availabilitySlots } = req.body as {
    name?: string
    email?: string
    availabilitySlots?: string[]
  }

  const [tech] = await db.select().from(technicians).where(eq(technicians.id, id)).limit(1)
  if (!tech) {
    res.status(404).json({ error: 'NOT_FOUND' })
    return
  }

  if (name || email) {
    if (email) {
      const conflict = await db
        .select()
        .from(users)
        .where(eq(users.email, email))
        .limit(1)
      if (conflict.length > 0 && conflict[0].id !== tech.userId) {
        res.status(409).json({ error: 'EMAIL_ALREADY_EXISTS' })
        return
      }
    }
    await db
      .update(users)
      .set({ ...(name && { name }), ...(email && { email }) })
      .where(eq(users.id, tech.userId))
  }

  if (availabilitySlots) {
    await db
      .update(technicians)
      .set({ availabilitySlots })
      .where(eq(technicians.id, id))
  }

  const [updated] = await db
    .select({
      id: technicians.id,
      userId: users.id,
      name: users.name,
      email: users.email,
      availabilitySlots: technicians.availabilitySlots,
      mustChangePassword: users.mustChangePassword,
    })
    .from(technicians)
    .innerJoin(users, eq(technicians.userId, users.id))
    .where(eq(technicians.id, id))
    .limit(1)

  res.json(updated)
})

export default router
