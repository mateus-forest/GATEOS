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
          "sticky top-0 flex h-screen shrink-0 flex-col border-r border-sidebar-border/80 bg-sidebar text-sidebar-foreground shadow-[8px_0_28px_rgba(2,6,23,0.18)] transition-all duration-300 ease-out",
          collapsed ? "w-16" : "w-56"
        )}
      >
        <div className="flex h-16 items-center justify-between border-b border-sidebar-border/70 bg-sidebar px-3">
          {!collapsed && (
            <Link href="/dashboard" className="flex items-center gap-2">
              <Image
                src="/logo-gate.png"
                alt="GATE"
                width={124}
                height={40}
                className="h-7 w-auto"
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
              "h-8 w-8 rounded-lg text-sidebar-foreground/80 transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
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

        <div className="min-h-0 flex-1 overflow-y-auto bg-sidebar py-3">
          <nav className="space-y-4 px-2.5 pb-6">
            {menuItems.map((section) => (
              <div key={section.title}>
                {!collapsed && (
                  <h3 className="mb-1.5 px-2.5 text-[11px] font-semibold uppercase tracking-wider text-sidebar-foreground/45">
                    {section.title}
                  </h3>
                )}
                <div className="space-y-0.5">
                  {section.items.map((item) => {
                    const isActive = pathname === item.href
                    const Icon = item.icon

                    const linkContent = (
                      <Link
                        href={item.href}
                        className={cn(
                          "flex min-h-10 items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm font-medium whitespace-nowrap transition-all duration-200",
                          isActive
                            ? "bg-sidebar-primary/95 text-sidebar-primary-foreground shadow-sm ring-1 ring-white/10"
                            : "text-sidebar-foreground/75 hover:bg-sidebar-accent/85 hover:text-sidebar-accent-foreground hover:translate-x-0.5",
                          collapsed && "justify-center px-2"
                        )}
                      >
                        <Icon className="h-[18px] w-[18px] shrink-0" />
                        {!collapsed && <span className="truncate">{item.label}</span>}
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
