"use client"

import { useState } from "react"
import { Sidebar } from "@/components/sidebar"
import { Header } from "@/components/header"
import { TooltipProvider } from "@/components/ui/tooltip"

interface InternalLayoutProps {
  children: React.ReactNode
}

export function InternalLayout({ children }: InternalLayoutProps) {
  const [collapsed, setCollapsed] = useState(false)

  return (
    <TooltipProvider>
      <div className="flex min-h-screen bg-background">
        <Sidebar collapsed={collapsed} onToggle={() => setCollapsed((value) => !value)} />
        <div className="flex min-h-screen min-w-0 flex-1 flex-col bg-background">
          <Header />
          <main className="flex-1 bg-background p-6">
            {children}
          </main>
        </div>
      </div>
    </TooltipProvider>
  )
}
