import { LoginForm } from "@/components/login-form"
import Image from "next/image"

export default function LoginPage() {
  return (
    <div className="min-h-screen flex">
      {/* Left side - Login Form */}
      <div className="flex-1 flex flex-col justify-center px-8 lg:px-16 xl:px-24 bg-card">
        <div className="w-full max-w-md mx-auto">
          <div className="flex items-center gap-3 mb-8">
            <Image
              src="/logo-gate.png"
              alt="GATE Soluções Tecnológicas"
              width={180}
              height={60}
              className="h-14 w-auto"
            />
          </div>

          <div className="mb-8">
            <h1 className="text-2xl font-bold text-foreground mb-2">
              Bem-vindo ao GATE OS
            </h1>
            <p className="text-muted-foreground">
              Sistema de gestão interna. Faça login para continuar.
            </p>
          </div>

          <LoginForm />

          <p className="mt-8 text-center text-sm text-muted-foreground">
            GATE OS v2.0 - Sistema de Gestão Interna
          </p>
        </div>
      </div>

      {/* Right side - Decorative */}
      <div className="hidden lg:flex flex-1 bg-primary relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary to-primary/80" />
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-20 w-72 h-72 border border-white/30 rounded-3xl rotate-12" />
          <div className="absolute bottom-20 right-20 w-96 h-96 border border-white/30 rounded-3xl -rotate-12" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 border border-white/30 rounded-3xl" />
        </div>
        <div className="relative z-10 flex flex-col justify-center items-center text-white p-12 w-full">
          <div className="text-center max-w-lg">
            <h2 className="text-4xl font-bold mb-4">
              Gestão Completa
            </h2>
            <p className="text-lg text-white/80 mb-8">
              Controle total sobre contratos, patrimônio, equipamentos, financeiro e muito mais em uma única plataforma.
            </p>
            <div className="grid grid-cols-2 gap-4 text-left">
              <div className="bg-white/10 rounded-xl p-4 backdrop-blur-sm">
                <div className="text-3xl font-bold">247</div>
                <div className="text-sm text-white/70">Contratos Ativos</div>
              </div>
              <div className="bg-white/10 rounded-xl p-4 backdrop-blur-sm">
                <div className="text-3xl font-bold">R$ 2.4M</div>
                <div className="text-sm text-white/70">Receita Mensal</div>
              </div>
              <div className="bg-white/10 rounded-xl p-4 backdrop-blur-sm">
                <div className="text-3xl font-bold">1.2K</div>
                <div className="text-sm text-white/70">Equipamentos</div>
              </div>
              <div className="bg-white/10 rounded-xl p-4 backdrop-blur-sm">
                <div className="text-3xl font-bold">98%</div>
                <div className="text-sm text-white/70">Satisfação</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
