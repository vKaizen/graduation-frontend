"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronDown } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";

interface WorkspaceHeaderProps {
  workspaceName: string;
  activeTab?: string;
}

export const WorkspaceHeader = ({
  workspaceName,
  activeTab,
}: WorkspaceHeaderProps) => {
  const pathname = usePathname();

  // Determine which tab is active using either the activeTab prop or the pathname
  const isStrategyMapActive =
    activeTab === "strategy-map" ||
    (!activeTab && pathname === "/insights/goals/strategy-map");
  const isWorkspaceGoalsActive =
    activeTab === "workspace-goals" ||
    (!activeTab && pathname === "/insights/goals/workspace-goals");
  const isMyGoalsActive =
    activeTab === "my-goals" ||
    (!activeTab &&
      (pathname === "/insights/goals/my-goals" ||
        pathname === "/insights/goals"));

  return (
    <div className="mb-8">
      <div className="flex items-center mb-4">
        <Avatar className="h-12 w-12 bg-[#4573D2] mr-3 flex items-center justify-center">
          <span className="text-sm font-medium text-white">WS</span>
        </Avatar>
        <h1 className="text-xl font-semibold text-white mr-1">
          {workspaceName}
        </h1>
        <ChevronDown className="h-5 w-5 text-gray-400" />
      </div>

      <div className="border-b border-[#353535] mb-6">
        <div className="flex space-x-6">
          <Link
            href="/insights/goals/strategy-map"
            className={`px-4 py-2 text-sm ${
              isStrategyMapActive
                ? "text-white border-b-2 border-[#4573D2]"
                : "text-gray-400 hover:text-white"
            }`}
          >
            Strategy map
          </Link>
          <Link
            href="/insights/goals/workspace-goals"
            className={`px-4 py-2 text-sm ${
              isWorkspaceGoalsActive
                ? "text-white border-b-2 border-[#4573D2]"
                : "text-gray-400 hover:text-white"
            }`}
          >
            Workspace goals
          </Link>
          <Link
            href="/insights/goals/my-goals"
            className={`px-4 py-2 text-sm ${
              isMyGoalsActive
                ? "text-white border-b-2 border-[#4573D2]"
                : "text-gray-400 hover:text-white"
            }`}
          >
            My goals
          </Link>
        </div>
      </div>
    </div>
  );
};
