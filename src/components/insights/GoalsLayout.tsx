"use client";

import { ReactNode } from "react";
import { WorkspaceHeader } from "./WorkspaceHeader";
import { ActionBar } from "./ActionBar";

interface GoalsLayoutProps {
  children: ReactNode;
  workspaceName?: string;
  onCreateGoal?: () => void;
  showFilter?: boolean;
  filterText?: string;
  showTimePeriodFilter?: boolean;
  showCopyLink?: boolean;
  activeTab?: string;
  resourceType?: "goal" | "project" | "portfolio" | "task";
}

export const GoalsLayout = ({
  children,
  workspaceName = "My workspace",
  onCreateGoal,
  showFilter = false,
  filterText = "Filter",
  showTimePeriodFilter = true,
  showCopyLink = true,
  activeTab,
  resourceType = "goal",
}: GoalsLayoutProps) => {
  return (
    <div className="p-6 text-white bg-[#121212] min-h-full">
      <div className="max-w-7xl mx-auto">
        <WorkspaceHeader workspaceName={workspaceName} activeTab={activeTab} />

        <ActionBar
          onCreateGoal={onCreateGoal}
          showFilter={showFilter}
          filterText={filterText}
          showTimePeriodFilter={showTimePeriodFilter}
          showCopyLink={showCopyLink}
          resourceType={resourceType}
        />

        <div className="mt-6">{children}</div>
      </div>
    </div>
  );
};
