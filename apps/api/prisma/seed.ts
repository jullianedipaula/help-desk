import { PrismaClient } from '../src/generated/prisma'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('Seeding database...')

  // Admin
  const adminPassword = await bcrypt.hash('Admin1234!', 10)
  const admin = await prisma.user.upsert({
    where: { email: 'admin@helpdesk.local' },
    update: {},
    create: {
      name: 'Administrator',
      email: 'admin@helpdesk.local',
      password: adminPassword,
      role: 'ADMIN',
    },
  })
  console.log(`Admin created: ${admin.email}`)

  // Services
  const services = await Promise.all([
    prisma.service.upsert({
      where: { id: 'seed-service-1' },
      update: {},
      create: { id: 'seed-service-1', name: 'General Support', description: 'General IT support', isActive: true },
    }),
    prisma.service.upsert({
      where: { id: 'seed-service-2' },
      update: {},
      create: { id: 'seed-service-2', name: 'Hardware Repair', description: 'Physical hardware repair', isActive: true },
    }),
  ])
  console.log(`Services created: ${services.map((s) => s.name).join(', ')}`)

  console.log('Seed complete.')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
