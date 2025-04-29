"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";

interface WorkspaceTabsProps {
  workspaceId: string;
}

export function WorkspaceTabs({ workspaceId }: WorkspaceTabsProps) {
  const pathname = usePathname();

  // Define the tabs for navigation
  const tabs = [
    { label: "Overview", href: `/workspaces/${workspaceId}/overview` },
    { label: "All work", href: `/workspaces/${workspaceId}/work` },
    { label: "Messages", href: `/workspaces/${workspaceId}/messages` },
    { label: "Calendar", href: `/workspaces/${workspaceId}/calendar` },
    { label: "Knowledge", href: `/workspaces/${workspaceId}/knowledge` },
  ];

  return (
    <div className="border-b border-[#252525] px-6 bg-[#1a1a1a]">
      <nav className="flex space-x-4">
        {tabs.map((tab) => {
          // Check if the pathname includes the tab's href path
          const isActive = pathname.endsWith(tab.href.split("/").pop() || "");
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`py-3 px-1 border-b-2 font-medium text-sm ${
                isActive
                  ? "border-[#4573D2] text-white"
                  : "border-transparent text-[#a1a1a1] hover:text-white hover:border-[#353535]"
              }`}
            >
              {tab.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
