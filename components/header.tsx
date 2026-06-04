"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Bell, Search, Settings, LogOut, User, ChevronDown } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  clients,
  contracts,
  currentUser,
  documentos,
  equipments,
  notifications as mockNotifications,
  parcelas,
  transactions,
} from "@/lib/mock-data"
import { getNotifications, markNotificationAsRead } from "@/lib/data/notifications"

export function Header() {
  const router = useRouter()
  const [profileOpen, setProfileOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [notifications, setNotifications] = useState(mockNotifications)
  const unreadCount = notifications.filter((n) => !n.read).length

  useEffect(() => {
    getNotifications().then((items) => {
      setNotifications(items as typeof mockNotifications)
    })
  }, [])

  const searchResults = useMemo(() => {
    const term = searchTerm.trim().toLowerCase()

    if (!term) {
      return []
    }

    return [
      {
        group: "Clientes",
        items: clients
          .filter((item) => item.name.toLowerCase().includes(term))
          .slice(0, 3)
          .map((item) => ({ label: item.name, description: item.document, href: `/clientes/${item.id}` })),
      },
      {
        group: "Contratos",
        items: contracts
          .filter((item) => item.number.toLowerCase().includes(term) || item.clientName.toLowerCase().includes(term))
          .slice(0, 3)
          .map((item) => ({ label: item.number, description: item.clientName, href: `/contratos/${item.id}` })),
      },
      {
        group: "Equipamentos",
        items: equipments
          .filter((item) => item.name.toLowerCase().includes(term) || item.serialNumber.toLowerCase().includes(term))
          .slice(0, 3)
          .map((item) => ({ label: item.name, description: item.clientName, href: "/equipamentos" })),
      },
      {
        group: "Parcelas",
        items: parcelas
          .filter((item) => item.contractNumber.toLowerCase().includes(term) || item.clientName.toLowerCase().includes(term))
          .slice(0, 3)
          .map((item) => ({ label: item.contractNumber, description: item.clientName, href: "/parcelas" })),
      },
      {
        group: "Lançamentos",
        items: transactions
          .filter((item) => item.description.toLowerCase().includes(term) || item.category.toLowerCase().includes(term))
          .slice(0, 3)
          .map((item) => ({ label: item.description, description: item.category, href: "/lancamentos" })),
      },
      {
        group: "Documentos",
        items: documentos
          .filter((item) => item.nome.toLowerCase().includes(term) || item.tipo.toLowerCase().includes(term))
          .slice(0, 3)
          .map((item) => ({ label: item.nome, description: item.tipo, href: "/documentos" })),
      },
      {
        group: "DRE",
        items: [
          { label: "DRE Gerencial", description: "Receitas, despesas e resultados", href: "/dre" },
          { label: "Distribuição lucros sócios", description: "Outras despesas não operacionais", href: "/dre" },
          { label: "Saldo banco", description: "Saldos e diferença do fechamento", href: "/dre" },
        ].filter((item) => item.label.toLowerCase().includes(term) || item.description.toLowerCase().includes(term)),
      },
    ].filter((group) => group.items.length > 0)
  }, [searchTerm])

  const handleNavigate = (href: string) => {
    setSearchTerm("")
    router.push(href)
  }

  const handleNotificationClick = async (notification: typeof notifications[0]) => {
    await markNotificationAsRead(notification.id)
    setNotifications((current) =>
      current.map((item) =>
        item.id === notification.id ? { ...item, read: true, lida: true } : item
      )
    )
    handleNavigate(notification.link ?? "/dashboard")
  }

  const initials = currentUser.name
    .split(" ")
    .map((name) => name[0])
    .join("")

  return (
    <header className="h-16 border-b border-border bg-card px-6 flex items-center justify-between">
      <div className="flex items-center gap-4 flex-1">
        <div className="relative w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar clientes, contratos, DRE, documentos..."
            className="pl-10 bg-background"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
          />
          {searchTerm && (
            <div className="absolute left-0 top-11 z-50 w-full rounded-lg border border-border bg-popover p-2 text-popover-foreground shadow-md">
              {searchResults.length > 0 ? (
                <div className="max-h-96 overflow-auto">
                  {searchResults.map((group) => (
                    <div key={group.group} className="py-1">
                      <p className="px-2 py-1 text-xs font-medium text-muted-foreground">{group.group}</p>
                      {group.items.map((item) => (
                        <button
                          key={`${group.group}-${item.label}-${item.href}`}
                          type="button"
                          className="flex w-full flex-col rounded-md px-2 py-2 text-left hover:bg-accent hover:text-accent-foreground"
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

      <div className="flex items-center gap-3">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="relative">
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
              Notificações
              <Badge variant="secondary">{unreadCount} novas</Badge>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            {notifications.slice(0, 5).map((notification) => (
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
                <span className="text-xs font-medium text-primary">
                  {notification.link?.includes("contratos")
                    ? "Ver contrato"
                    : notification.link?.includes("manutencoes")
                      ? "Ver manutenção"
                      : "Ver parcela"}
                </span>
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-center text-primary cursor-pointer" onClick={() => handleNavigate("/parcelas")}>
              Ver todas as notificações
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="flex items-center gap-2 px-2">
              <Avatar className="h-8 w-8">
                <AvatarImage src={currentUser.avatar} />
                <AvatarFallback>{initials}</AvatarFallback>
              </Avatar>
              <div className="flex flex-col items-start">
                <span className="text-sm font-medium">{currentUser.name}</span>
                <span className="text-xs text-muted-foreground">{currentUser.role}</span>
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
            <DropdownMenuItem onClick={() => handleNavigate("/configuracoes")}>
              <Settings className="mr-2 h-4 w-4" />
              Configurações
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-destructive"
              onClick={() => {
                toast.success("Sessão encerrada")
                router.push("/login")
              }}
            >
              <LogOut className="mr-2 h-4 w-4" />
              Sair
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <Dialog open={profileOpen} onOpenChange={setProfileOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Perfil</DialogTitle>
            <DialogDescription>Informações do usuário atual</DialogDescription>
          </DialogHeader>
          <div className="flex items-center gap-4">
            <Avatar className="h-14 w-14">
              <AvatarImage src={currentUser.avatar} />
              <AvatarFallback>{initials}</AvatarFallback>
            </Avatar>
            <div>
              <p className="font-semibold">{currentUser.name}</p>
              <p className="text-sm text-muted-foreground">{currentUser.email}</p>
              <p className="text-sm text-muted-foreground">{currentUser.cargo}</p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </header>
  )
}
