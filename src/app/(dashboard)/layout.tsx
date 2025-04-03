import type React from "react"
import { AppSidebar } from "@/components/app-sidebar"
import { Header } from "@/components/Header"
import { SidebarProvider } from "@/components/ui/sidebar"
import { cn } from "@/lib/utils"

const scrollbarHideClass = `
  scrollbar-hide [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:none]
`

export default function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <SidebarProvider>
      <div className="flex flex-col h-screen">
        <Header />
        <div className="flex flex-1 overflow-hidden">
          <AppSidebar />
          <main className={cn("flex-1 overflow-y-auto", scrollbarHideClass)}>{children}</main>
        </div>
      </div>
    </SidebarProvider>
  )
}

