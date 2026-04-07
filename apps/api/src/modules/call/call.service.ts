import { prisma } from '../../lib/prisma'
import { ForbiddenError, NotFoundError } from '../../lib/errors'
import type { AddCallServicesInput, TechnicianUpdateStatusInput, UpdateCallStatusInput } from './call.schema'
import { getTechnicianByUserId } from '../technician/technician.service'

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
  services: { select: { service: { select: { id: true, name: true, isActive: true } } } },
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
    input.status === 'RESOLVED' || input.status === 'CLOSED' ? new Date() : null

  return prisma.call.update({
    where: { id },
    data: {
      status: input.status,
      ...(closedAt ? { closedAt } : {}),
    },
    select: CALL_SELECT,
  })
}

export async function addCallServices(
  technicianUserId: string,
  callId: string,
  input: AddCallServicesInput,
) {
  const tech = await getTechnicianByUserId(technicianUserId)
  const call = await prisma.call.findUnique({ where: { id: callId }, select: { id: true, technicianId: true } })
  if (!call) throw new NotFoundError('Call not found')
  if (call.technicianId !== tech.id) throw new ForbiddenError('Call not assigned to you')

  const services = await prisma.service.findMany({
    where: { id: { in: input.serviceIds }, isActive: true },
    select: { id: true },
  })
  if (services.length !== input.serviceIds.length) {
    throw new NotFoundError('One or more services not found or inactive')
  }

  await prisma.callService.createMany({
    data: input.serviceIds.map((serviceId) => ({ callId, serviceId })),
    skipDuplicates: true,
  })

  return prisma.call.findUnique({ where: { id: callId }, select: CALL_SELECT })
}

export async function updateCallStatusAsTechnician(
  technicianUserId: string,
  callId: string,
  input: TechnicianUpdateStatusInput,
) {
  const tech = await getTechnicianByUserId(technicianUserId)
  const call = await prisma.call.findUnique({ where: { id: callId }, select: { id: true, status: true, technicianId: true } })
  if (!call) throw new NotFoundError('Call not found')
  if (call.technicianId !== tech.id) throw new ForbiddenError('Call not assigned to you')
  if (call.status === 'CLOSED') throw new ForbiddenError('Call is already closed')
  if (call.status === 'OPEN' && input.status === 'CLOSED') {
    throw new ForbiddenError('Cannot close a call that has not been started')
  }

  return prisma.call.update({
    where: { id: callId },
    data: {
      status: input.status,
      ...(input.status === 'CLOSED' ? { closedAt: new Date() } : {}),
    },
    select: CALL_SELECT,
  })
}
