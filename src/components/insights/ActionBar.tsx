"use client";

import { PlusIcon, Filter, Link as LinkIcon, CalendarIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ActionBarProps {
  onCreateGoal?: () => void;
  showTimePeriodFilter?: boolean;
  showCopyLink?: boolean;
  showFilter?: boolean;
  filterText?: string;
}

export const ActionBar = ({
  onCreateGoal = () => {},
  showTimePeriodFilter = true,
  showCopyLink = true,
  showFilter = false,
  filterText = "Filter",
}: ActionBarProps) => {
  return (
    <div className="flex justify-between items-center mb-6">
      <div className="flex items-center">
        <Button
          variant="default"
          className="bg-[#4573D2] hover:bg-[#3A62B3] mr-2 h-10"
          onClick={onCreateGoal}
        >
          <PlusIcon className="h-4 w-4 mr-1" />
          Create goal
        </Button>

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

      <div className="flex items-center space-x-2">
        
      </div>
    </div>
  );
};
