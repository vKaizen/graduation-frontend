"use client";

import { PlusIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRBAC } from "@/hooks/useRBAC";

interface ActionBarProps {
  onCreateGoal?: () => void;
  showTimePeriodFilter?: boolean;
  showCopyLink?: boolean;
  showFilter?: boolean;
  filterText?: string;
  resourceType?: "goal" | "project" | "portfolio" | "task";
}

export const ActionBar = ({
  onCreateGoal = () => {},
  showTimePeriodFilter = true,
  resourceType = "goal",
}: ActionBarProps) => {
  const { checkPermission } = useRBAC();
  const canCreate = checkPermission("create", resourceType);

  return (
    <div className="flex justify-between items-center mb-6">
      <div className="flex items-center">
        {canCreate && (
          <Button
            variant="default"
            className="bg-[#4573D2] hover:bg-[#3A62B3] mr-2 h-10"
            onClick={onCreateGoal}
          >
            <PlusIcon className="h-4 w-4 mr-1" />
            Create {resourceType}
          </Button>
        )}

        {showTimePeriodFilter && (
          <Button
            variant="outline"
            className="bg-[#2C4482] border-[#4573D2] text-sm text-white hover:bg-[#3A62B3] h-10 px-3"
          >
            <span className="font-medium">FY25</span>
            <span className="ml-1 text-gray-300">(+4)</span>
          </Button>
        )}
      </div>

      <div className="flex items-center space-x-2"></div>
    </div>
  );
};
