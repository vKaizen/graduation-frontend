"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { ListFilter, LayoutGrid, Calendar } from "lucide-react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface MyTasksTabsProps {
  className?: string;
}

export function MyTasksTabs({ className }: MyTasksTabsProps) {
  const pathname = usePathname();

  const tabs = [
    {
      name: "Board",
      href: "/my-tasks/board",
      icon: <LayoutGrid className="h-4 w-4 mr-2" />,
    },
    {
      name: "List",
      href: "/my-tasks/list",
      icon: <ListFilter className="h-4 w-4 mr-2" />,
    },
    {
      name: "Calendar",
      href: "/my-tasks/calendar",
      icon: <Calendar className="h-4 w-4 mr-2" />,
    },
  ];

  return (
    <div className="sticky top-0 bg-black border-b border-[#262626] z-10">
      <div className="px-4">
        <div className="flex h-12 items-center gap-1">
          {tabs.map((tab) => (
            <Link
              key={tab.name}
              href={tab.href}
              className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                pathname.includes(tab.href)
                  ? "bg-[#262626] text-white"
                  : "text-neutral-400 hover:text-neutral-300 hover:bg-[#262626]"
              }`}
            >
              {tab.name}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
