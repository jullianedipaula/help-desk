import Image from 'next/image'
import Link from 'next/link'
import { LoginForm } from './login-form'

export default function LoginPage() {
  return (
    <div className="flex min-h-screen">
      {/* Left panel: background image, hidden on mobile */}
      <div className="relative hidden lg:block lg:w-1/2">
        <Image
          src="/login-bg.png"
          alt=""
          fill
          className="object-cover"
          priority
        />
      </div>

      {/* Right panel: form */}
      <div className="flex flex-1 items-center justify-center bg-white p-8">
        <div className="flex w-full max-w-sm flex-col gap-8">
          {/* Brand */}
          <div className="flex items-center gap-2">
            <img src="/logo-dark.svg" alt="" width={32} height={32} />
            <span className="text-lg font-bold text-neutral-900">HelpDesk</span>
          </div>

          {/* Heading */}
          <div className="flex flex-col gap-1">
            <h1 className="text-2xl font-bold text-neutral-900">Acesse o portal</h1>
            <p className="text-sm text-neutral-500">
              Entre e acesse o seu portal de chamados.
            </p>
          </div>

          {/* Login form */}
          <LoginForm />

          {/* Register CTA */}
          <div className="flex flex-col gap-3">
            <div className="text-center">
              <p className="text-sm font-medium text-neutral-500">
                Ainda não tem uma conta?
              </p>
              <p className="text-xs text-neutral-400">Cadastre agora mesmo</p>
            </div>
            <Link
              href="/cadastro"
              className="inline-flex h-10 w-full items-center justify-center rounded-[5px] bg-neutral-100 px-4 text-sm font-medium text-neutral-700 transition-opacity hover:opacity-80"
            >
              Criar conta
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
