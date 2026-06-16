"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Bell, ChevronDown, LogOut, Search, Send, Sparkles, User } from "lucide-react"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
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

export function Header() {
  const router = useRouter()
  const [profileOpen, setProfileOpen] = useState(false)
  const [cosOpen, setCosOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [notifications, setNotifications] = useState<NotificationItem[]>([])
  const [profile, setProfile] = useState<SessionProfile>({
    name: "Usuario GATE",
    email: "",
    role: "Usuario autenticado",
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
        "Usuario GATE"

      setProfile({
        name,
        email: user.email ?? "",
        role: String(metadata.role ?? metadata.cargo ?? "Usuario autenticado"),
        avatar: typeof metadata.avatar_url === "string" ? metadata.avatar_url : undefined,
        cargo: String(metadata.cargo ?? metadata.role ?? "Usuario autenticado"),
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
      toast.error(error.message || "Nao foi possivel encerrar a sessao.")
      return
    }

    toast.success("Sessao encerrada")
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
          <Sparkles className="h-4 w-4 sm:mr-2" />
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
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>Minha Conta</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => setProfileOpen(true)}>
              <User className="mr-2 h-4 w-4" />
              Perfil
            </DropdownMenuItem>
            <DropdownMenuItem
              className="text-destructive"
              onClick={handleSignOut}
            >
              <LogOut className="mr-2 h-4 w-4" />
              Sair
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <Dialog open={cosOpen} onOpenChange={setCosOpen}>
        <DialogContent className="max-w-[440px] p-0">
          <div className="border-b border-border px-6 py-5">
            <DialogHeader className="mb-0 pr-0">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-neutral-950 text-white">
                  <Sparkles className="h-4 w-4" />
                </div>
                <div>
                  <DialogTitle className="text-base">COS Assistant</DialogTitle>
                  <DialogDescription>Inteligência da GATE</DialogDescription>
                </div>
              </div>
            </DialogHeader>
          </div>
          <div className="space-y-6 px-6 py-6">
            <div className="flex items-start gap-3">
              <div className="mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-neutral-950 text-white">
                <Sparkles className="h-4 w-4" />
              </div>
              <div className="rounded-3xl bg-muted px-5 py-4 text-sm leading-6 text-foreground">
                Olá! Sou o COS, seu assistente da GATE Center. Como posso ajudar você hoje?
              </div>
            </div>
            <div>
              <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                Sugestões
              </p>
              <div className="flex flex-wrap gap-2">
                {[
                  "Mostrar contratos ativos",
                  "Clientes inadimplentes",
                  "Receita deste mês",
                  "Equipamentos disponíveis",
                  "Abrir chamado",
                  "Resumo financeiro",
                ].map((suggestion) => (
                  <button
                    key={suggestion}
                    type="button"
                    className="rounded-full bg-muted px-3.5 py-2 text-sm text-foreground transition-colors hover:bg-neutral-950 hover:text-white"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 border-t border-border px-4 py-4">
            <Input
              aria-label="Mensagem para o COS"
              placeholder="Pergunte algo ao COS..."
              className="h-10 rounded-2xl"
            />
            <Button type="button" size="icon" className="rounded-2xl">
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={profileOpen} onOpenChange={setProfileOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Perfil</DialogTitle>
            <DialogDescription>Informacoes do usuario atual</DialogDescription>
          </DialogHeader>
          <div className="flex items-center gap-4">
            <Avatar className="h-14 w-14">
              <AvatarImage src={profile.avatar} />
              <AvatarFallback>{initials}</AvatarFallback>
            </Avatar>
            <div>
              <p className="font-semibold">{profile.name}</p>
              <p className="text-sm text-muted-foreground">{profile.email}</p>
              <p className="text-sm text-muted-foreground">{profile.cargo}</p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </header>
  )
}
