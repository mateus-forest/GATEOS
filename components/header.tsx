"use client"

import { useEffect, useMemo, useState } from "react"
import { createPortal } from "react-dom"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Bell, ChevronDown, LogOut, Search, Send, X } from "lucide-react"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { getClients } from "@/lib/data/clients"
import { getContracts } from "@/lib/data/contracts"
import { getDocuments } from "@/lib/data/documents"
import { getEquipment } from "@/lib/data/equipment"
import { getFinancialEntries } from "@/lib/data/financial"
import { getInstallments } from "@/lib/data/installments"
import { getNotifications, markNotificationAsRead } from "@/lib/data/notifications"
import { createSupabaseBrowserClient } from "@/lib/supabase/client"

type SearchRecord = Record<string, unknown>
type SearchItem = { label: string; description: string; href: string }
type NotificationItem = Record<string, unknown> & {
  id: string
  read?: boolean
  lida?: boolean
  title?: string
  message?: string
  time?: string
  link?: string
}
type CosChatMessage = {
  id: string
  role: "user" | "assistant"
  content: string
}
type SessionProfile = {
  name: string
  email: string
  role: string
  avatar?: string
  cargo?: string
}

function text(value: unknown) {
  return String(value ?? "")
}

function CosLogoMark({ className = "" }: { className?: string }) {
  return (
    <span className={`relative block overflow-hidden rounded-md ${className}`}>
      <Image
        src="/images/cos-logo-official.jpeg"
        alt="COS"
        fill
        sizes="40px"
        className="object-contain"
      />
    </span>
  )
}

const COS_INITIAL_MESSAGE =
  "Olá! Sou o COS, seu assistente da GATE Center. Como posso ajudar você hoje?"

const COS_SUGGESTIONS = [
  "Mostrar contratos ativos",
  "Clientes inadimplentes",
  "Receita deste mês",
  "Equipamentos disponíveis",
  "Abrir chamado",
  "Resumo financeiro",
]

export function Header() {
  const router = useRouter()
  const [cosOpen, setCosOpen] = useState(false)
  const [cosInput, setCosInput] = useState("")
  const [cosLoading, setCosLoading] = useState(false)
  const [cosMessages, setCosMessages] = useState<CosChatMessage[]>([
    { id: "cos-initial", role: "assistant", content: COS_INITIAL_MESSAGE },
  ])
  const [searchTerm, setSearchTerm] = useState("")
  const [notifications, setNotifications] = useState<NotificationItem[]>([])
  const [profile, setProfile] = useState<SessionProfile>({
    name: "Usuário GATE",
    email: "",
    role: "Usuário autenticado",
  })
  const [searchData, setSearchData] = useState({
    clients: [] as SearchRecord[],
    contracts: [] as SearchRecord[],
    equipments: [] as SearchRecord[],
    installments: [] as SearchRecord[],
    transactions: [] as SearchRecord[],
    documents: [] as SearchRecord[],
  })

  useEffect(() => {
    const supabase = createSupabaseBrowserClient()
    supabase?.auth.getUser().then(({ data }) => {
      const user = data.user
      if (!user) return

      const metadata = user.user_metadata ?? {}
      const name =
        String(metadata.full_name ?? metadata.name ?? "").trim() ||
        user.email?.split("@")[0] ||
        "Usuário GATE"

      setProfile({
        name,
        email: user.email ?? "",
        role: String(metadata.role ?? metadata.cargo ?? "Usuário autenticado"),
        avatar: typeof metadata.avatar_url === "string" ? metadata.avatar_url : undefined,
        cargo: String(metadata.cargo ?? metadata.role ?? "Usuário autenticado"),
      })
    })

    getNotifications().then((items) => setNotifications(items as NotificationItem[]))
    Promise.all([
      getClients(),
      getContracts(),
      getEquipment(),
      getInstallments(),
      getFinancialEntries(),
      getDocuments(),
    ]).then(([clients, contracts, equipments, installments, transactions, documents]) => {
      setSearchData({
        clients: clients as SearchRecord[],
        contracts: contracts as SearchRecord[],
        equipments: equipments as SearchRecord[],
        installments: installments as SearchRecord[],
        transactions: transactions as SearchRecord[],
        documents: documents as SearchRecord[],
      })
    })
  }, [])

  const unreadCount = notifications.filter((notification) => !notification.read).length

  const searchResults = useMemo(() => {
    const term = searchTerm.trim().toLowerCase()
    if (!term) return []

    const groups: Array<{ group: string; items: SearchItem[] }> = [
      {
        group: "Clientes",
        items: searchData.clients.map((item) => ({
          label: text(item.name ?? item.nome_fantasia ?? item.razao_social),
          description: text(item.document ?? item.cnpj ?? item.cpf),
          href: `/clientes/${text(item.id)}`,
        })),
      },
      {
        group: "Contratos",
        items: searchData.contracts.map((item) => ({
          label: text(item.number ?? item.numero),
          description: text(item.clientName ?? item.client_name ?? item.client),
          href: `/contratos/${text(item.id)}`,
        })),
      },
      {
        group: "Equipamentos",
        items: searchData.equipments.map((item) => ({
          label: text(item.name ?? item.nome),
          description: text(item.serialNumber ?? item.serial_number ?? item.numero_serie),
          href: "/equipamentos",
        })),
      },
      {
        group: "Financeiro",
        items: searchData.installments.map((item) => ({
          label: text(item.contractNumber ?? item.contract_number ?? item.contract_id),
          description: text(item.clientName ?? item.client_name),
          href: "/financeiro",
        })),
      },
      {
        group: "Financeiro",
        items: searchData.transactions.map((item) => ({
          label: text(item.description ?? item.descricao),
          description: text(item.category ?? item.categoria ?? item.dre_category_name),
          href: "/financeiro",
        })),
      },
      {
        group: "Documentos",
        items: searchData.documents.map((item) => ({
          label: text(item.nome ?? item.name ?? item.file_name),
          description: text(item.tipo ?? item.type ?? item.category),
          href: "/documentos",
        })),
      },
      {
        group: "DRE",
        items: [{ label: "DRE", description: "Demonstrativo de resultado", href: "/dre" }],
      },
    ]

    return groups
      .map((group) => ({
        ...group,
        items: group.items
          .filter((item) => item.label.toLowerCase().includes(term) || item.description.toLowerCase().includes(term))
          .slice(0, 3),
      }))
      .filter((group) => group.items.length > 0)
  }, [searchData, searchTerm])

  const handleNavigate = (href: string) => {
    setSearchTerm("")
    router.push(href)
  }

  const handleNotificationClick = async (notification: NotificationItem) => {
    await markNotificationAsRead(notification.id)
    setNotifications((current) =>
      current.map((item) => (item.id === notification.id ? { ...item, read: true, lida: true } : item))
    )
    handleNavigate(notification.link ?? "/dashboard")
  }

  const sendCosMessage = async (rawMessage?: string) => {
    const message = (rawMessage ?? cosInput).trim()
    if (!message || cosLoading) return

    const userMessage: CosChatMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      content: message,
    }

    setCosMessages((current) => [...current, userMessage])
    setCosInput("")
    setCosLoading(true)

    try {
      const response = await fetch("/api/cos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message }),
      })
      const payload = (await response.json().catch(() => null)) as { answer?: string; error?: string } | null

      const assistantMessage: CosChatMessage = {
        id: `assistant-${Date.now()}`,
        role: "assistant",
        content:
          response.ok && payload?.answer
            ? payload.answer
            : payload?.error || "Não consegui acessar esses dados no momento.",
      }

      setCosMessages((current) => [...current, assistantMessage])
    } catch (error) {
      console.error("[cos] Falha na chamada do assistente", error)
      setCosMessages((current) => [
        ...current,
        {
          id: `assistant-error-${Date.now()}`,
          role: "assistant",
          content: "Não consegui acessar esses dados no momento.",
        },
      ])
    } finally {
      setCosLoading(false)
    }
  }

  const initials = profile.name
    .split(" ")
    .map((name) => name[0])
    .join("")
    .slice(0, 2)
    .toUpperCase()

  const handleSignOut = async () => {
    const supabase = createSupabaseBrowserClient()
    const { error } = supabase ? await supabase.auth.signOut() : { error: null }
    if (error) {
      toast.error(error.message || "Não foi possível encerrar a sessão.")
      return
    }

    toast.success("Sessão encerrada")
    router.replace("/login")
    router.refresh()
  }

  return (
    <header className="sticky top-0 z-30 flex h-20 items-center justify-between border-b border-border/70 bg-background/90 px-4 backdrop-blur-xl sm:px-7 lg:px-10">
      <div className="flex min-w-0 flex-1 justify-center">
        <div className="relative w-full max-w-[620px]">
          <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar clientes, contratos, equipamentos..."
            className="h-12 rounded-2xl border-border/80 bg-card pl-11 pr-12 shadow-[0_10px_35px_rgba(15,23,42,0.05)]"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
          />
          <span className="pointer-events-none absolute right-4 top-1/2 hidden -translate-y-1/2 rounded-md border border-border bg-muted px-1.5 py-0.5 text-[11px] text-muted-foreground sm:inline-flex">
            ⌘K
          </span>
          {searchTerm && (
            <div className="absolute left-0 top-14 z-50 w-full rounded-2xl border border-border bg-popover p-2 text-popover-foreground shadow-[0_24px_80px_rgba(15,23,42,0.16)]">
              {searchResults.length > 0 ? (
                <div className="max-h-96 overflow-auto">
                  {searchResults.map((group) => (
                    <div key={group.group} className="py-1">
                      <p className="px-2 py-1 text-xs font-medium text-muted-foreground">{group.group}</p>
                      {group.items.map((item) => (
                        <button
                          key={`${group.group}-${item.label}-${item.href}`}
                          type="button"
                          className="flex w-full flex-col rounded-xl px-3 py-2.5 text-left hover:bg-accent hover:text-accent-foreground"
                          onClick={() => handleNavigate(item.href)}
                        >
                          <span className="text-sm font-medium">{item.label}</span>
                          <span className="text-xs text-muted-foreground">{item.description}</span>
                        </button>
                      ))}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="px-2 py-3 text-sm text-muted-foreground">Nenhum resultado encontrado</p>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-2 sm:gap-3">
        <Button
          type="button"
          onClick={() => setCosOpen(true)}
          className="h-11 rounded-2xl bg-neutral-950 px-3 text-white shadow-[0_14px_38px_rgba(15,23,42,0.24)] hover:bg-neutral-800 sm:px-4"
        >
          <CosLogoMark className="h-4 w-4 sm:mr-2" />
          <span className="hidden sm:inline">Abrir no COS</span>
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="relative rounded-2xl">
              <Bell className="h-5 w-5" />
              {unreadCount > 0 && (
                <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs bg-destructive">
                  {unreadCount}
                </Badge>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80">
            <DropdownMenuLabel className="flex items-center justify-between">
              Notificacoes
              <Badge variant="secondary">{unreadCount} novas</Badge>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            {notifications.length > 0 ? (
              notifications.slice(0, 5).map((notification) => (
                <DropdownMenuItem
                  key={notification.id}
                  className="flex flex-col items-start gap-1 p-3 cursor-pointer"
                  onClick={() => handleNotificationClick(notification)}
                >
                  <div className="flex items-center gap-2">
                    {!notification.read && <span className="h-2 w-2 rounded-full bg-primary" />}
                    <span className="font-medium text-sm">{notification.title}</span>
                  </div>
                  <span className="text-xs text-muted-foreground">{notification.message}</span>
                  <span className="text-xs text-muted-foreground">{notification.time}</span>
                </DropdownMenuItem>
              ))
            ) : (
              <DropdownMenuItem className="p-3 text-sm text-muted-foreground">
                Nenhuma notificacao encontrada.
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-center text-primary cursor-pointer" onClick={() => handleNavigate("/dashboard")}>
              Abrir Dashboard
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="flex h-11 items-center gap-2 rounded-2xl px-2">
              <Avatar className="h-8 w-8">
                <AvatarImage src={profile.avatar} />
                <AvatarFallback>{initials}</AvatarFallback>
              </Avatar>
              <div className="hidden flex-col items-start md:flex">
                <span className="text-sm font-medium">{profile.name}</span>
                <span className="text-xs text-muted-foreground">{profile.role}</span>
              </div>
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" sideOffset={12} className="z-[80] w-72 rounded-2xl p-2 shadow-[0_24px_80px_rgba(15,23,42,0.16)]">
            <DropdownMenuLabel className="p-3">
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={profile.avatar} />
                  <AvatarFallback>{initials}</AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold">{profile.name}</p>
                  <p className="truncate text-xs text-muted-foreground">{profile.email || "Usuário autenticado"}</p>
                  <p className="truncate text-xs text-muted-foreground">{profile.role || "Usuário autenticado"}</p>
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="cursor-pointer rounded-xl text-destructive focus:text-destructive"
              onClick={handleSignOut}
            >
              <LogOut className="mr-2 h-4 w-4" />
              Sair
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {cosOpen &&
        typeof document !== "undefined" &&
        createPortal(
        <div className="fixed inset-0 z-[999]">
          <button
            type="button"
            aria-label="Fechar COS"
            className="absolute inset-0 bg-neutral-950/35 backdrop-blur-md"
            onClick={() => setCosOpen(false)}
          />
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="cos-assistant-title"
            className="fixed left-1/2 top-1/2 z-[1000] flex max-h-[calc(100vh-96px)] w-[min(calc(100vw-32px),520px)] -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-[28px] border border-border/80 bg-white shadow-[0_32px_120px_rgba(15,23,42,0.28)]"
          >
            <div className="flex shrink-0 items-center justify-between gap-4 border-b border-border px-6 py-5">
              <div className="flex min-w-0 items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-neutral-950 text-white">
                  <CosLogoMark className="h-6 w-6" />
                </div>
                <div className="min-w-0">
                  <h2 id="cos-assistant-title" className="truncate text-base font-semibold text-foreground">
                    COS Assistant
                  </h2>
                  <p className="truncate text-sm text-muted-foreground">Inteligência da GATE</p>
                </div>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label="Fechar COS"
                className="h-9 w-9 shrink-0 rounded-2xl"
                onClick={() => setCosOpen(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto px-6 py-6">
              <div className="space-y-5">
                {cosMessages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex items-start gap-3 ${message.role === "user" ? "justify-end" : ""}`}
                  >
                    {message.role === "assistant" && (
                      <div className="mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-neutral-950 text-white">
                        <CosLogoMark className="h-5 w-5" />
                      </div>
                    )}
                    <div
                      className={`max-w-[82%] rounded-3xl px-5 py-4 text-sm leading-6 ${
                        message.role === "user" ? "bg-neutral-950 text-white" : "bg-muted text-foreground"
                      }`}
                    >
                      {message.content}
                    </div>
                  </div>
                ))}
                {cosLoading && (
                  <div className="flex items-start gap-3">
                    <div className="mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-neutral-950 text-white">
                      <CosLogoMark className="h-5 w-5" />
                    </div>
                    <div className="rounded-3xl bg-muted px-5 py-4 text-sm leading-6 text-muted-foreground">
                      Consultando dados reais do GATE OS...
                    </div>
                  </div>
                )}
                <div>
                  <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                    Sugestões
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {COS_SUGGESTIONS.map((suggestion) => (
                      <button
                        key={suggestion}
                        type="button"
                        disabled={cosLoading}
                        className="rounded-full bg-muted px-3.5 py-2 text-sm text-foreground transition-colors hover:bg-neutral-950 hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
                        onClick={() => sendCosMessage(suggestion)}
                      >
                        {suggestion}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
            <div className="shrink-0 border-t border-border bg-white px-4 py-4">
              <form
                className="flex items-center gap-2"
                onSubmit={(event) => {
                  event.preventDefault()
                  sendCosMessage()
                }}
              >
                <Input
                  aria-label="Mensagem para o COS"
                  placeholder="Pergunte algo ao COS..."
                  className="h-10 rounded-2xl"
                  value={cosInput}
                  onChange={(event) => setCosInput(event.target.value)}
                  disabled={cosLoading}
                />
                <Button type="submit" size="icon" className="shrink-0 rounded-2xl" disabled={cosLoading || !cosInput.trim()}>
                  <Send className="h-4 w-4" />
                </Button>
              </form>
            </div>
          </section>
        </div>,
        document.body
      )}

    </header>
  )
}
