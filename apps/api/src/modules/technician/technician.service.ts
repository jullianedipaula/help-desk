import bcrypt from 'bcryptjs'
import { randomBytes } from 'node:crypto'
import { prisma } from '../../lib/prisma'
import { ConflictError, NotFoundError } from '../../lib/errors'
import type { CreateTechnicianInput, UpdateTechnicianInput } from './technician.schema'

const TECHNICIAN_SELECT = {
  id: true,
  availableFrom: true,
  availableTo: true,
  mustChangePassword: true,
  createdAt: true,
  updatedAt: true,
  user: {
    select: { id: true, name: true, email: true },
  },
} as const

function generateTempPassword(): string {
  return randomBytes(9).toString('base64url').slice(0, 12)
}

export async function createTechnician(input: CreateTechnicianInput) {
  const existing = await prisma.user.findUnique({ where: { email: input.email } })
  if (existing) throw new ConflictError('Email already in use')

  const tempPassword = generateTempPassword()
  const hashed = await bcrypt.hash(tempPassword, 10)

  const technician = await prisma.technician.create({
    data: {
      availableFrom: input.availableFrom,
      availableTo: input.availableTo,
      mustChangePassword: true,
      user: {
        create: {
          name: input.name,
          email: input.email,
          password: hashed,
          role: 'TECHNICIAN',
        },
      },
    },
    select: TECHNICIAN_SELECT,
  })

  return { ...technician, tempPassword }
}

export async function listTechnicians() {
  return prisma.technician.findMany({
    select: TECHNICIAN_SELECT,
    orderBy: { createdAt: 'desc' },
  })
}

export async function getTechnician(id: string) {
  const technician = await prisma.technician.findUnique({
    where: { id },
    select: TECHNICIAN_SELECT,
  })
  if (!technician) throw new NotFoundError('Technician not found')
  return technician
}

export async function updateTechnician(id: string, input: UpdateTechnicianInput) {
  await getTechnician(id)

  if (input.email) {
    const tech = await prisma.technician.findUnique({ where: { id }, select: { userId: true } })
    const conflict = await prisma.user.findFirst({
      where: { email: input.email, NOT: { id: tech?.userId } },
    })
    if (conflict) throw new ConflictError('Email already in use')
  }

  const { name, email, ...profileData } = input

  return prisma.technician.update({
    where: { id },
    data: {
      ...profileData,
      ...(name || email ? { user: { update: { ...(name && { name }), ...(email && { email }) } } } : {}),
    },
    select: TECHNICIAN_SELECT,
  })
}

export async function deleteTechnician(id: string) {
  const technician = await getTechnician(id)
  await prisma.user.delete({ where: { id: technician.user.id } })
}

export async function resetTechnicianPassword(id: string) {
  await getTechnician(id)

  const tempPassword = generateTempPassword()
  const hashed = await bcrypt.hash(tempPassword, 10)

  const tech = await prisma.technician.findUnique({ where: { id }, select: { userId: true } })

  await prisma.user.update({ where: { id: tech!.userId }, data: { password: hashed } })
  await prisma.technician.update({ where: { id }, data: { mustChangePassword: true } })

  return { tempPassword }
}
