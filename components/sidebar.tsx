"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import Image from "next/image"
import {
  Building2,
  ChevronLeft,
  ChevronRight,
  CreditCard,
  FileBarChart,
  FileText,
  FolderOpen,
  Scale,
  LayoutDashboard,
  LogOut,
  Package,
  PieChart,
  Settings,
  TrendingUp,
  UserCircle,
  Users,
  Wrench,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"

interface SidebarProps {
  collapsed: boolean
  onToggle: () => void
}

const menuItems = [
  {
    title: "Principal",
    items: [{ icon: LayoutDashboard, label: "Dashboard", href: "/dashboard" }],
  },
  {
    title: "Gestão",
    items: [
      { icon: Users, label: "Clientes", href: "/clientes" },
      { icon: FileText, label: "Contratos", href: "/contratos" },
      { icon: Scale, label: "Jurídico", href: "/juridico" },
    ],
  },
  {
    title: "Financeiro",
    items: [
      { icon: CreditCard, label: "Lançamentos", href: "/lancamentos" },
      { icon: PieChart, label: "DRE", href: "/dre" },
      { icon: TrendingUp, label: "Análise", href: "/analise" },
    ],
  },
  {
    title: "Ativos",
    items: [
      { icon: Package, label: "Equipamentos", href: "/equipamentos" },
      { icon: Building2, label: "Patrimônio", href: "/patrimonio" },
      { icon: Wrench, label: "Manutenções", href: "/manutencoes" },
    ],
  },
  {
    title: "Sistema",
    items: [
      { icon: UserCircle, label: "Sócios", href: "/socios" },
      { icon: FolderOpen, label: "Documentos", href: "/documentos" },
      { icon: FileBarChart, label: "Relatórios", href: "/relatorios" },
      { icon: Settings, label: "Configurações", href: "/configuracoes" },
      { icon: LogOut, label: "Sair", href: "/login" },
    ],
  },
]

export function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const pathname = usePathname()

  return (
    <TooltipProvider>
      <aside
        className={cn(
          "sticky top-0 flex h-screen shrink-0 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground transition-all duration-300",
          collapsed ? "w-16" : "w-64"
        )}
      >
        <div className="flex h-16 items-center justify-between border-b border-sidebar-border bg-sidebar px-3">
          {!collapsed && (
            <Link href="/dashboard" className="flex items-center gap-2">
              <Image
                src="/logo-gate.png"
                alt="GATE"
                width={140}
                height={40}
                className="h-8 w-auto"
              />
            </Link>
          )}
          {collapsed && (
            <Link href="/dashboard" className="mx-auto">
              <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-sm font-bold text-primary-foreground">
                G
              </div>
            </Link>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={onToggle}
            className={cn(
              "h-8 w-8 text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
              collapsed && "mx-auto"
            )}
          >
            {collapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <ChevronLeft className="h-4 w-4" />
            )}
          </Button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto bg-sidebar py-4">
          <nav className="space-y-6 px-2 pb-6">
            {menuItems.map((section) => (
              <div key={section.title}>
                {!collapsed && (
                  <h3 className="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-sidebar-foreground/50">
                    {section.title}
                  </h3>
                )}
                <div className="space-y-1">
                  {section.items.map((item) => {
                    const isActive = pathname === item.href
                    const Icon = item.icon

                    const linkContent = (
                      <Link
                        href={item.href}
                        className={cn(
                          "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                          isActive
                            ? "bg-sidebar-primary text-sidebar-primary-foreground"
                            : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                          collapsed && "justify-center px-2"
                        )}
                      >
                        <Icon className="h-5 w-5 shrink-0" />
                        {!collapsed && <span>{item.label}</span>}
                      </Link>
                    )

                    if (collapsed) {
                      return (
                        <Tooltip key={item.href}>
                          <TooltipTrigger asChild>{linkContent}</TooltipTrigger>
                          <TooltipContent side="right" className="font-medium">
                            {item.label}
                          </TooltipContent>
                        </Tooltip>
                      )
                    }

                    return <div key={item.href}>{linkContent}</div>
                  })}
                </div>
                {!collapsed && <Separator className="mt-4 bg-sidebar-border" />}
              </div>
            ))}
          </nav>
        </div>
      </aside>
    </TooltipProvider>
  )
}
