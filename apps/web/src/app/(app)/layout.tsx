import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import type { ReactNode } from 'react'

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001'

export interface AppUser {
  id: string
  name: string
  email: string
  role: 'admin' | 'user'
}

export default async function AppLayout({ children }: { children: ReactNode }) {
  const headersList = await headers()
  const cookie = headersList.get('cookie') ?? ''

  const res = await fetch(`${API_URL}/api/auth/me`, {
    headers: { cookie },
    cache: 'no-store',
  })

  if (!res.ok) {
    redirect('/login')
  }

  return <>{children}</>
}
