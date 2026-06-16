"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import Image from "next/image"
import {
  ChevronLeft,
  ChevronRight,
  CreditCard,
  FileText,
  FolderOpen,
  LayoutDashboard,
  Package,
  PieChart,
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
    title: "Gestao",
    items: [
      { icon: Users, label: "Clientes", href: "/clientes" },
      { icon: FileText, label: "Contratos", href: "/contratos" },
    ],
  },
  {
    title: "Financeiro",
    items: [
      { icon: CreditCard, label: "Financeiro", href: "/financeiro" },
      { icon: PieChart, label: "DRE", href: "/dre" },
    ],
  },
  {
    title: "Operacao",
    items: [
      { icon: Package, label: "Equipamentos", href: "/equipamentos" },
      { icon: Wrench, label: "Manutencoes", href: "/manutencoes" },
      { icon: FolderOpen, label: "Documentos", href: "/documentos" },
    ],
  },
]

export function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const pathname = usePathname()

  return (
    <TooltipProvider>
      <aside
        className={cn(
          "sticky top-0 flex h-screen shrink-0 flex-col border-r border-sidebar-border/80 bg-sidebar text-sidebar-foreground shadow-[10px_0_34px_rgba(2,6,23,0.16)] transition-all duration-300 ease-out",
          collapsed ? "w-[72px]" : "w-64"
        )}
      >
        <div className="flex h-20 items-center justify-between border-b border-sidebar-border/70 bg-sidebar px-4">
          {!collapsed && (
            <Link href="/dashboard" className="flex min-w-0 items-center gap-2">
              <Image
                src="/logo-gate.png"
                alt="GATE"
                width={172}
                height={58}
                className="h-11 w-auto object-contain"
                priority
              />
            </Link>
          )}
          {collapsed && (
            <Link href="/dashboard" className="mx-auto">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-sm font-bold text-primary-foreground shadow-sm ring-1 ring-white/10">
                G
              </div>
            </Link>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={onToggle}
            className={cn(
              "h-8 w-8 rounded-lg text-sidebar-foreground/70 transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
              collapsed && "mx-auto"
            )}
            aria-label={collapsed ? "Expandir menu" : "Recolher menu"}
          >
            {collapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <ChevronLeft className="h-4 w-4" />
            )}
          </Button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto bg-sidebar py-4">
          <nav className="space-y-4 px-3 pb-6">
            {menuItems.map((section) => (
              <div key={section.title}>
                {!collapsed && (
                  <h3 className="mb-1.5 px-2.5 text-[11px] font-semibold uppercase tracking-wider text-sidebar-foreground/45">
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
                          "relative flex min-h-10 items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium whitespace-nowrap transition-all duration-200",
                          isActive
                            ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-sm ring-1 ring-white/10 before:absolute before:left-0 before:top-2 before:h-6 before:w-1 before:rounded-r-full before:bg-white/90"
                            : "text-sidebar-foreground/70 hover:bg-sidebar-accent/90 hover:text-sidebar-accent-foreground",
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
                {!collapsed && <Separator className="mt-4 bg-sidebar-border/80" />}
              </div>
            ))}
          </nav>
        </div>
      </aside>
    </TooltipProvider>
  )
}
