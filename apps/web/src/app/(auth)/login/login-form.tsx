'use client'

import { Button } from '@/components/button'
import { Input } from '@/components/input'
import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001'

export function LoginForm() {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)

    const form = e.currentTarget
    const email = (form.elements.namedItem('email') as HTMLInputElement).value
    const password = (form.elements.namedItem('password') as HTMLInputElement).value

    startTransition(async () => {
      try {
        const res = await fetch(`${API_URL}/api/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password }),
          credentials: 'include',
        })

        if (!res.ok) {
          const data = await res.json()
          setError(
            data.error === 'INVALID_CREDENTIALS'
              ? 'E-mail ou senha incorretos.'
              : 'Ocorreu um erro. Tente novamente.'
          )
          return
        }

        router.push('/chamados')
        router.refresh()
      } catch {
        setError('Não foi possível conectar ao servidor.')
      }
    })
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <Input
        label="E-mail"
        name="email"
        type="email"
        placeholder="exemplo@email.com"
        required
        disabled={isPending}
      />
      <Input
        label="Senha"
        name="password"
        type="password"
        placeholder="Digite sua senha"
        required
        disabled={isPending}
        error={error ?? undefined}
      />
      <Button type="submit" variant="primary" fullWidth disabled={isPending}>
        {isPending ? 'Entrando...' : 'Entrar'}
      </Button>
    </form>
  )
}
