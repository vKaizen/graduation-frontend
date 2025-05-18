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
        {showFilter && (
          <Button
            variant="outline"
            className="bg-[#252525] border-[#353535] text-sm text-gray-300 hover:bg-[#353535]"
          >
            <Filter className="h-4 w-4 mr-1" />
            {filterText}
          </Button>
        )}

        <div className="flex items-center space-x-1">
          <Button
            variant="outline"
            className="h-8 w-8 p-0 bg-[#252525] border-[#353535] hover:bg-[#353535] rounded-l-md rounded-r-none border-r-0"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-gray-400"
            >
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
              <line x1="9" y1="3" x2="9" y2="21"></line>
            </svg>
          </Button>
          <Button
            variant="outline"
            className="h-8 w-8 p-0 bg-[#252525] border-[#353535] hover:bg-[#353535] rounded-l-none rounded-r-md"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-gray-400"
            >
              <polygon points="15 3 21 3 21 9"></polygon>
              <polygon points="9 21 3 21 3 15"></polygon>
              <line x1="21" y1="3" x2="14" y2="10"></line>
              <line x1="3" y1="21" x2="10" y2="14"></line>
            </svg>
          </Button>
        </div>

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
