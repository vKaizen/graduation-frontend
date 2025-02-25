"use client";

import { Button } from "@/components/ui/button";
import {
    Grid,
    } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
    { name: "Board", icon: Grid, href: "board" },
    { name: "list", icon: Grid, href: "list" },
];

export function ProjectNav({ projectId }: Readonly<{ projectId: string }>) {
    const pathname = usePathname();

    return (
        <div className="flex items-center gap-1 px-4 h-12 border-b border-gray-800">
            {navItems.map((item) => {
                const Icon = item.icon;
                const href = `/projects/${projectId}/${item.href}`;
                const isActive = pathname === href;

                return (
                    <Button
                        key={item.name}
                        variant="ghost"
                        size="sm"
                        className={`text-sm gap-2 ${isActive ? "bg-white/10 text-white" : "text-gray-400"}`}
                        asChild
                    >
                        <Link href={href}>
                            <Icon className="h-4 w-4" />
                            {item.name}
                        </Link>
                    </Button>
                );
            })}
        </div>
    );
}
