"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Bell, ChevronDown, LogOut, Search, Settings, User } from "lucide-react"

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
import { currentUser, notifications as emptyNotifications } from "@/lib/mock-data"

type SearchRecord = Record<string, unknown>
type SearchItem = { label: string; description: string; href: string }

function text(value: unknown) {
  return String(value ?? "")
}

export function Header() {
  const router = useRouter()
  const [profileOpen, setProfileOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [notifications, setNotifications] = useState(emptyNotifications)
  const [searchData, setSearchData] = useState({
    clients: [] as SearchRecord[],
    contracts: [] as SearchRecord[],
    equipments: [] as SearchRecord[],
    installments: [] as SearchRecord[],
    transactions: [] as SearchRecord[],
    documents: [] as SearchRecord[],
  })

  useEffect(() => {
    getNotifications().then((items) => setNotifications(items as typeof emptyNotifications))
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
        group: "Lancamentos",
        items: searchData.transactions.map((item) => ({
          label: text(item.description ?? item.descricao),
          description: text(item.category ?? item.categoria ?? item.dre_category_name),
          href: "/lancamentos",
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

  const handleNotificationClick = async (notification: (typeof notifications)[0]) => {
    await markNotificationAsRead(notification.id)
    setNotifications((current) =>
      current.map((item) => (item.id === notification.id ? { ...item, read: true, lida: true } : item))
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
            <DropdownMenuItem className="text-center text-primary cursor-pointer" onClick={() => handleNavigate("/financeiro")}>
              Ver todas as notificacoes
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
              Configuracoes
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-destructive"
              onClick={() => {
                toast.success("Sessao encerrada")
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
            <DialogDescription>Informacoes do usuario atual</DialogDescription>
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
