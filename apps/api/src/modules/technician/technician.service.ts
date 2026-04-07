import bcrypt from 'bcryptjs'
import { randomBytes } from 'node:crypto'
import { prisma } from '../../lib/prisma'
import { ConflictError, ForbiddenError, NotFoundError } from '../../lib/errors'
import type {
  ChangeMyPasswordInput,
  CreateTechnicianInput,
  SetupAccountInput,
  UpdateAvailabilityInput,
  UpdateMyProfileInput,
  UpdateTechnicianInput,
} from './technician.schema'

const TECHNICIAN_SELECT = {
  id: true,
  availableFrom: true,
  availableTo: true,
  mustChangePassword: true,
  avatarUrl: true,
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

// ─── Self-service helpers ───────────────────────────────────────────────────

export async function getTechnicianByUserId(userId: string) {
  const technician = await prisma.technician.findUnique({
    where: { userId },
    select: TECHNICIAN_SELECT,
  })
  if (!technician) throw new NotFoundError('Technician not found')
  return technician
}

export async function setupAccount(userId: string, input: SetupAccountInput) {
  const tech = await getTechnicianByUserId(userId)
  const hashed = await bcrypt.hash(input.password, 10)

  await prisma.$transaction([
    prisma.user.update({
      where: { id: tech.user.id },
      data: { password: hashed, ...(input.name && { name: input.name }) },
    }),
    prisma.technician.update({
      where: { userId },
      data: { mustChangePassword: false },
    }),
  ])

  return getTechnicianByUserId(userId)
}

export async function updateMyProfile(userId: string, input: UpdateMyProfileInput) {
  const tech = await getTechnicianByUserId(userId)

  if (input.email) {
    const conflict = await prisma.user.findFirst({
      where: { email: input.email, NOT: { id: tech.user.id } },
    })
    if (conflict) throw new ConflictError('Email already in use')
  }

  await prisma.user.update({
    where: { id: tech.user.id },
    data: { ...(input.name && { name: input.name }), ...(input.email && { email: input.email }) },
  })

  return getTechnicianByUserId(userId)
}

export async function updateAvatar(userId: string, filename: string) {
  const tech = await getTechnicianByUserId(userId)
  return prisma.technician.update({
    where: { id: tech.id },
    data: { avatarUrl: `/uploads/avatars/${filename}` },
    select: TECHNICIAN_SELECT,
  })
}

export async function changeMyPassword(userId: string, input: ChangeMyPasswordInput) {
  const tech = await getTechnicianByUserId(userId)
  const user = await prisma.user.findUnique({ where: { id: tech.user.id } })

  const valid = await bcrypt.compare(input.currentPassword, user!.password)
  if (!valid) throw new ForbiddenError('Current password is incorrect')

  const hashed = await bcrypt.hash(input.newPassword, 10)
  await prisma.user.update({ where: { id: tech.user.id }, data: { password: hashed } })
}

export async function updateAvailability(userId: string, input: UpdateAvailabilityInput) {
  const tech = await getTechnicianByUserId(userId)
  return prisma.technician.update({
    where: { id: tech.id },
    data: { availableFrom: input.availableFrom, availableTo: input.availableTo },
    select: TECHNICIAN_SELECT,
  })
}

export async function listMyCalls(userId: string) {
  const tech = await getTechnicianByUserId(userId)
  return prisma.call.findMany({
    where: { technicianId: tech.id },
    select: {
      id: true,
      description: true,
      status: true,
      createdAt: true,
      updatedAt: true,
      closedAt: true,
      client: { select: { id: true, user: { select: { id: true, name: true, email: true } } } },
      services: { select: { service: { select: { id: true, name: true } } } },
    },
    orderBy: { createdAt: 'desc' },
  })
}
