import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { prisma } from '../../lib/prisma'
import { env } from '../../config/env'
import { ConflictError } from '../../lib/errors'
import type { ChangePasswordInput, LoginInput, RegisterInput } from './auth.schema'

export async function register(input: RegisterInput) {
  const existing = await prisma.user.findUnique({ where: { email: input.email } })
  if (existing) throw new ConflictError('Email already in use')

  const hashed = await bcrypt.hash(input.password, 10)

  const user = await prisma.user.create({
    data: {
      name: input.name,
      email: input.email,
      password: hashed,
      role: 'CLIENT',
      client: { create: {} },
    },
    select: { id: true, name: true, email: true, role: true, createdAt: true },
  })

  return user
}

export async function login(input: LoginInput) {
  const user = await prisma.user.findUnique({ where: { email: input.email } })
  if (!user) throw new Error('Invalid credentials')

  const valid = await bcrypt.compare(input.password, user.password)
  if (!valid) throw new Error('Invalid credentials')

  const mustChangePassword =
    user.role === 'TECHNICIAN'
      ? ((await prisma.technician.findUnique({
          where: { userId: user.id },
          select: { mustChangePassword: true },
        }))?.mustChangePassword ?? false)
      : false

  const token = jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    env.JWT_SECRET,
    { expiresIn: env.JWT_EXPIRES_IN as jwt.SignOptions['expiresIn'] },
  )

  return {
    token,
    user: { id: user.id, name: user.name, email: user.email, role: user.role, mustChangePassword },
  }
}

export async function changePassword(userId: string, input: ChangePasswordInput) {
  const user = await prisma.user.findUnique({ where: { id: userId } })
  if (!user) throw new Error('User not found')

  const valid = await bcrypt.compare(input.currentPassword, user.password)
  if (!valid) throw new Error('Current password is incorrect')

  const hashed = await bcrypt.hash(input.newPassword, 10)

  await prisma.user.update({ where: { id: userId }, data: { password: hashed } })

  if (user.role === 'TECHNICIAN') {
    await prisma.technician.update({
      where: { userId },
      data: { mustChangePassword: false },
    })
  }

  return { message: 'Password updated successfully' }
}
