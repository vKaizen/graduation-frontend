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
    { label: "Messages", href: `/workspaces/${workspaceId}/messages` },
    { label: "Calendar", href: `/workspaces/${workspaceId}/calendar` },
  ];

  return (
    <div className="border-b border-[#252525] px-6 bg-[#000000]">
      <nav className="flex space-x-4">
        {tabs.map((tab) => {
          // Check if the pathname includes the tab's href path
          const isActive = pathname.endsWith(tab.href.split("/").pop() || "");
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`py-3 px-1 rounded-md border-b-2 font-medium text-sm ${
                isActive
                  ? "border-[#4573D2] text-white"
                  : "border-transparent text-[#a1a1a1] hover:text-white hover:border-[#353535] hover:bg-[#111111]"
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
