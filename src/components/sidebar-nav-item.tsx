"use client"

import { usePathname } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { LucideIcon } from "lucide-react"

interface SidebarNavItemProps {
    href: string
    label: string
    icon: LucideIcon
}

export function SidebarNavItem({ href, label, icon: Icon }: SidebarNavItemProps) {
    const pathname = usePathname()
    const isActive = pathname === href

    return (
        <Button
            variant="ghost"
            asChild
            className={`w-full justify-start h-10 transition-colors ${isActive
                ? "bg-[#116c8a] text-white pointer-events-none"
                : "text-gray-300 hover:bg-[#353535] hover:text-white"
                }`}
        >
            <Link href={href}>
                <Icon className="h-5 w-5 mr-3" />
                {label}
            </Link>
        </Button>
    )
}
