"use client"

import { useEffect, useState } from "react"
import { Sidebar } from "@/components/sidebar"
import { Header } from "@/components/header"
import { TooltipProvider } from "@/components/ui/tooltip"

interface InternalLayoutProps {
  children: React.ReactNode
}

export function InternalLayout({ children }: InternalLayoutProps) {
  const [collapsed, setCollapsed] = useState(false)

  useEffect(() => {
    const media = window.matchMedia("(max-width: 768px)")
    const syncSidebar = () => setCollapsed(media.matches)

    syncSidebar()
    media.addEventListener("change", syncSidebar)
    return () => media.removeEventListener("change", syncSidebar)
  }, [])

  return (
    <TooltipProvider>
      <div className="flex min-h-screen bg-background">
        <Sidebar collapsed={collapsed} onToggle={() => setCollapsed((value) => !value)} />
        <div className="flex min-h-screen min-w-0 flex-1 flex-col bg-background">
          <Header />
          <main className="flex-1 bg-background px-5 py-7 sm:px-7 lg:px-10 lg:py-9">
            {children}
          </main>
        </div>
      </div>
    </TooltipProvider>
  )
}
