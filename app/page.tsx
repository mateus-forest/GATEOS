import { LoginForm } from "@/components/login-form"
import Image from "next/image"

export default function LoginPage() {
  return (
    <div className="flex min-h-screen bg-background">
      <div className="flex flex-1 flex-col justify-center px-5 py-10 sm:px-8 lg:px-16 xl:px-24">
        <div className="mx-auto w-full max-w-md">
          <div className="mb-9 flex items-center">
            <Image
              src="/logo-gate.png"
              alt="GATE Solucoes Tecnologicas"
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
              Acesse contratos, financeiro, ativos e operacoes com sua conta autorizada.
            </p>
          </div>

          <div className="rounded-xl border border-border bg-card p-5 shadow-sm sm:p-6">
            <LoginForm />
          </div>

          <p className="mt-6 text-center text-xs text-muted-foreground">
            GATE OS v2.0 - Sistema de Gestao Interna
          </p>
        </div>
      </div>

      <div className="relative hidden flex-1 overflow-hidden bg-sidebar text-sidebar-foreground lg:flex">
        <div className="absolute inset-0 opacity-[0.08] [background-image:linear-gradient(to_right,#fff_1px,transparent_1px),linear-gradient(to_bottom,#fff_1px,transparent_1px)] [background-size:48px_48px]" />
        <div className="absolute inset-x-10 top-10 h-px bg-white/15" />
        <div className="absolute inset-y-10 right-10 w-px bg-white/15" />
        <div className="relative z-10 flex w-full flex-col justify-center p-14">
          <div className="max-w-xl">
            <div className="mb-8 inline-flex items-center rounded-full border border-white/15 bg-white/[0.08] px-4 py-2 text-xs font-medium uppercase tracking-[0.18em] text-white/75">
              Plataforma operacional GATE
            </div>
            <h2 className="mb-5 text-5xl font-semibold tracking-tight text-white">
              Controle interno com clareza.
            </h2>
            <p className="text-lg leading-8 text-white/70">
              Um espaco unico para acompanhar clientes, contratos, lancamentos, equipamentos,
              manutencoes, documentos e indicadores reais do Supabase.
            </p>
            <div className="mt-10 grid grid-cols-2 gap-3">
              {["Contratos", "Financeiro", "Operacoes", "Documentos"].map((item) => (
                <div key={item} className="rounded-lg border border-white/10 bg-white/[0.07] px-4 py-3 text-sm font-medium text-white/80">
                  {item}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
