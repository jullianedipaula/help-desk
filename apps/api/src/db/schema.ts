import { boolean, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core'

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  role: text('role', { enum: ['admin', 'technician', 'client'] })
    .notNull()
    .default('client'),
  mustChangePassword: boolean('must_change_password').notNull().default(false),
  createdAt: timestamp('created_at').notNull().defaultNow(),
})

export const technicians = pgTable('technicians', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .notNull()
    .unique()
    .references(() => users.id, { onDelete: 'cascade' }),
  availabilitySlots: text('availability_slots')
    .array()
    .notNull()
    .default(['08:00', '09:00', '10:00', '11:00', '14:00', '15:00', '16:00', '17:00']),
  createdAt: timestamp('created_at').notNull().defaultNow(),
})

export const clients = pgTable('clients', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .notNull()
    .unique()
    .references(() => users.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at').notNull().defaultNow(),
})

export const services = pgTable('services', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  description: text('description').notNull(),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
})

export const tickets = pgTable('tickets', {
  id: uuid('id').primaryKey().defaultRandom(),
  title: text('title').notNull(),
  description: text('description').notNull(),
  status: text('status', { enum: ['open', 'in_progress', 'closed'] })
    .notNull()
    .default('open'),
  serviceId: uuid('service_id')
    .notNull()
    .references(() => services.id),
  clientId: uuid('client_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  technicianId: uuid('technician_id').references(() => users.id),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
})
