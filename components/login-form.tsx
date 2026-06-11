"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Eye, EyeOff, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { createSupabaseBrowserClient } from "@/lib/supabase/client"

export function LoginForm() {
  const router = useRouter()
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState("")
  const [infoMessage, setInfoMessage] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setErrorMessage("")
    setInfoMessage("")

    const supabase = createSupabaseBrowserClient()
    if (!supabase) {
      setErrorMessage("Supabase nao esta configurado. Configure as variaveis de ambiente antes de entrar.")
      setIsLoading(false)
      return
    }

    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    })

    if (error) {
      setErrorMessage(error.message || "Credenciais invalidas.")
      setIsLoading(false)
      return
    }

    setIsLoading(false)
    router.replace("/dashboard")
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="email">E-mail</Label>
        <Input
          id="email"
          type="email"
          placeholder="seu@email.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="h-11 bg-background"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">Senha</Label>
        <div className="relative">
          <Input
            id="password"
            type={showPassword ? "text" : "password"}
            placeholder="Digite sua senha"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="h-11 bg-background pr-10"
          />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="absolute right-0 top-0 h-11 w-11 hover:bg-transparent"
            onClick={() => setShowPassword(!showPassword)}
            aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
          >
            {showPassword ? (
              <EyeOff className="h-4 w-4 text-muted-foreground" />
            ) : (
              <Eye className="h-4 w-4 text-muted-foreground" />
            )}
          </Button>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Checkbox id="remember" />
          <Label htmlFor="remember" className="text-sm font-normal cursor-pointer">
            Lembrar de mim
          </Label>
        </div>
        <Button
          type="button"
          variant="link"
          className="px-0 text-primary"
          onClick={() => {
            setErrorMessage("")
            setInfoMessage("Recuperacao de senha ainda nao configurada para este ambiente.")
          }}
        >
          Esqueci minha senha
        </Button>
      </div>

      {infoMessage && (
        <p className="rounded-md border border-primary/20 bg-primary/10 px-3 py-2 text-sm text-primary">
          {infoMessage}
        </p>
      )}

      {errorMessage && (
        <p role="alert" className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {errorMessage}
        </p>
      )}

      <Button type="submit" className="h-11 w-full shadow-sm" disabled={isLoading}>
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Entrando...
          </>
        ) : (
          "Entrar"
        )}
      </Button>
    </form>
  )
}
