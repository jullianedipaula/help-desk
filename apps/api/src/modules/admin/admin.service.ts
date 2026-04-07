import bcrypt from 'bcryptjs'
import { prisma } from '../../lib/prisma'
import { ConflictError, ForbiddenError, NotFoundError } from '../../lib/errors'
import type { CreateAdminInput, UpdateAdminInput } from './admin.schema'

const ADMIN_SELECT = {
  id: true,
  name: true,
  email: true,
  role: true,
  createdAt: true,
  updatedAt: true,
} as const

export async function createAdmin(input: CreateAdminInput) {
  const existing = await prisma.user.findUnique({ where: { email: input.email } })
  if (existing) throw new ConflictError('Email already in use')

  const hashed = await bcrypt.hash(input.password, 10)

  return prisma.user.create({
    data: { name: input.name, email: input.email, password: hashed, role: 'ADMIN' },
    select: ADMIN_SELECT,
  })
}

export async function listAdmins() {
  return prisma.user.findMany({
    where: { role: 'ADMIN' },
    select: ADMIN_SELECT,
    orderBy: { createdAt: 'desc' },
  })
}

export async function getAdmin(id: string) {
  const admin = await prisma.user.findFirst({
    where: { id, role: 'ADMIN' },
    select: ADMIN_SELECT,
  })
  if (!admin) throw new NotFoundError('Admin not found')
  return admin
}

export async function updateAdmin(id: string, input: UpdateAdminInput) {
  await getAdmin(id)

  if (input.email) {
    const conflict = await prisma.user.findFirst({ where: { email: input.email, NOT: { id } } })
    if (conflict) throw new ConflictError('Email already in use')
  }

  return prisma.user.update({
    where: { id },
    data: input,
    select: ADMIN_SELECT,
  })
}

export async function deleteAdmin(id: string, requestingUserId: string) {
  await getAdmin(id)
  if (id === requestingUserId) throw new ForbiddenError('Cannot delete your own account')
  await prisma.user.delete({ where: { id } })
}
