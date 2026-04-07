import { prisma } from '../../lib/prisma'
import { NotFoundError } from '../../lib/errors'
import type { UpdateCallStatusInput } from './call.schema'

const CALL_SELECT = {
  id: true,
  description: true,
  status: true,
  createdAt: true,
  updatedAt: true,
  closedAt: true,
  client: {
    select: {
      id: true,
      user: { select: { id: true, name: true, email: true } },
    },
  },
  technician: {
    select: {
      id: true,
      user: { select: { id: true, name: true, email: true } },
    },
  },
  service: { select: { id: true, name: true, isActive: true } },
} as const

export async function listCalls() {
  return prisma.call.findMany({
    select: CALL_SELECT,
    orderBy: { createdAt: 'desc' },
  })
}

export async function getCall(id: string) {
  const call = await prisma.call.findUnique({ where: { id }, select: CALL_SELECT })
  if (!call) throw new NotFoundError('Call not found')
  return call
}

export async function updateCallStatus(id: string, input: UpdateCallStatusInput) {
  const call = await prisma.call.findUnique({ where: { id }, select: { id: true, status: true } })
  if (!call) throw new NotFoundError('Call not found')

  const closedAt =
    (input.status === 'RESOLVED' || input.status === 'CLOSED') ? new Date() : null

  return prisma.call.update({
    where: { id },
    data: {
      status: input.status,
      ...(closedAt ? { closedAt } : {}),
    },
    select: CALL_SELECT,
  })
}
