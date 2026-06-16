import { LoginForm } from "@/components/login-form"
import Image from "next/image"

export default function LoginPage() {
  return (
    <div className="flex min-h-screen overflow-hidden bg-background">
      <div className="flex flex-1 flex-col justify-center px-5 py-10 sm:px-8 lg:px-16 xl:px-24">
        <div className="mx-auto w-full max-w-md">
          <div className="mb-9 flex items-center">
            <Image
              src="/logo-gate.png"
              alt="GATE Soluções Tecnológicas"
              width={230}
              height={76}
              className="h-20 w-auto object-contain"
              priority
            />
          </div>

          <div className="mb-7">
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-primary">
              Ambiente interno seguro
            </p>
            <h1 className="mb-2 text-3xl font-semibold tracking-tight text-foreground">
              Bem-vindo ao GATE OS
            </h1>
            <p className="max-w-sm text-sm leading-6 text-muted-foreground">
              Acesse contratos, financeiro, ativos e operações com sua conta autorizada.
            </p>
          </div>

          <div className="rounded-3xl border border-border bg-card/95 p-5 shadow-[0_24px_80px_rgba(15,23,42,0.10)] backdrop-blur sm:p-6">
            <LoginForm />
          </div>

          <p className="mt-6 text-center text-xs text-muted-foreground">
            GATE OS v2.0 - Sistema de Gestão Interna
          </p>
        </div>
      </div>

      <div className="relative hidden flex-[1.15] overflow-hidden bg-sky-50 lg:block">
        <Image
          src="/images/gate-login-hero.png"
          alt="Arte visual premium GATE OS"
          fill
          priority
          sizes="(min-width: 1024px) 56vw, 100vw"
          className="object-cover object-center"
        />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-background/10 via-transparent to-white/10" />
      </div>
    </div>
  )
}
