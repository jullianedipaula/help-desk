import bcrypt from 'bcryptjs'
import { prisma } from '../../lib/prisma'
import { ConflictError, NotFoundError } from '../../lib/errors'
import type { CreateClientInput, UpdateClientInput } from './client.schema'

const CLIENT_SELECT = {
  id: true,
  user: {
    select: { id: true, name: true, email: true, createdAt: true, updatedAt: true },
  },
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
