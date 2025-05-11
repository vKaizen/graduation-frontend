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
      <Button
        variant="default"
        className="bg-[#4573D2] hover:bg-[#3A62B3] mr-2"
        onClick={onCreateGoal}
      >
        <PlusIcon className="h-4 w-4 mr-1" />
        Create goal
      </Button>

      <div className="flex items-center space-x-2">
        {showFilter && (
          <Button
            variant="outline"
            className="bg-[#252525] border-[#353535] text-sm text-gray-300 hover:bg-[#353535]"
          >
            <Filter className="h-4 w-4 mr-1" />
            {filterText}
          </Button>
        )}

        {showTimePeriodFilter && (
          <Button
            variant="outline"
            className="bg-[#252525] border-[#353535] text-sm text-gray-300 hover:bg-[#353535]"
          >
            <CalendarIcon className="h-4 w-4 mr-1" />
            Time periods: All
          </Button>
        )}

        {showCopyLink && (
          <Button
            variant="outline"
            className="bg-transparent border-none hover:bg-[#252525]"
          >
            <LinkIcon className="h-4 w-4 text-gray-400" />
          </Button>
        )}

        <Button
          variant="link"
          className="text-[#4573D2] hover:text-[#3A62B3] text-sm"
        >
          Send feedback
        </Button>
      </div>
    </div>
  );
};
