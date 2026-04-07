import bcrypt from 'bcryptjs'
import { prisma } from '../../lib/prisma'
import { ConflictError, ForbiddenError, NotFoundError } from '../../lib/errors'
import type {
  ChangeMyClientPasswordInput,
  CreateClientInput,
  CreateMyCallInput,
  SetupClientAccountInput,
  UpdateClientInput,
  UpdateMyClientProfileInput,
} from './client.schema'

const CLIENT_SELECT = {
  id: true,
  avatarUrl: true,
  user: {
    select: { id: true, name: true, email: true, createdAt: true, updatedAt: true },
  },
} as const

const MY_CALL_SELECT = {
  id: true,
  description: true,
  status: true,
  createdAt: true,
  updatedAt: true,
  closedAt: true,
  technician: {
    select: {
      id: true,
      user: { select: { id: true, name: true, email: true } },
    },
  },
  services: { select: { service: { select: { id: true, name: true } } } },
} as const

export async function createClient(input: CreateClientInput) {
  const existing = await prisma.user.findUnique({ where: { email: input.email } })
  if (existing) throw new ConflictError('Email already in use')

  const hashed = await bcrypt.hash(input.password, 10)

  return prisma.client.create({
    data: {
      user: {
        create: {
          name: input.name,
          email: input.email,
          password: hashed,
          role: 'CLIENT',
        },
      },
    },
    select: CLIENT_SELECT,
  })
}

export async function listClients() {
  return prisma.client.findMany({
    select: CLIENT_SELECT,
    orderBy: { user: { createdAt: 'desc' } },
  })
}

export async function getClient(id: string) {
  const client = await prisma.client.findUnique({
    where: { id },
    select: {
      ...CLIENT_SELECT,
      calls: {
        select: {
          id: true,
          description: true,
          status: true,
          createdAt: true,
          services: { select: { service: { select: { id: true, name: true } } } },
        },
        orderBy: { createdAt: 'desc' },
      },
    },
  })
  if (!client) throw new NotFoundError('Client not found')
  return client
}

export async function updateClient(id: string, input: UpdateClientInput) {
  const client = await prisma.client.findUnique({ where: { id }, select: { userId: true } })
  if (!client) throw new NotFoundError('Client not found')

  if (input.email) {
    const conflict = await prisma.user.findFirst({
      where: { email: input.email, NOT: { id: client.userId } },
    })
    if (conflict) throw new ConflictError('Email already in use')
  }

  return prisma.client.update({
    where: { id },
    data: { user: { update: input } },
    select: CLIENT_SELECT,
  })
}

export async function deleteClient(id: string) {
  const client = await prisma.client.findUnique({ where: { id }, select: { userId: true } })
  if (!client) throw new NotFoundError('Client not found')
  await prisma.user.delete({ where: { id: client.userId } })
}

// ─── Self-service helpers ───────────────────────────────────────────────────

export async function getClientByUserId(userId: string) {
  const client = await prisma.client.findUnique({
    where: { userId },
    select: CLIENT_SELECT,
  })
  if (!client) throw new NotFoundError('Client not found')
  return client
}

export async function setupClientAccount(userId: string, input: SetupClientAccountInput) {
  const client = await getClientByUserId(userId)
  if (input.name) {
    await prisma.user.update({ where: { id: client.user.id }, data: { name: input.name } })
  }
  return getClientByUserId(userId)
}

export async function updateMyClientProfile(userId: string, input: UpdateMyClientProfileInput) {
  const client = await getClientByUserId(userId)
  if (input.email) {
    const conflict = await prisma.user.findFirst({
      where: { email: input.email, NOT: { id: client.user.id } },
    })
    if (conflict) throw new ConflictError('Email already in use')
  }
  await prisma.user.update({
    where: { id: client.user.id },
    data: { ...(input.name && { name: input.name }), ...(input.email && { email: input.email }) },
  })
  return getClientByUserId(userId)
}

export async function updateClientAvatar(userId: string, filename: string) {
  const client = await getClientByUserId(userId)
  return prisma.client.update({
    where: { id: client.id },
    data: { avatarUrl: `/uploads/avatars/${filename}` },
    select: CLIENT_SELECT,
  })
}

export async function changeMyClientPassword(userId: string, input: ChangeMyClientPasswordInput) {
  const client = await getClientByUserId(userId)
  const user = await prisma.user.findUnique({ where: { id: client.user.id } })
  const valid = await bcrypt.compare(input.currentPassword, user!.password)
  if (!valid) throw new ForbiddenError('Current password is incorrect')
  const hashed = await bcrypt.hash(input.newPassword, 10)
  await prisma.user.update({ where: { id: client.user.id }, data: { password: hashed } })
}

export async function deleteMyClientAccount(userId: string) {
  const client = await getClientByUserId(userId)
  await prisma.user.delete({ where: { id: client.user.id } })
}

export async function listMyClientCalls(userId: string) {
  const client = await getClientByUserId(userId)
  return prisma.call.findMany({
    where: { clientId: client.id },
    select: MY_CALL_SELECT,
    orderBy: { createdAt: 'desc' },
  })
}

export async function createMyCall(userId: string, input: CreateMyCallInput) {
  const client = await getClientByUserId(userId)
  if (input.technicianId) {
    const tech = await prisma.technician.findUnique({ where: { id: input.technicianId } })
    if (!tech) throw new NotFoundError('Technician not found')
  }
  return prisma.call.create({
    data: {
      description: input.description,
      clientId: client.id,
      technicianId: input.technicianId ?? null,
    },
    select: MY_CALL_SELECT,
  })
}

export async function listAvailableTechnicians() {
  return prisma.technician.findMany({
    select: {
      id: true,
      availableFrom: true,
      availableTo: true,
      avatarUrl: true,
      user: { select: { id: true, name: true, email: true } },
    },
    orderBy: { user: { name: 'asc' } },
  })
}
