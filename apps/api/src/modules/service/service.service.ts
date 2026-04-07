import { prisma } from '../../lib/prisma'
import { NotFoundError } from '../../lib/errors'
import type { CreateServiceInput, UpdateServiceInput } from './service.schema'

const SERVICE_SELECT = {
  id: true,
  name: true,
  description: true,
  isActive: true,
  createdAt: true,
  updatedAt: true,
} as const

export async function createService(input: CreateServiceInput) {
  return prisma.service.create({
    data: input,
    select: SERVICE_SELECT,
  })
}

export async function listServices() {
  return prisma.service.findMany({
    select: SERVICE_SELECT,
    orderBy: { createdAt: 'desc' },
  })
}

export async function getService(id: string) {
  const service = await prisma.service.findUnique({
    where: { id },
    select: SERVICE_SELECT,
  })
  if (!service) throw new NotFoundError('Service not found')
  return service
}

export async function updateService(id: string, input: UpdateServiceInput) {
  await getService(id)
  return prisma.service.update({
    where: { id },
    data: input,
    select: SERVICE_SELECT,
  })
}

export async function softDeleteService(id: string) {
  await getService(id)
  return prisma.service.update({
    where: { id },
    data: { isActive: false },
    select: SERVICE_SELECT,
  })
}
