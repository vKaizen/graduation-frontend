import React from "react";
import { List, Calendar, BarChart2, Users, MessageSquare } from "lucide-react";

interface PortfolioTabsProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export const PortfolioTabs: React.FC<PortfolioTabsProps> = ({
  activeTab,
  onTabChange,
}) => {
  return (
    <div className="bg-[#1a1a1a] border-b border-[#353535]">
      <div className="container mx-auto px-3">
        <div className="flex">
          <button
            className={`px-4 py-3 text-[13px] font-medium ${
              activeTab === "list"
                ? "text-blue-500 border-b-2 border-blue-500"
                : "text-gray-400 hover:text-white"
            }`}
            onClick={() => onTabChange("list")}
          >
            <List className="h-3 w-3 inline mr-1" />
            List
          </button>
          <button
            className={`px-3 py-2 text-[13px] font-medium ${
              activeTab === "timeline"
                ? "text-blue-500 border-b-2 border-blue-500"
                : "text-gray-400 hover:text-white"
            }`}
            onClick={() => onTabChange("timeline")}
          >
            <Calendar className="h-3 w-3 inline mr-1" />
            Timeline
          </button>
          <button
            className={`px-3 py-2 text-[13px] font-medium ${
              activeTab === "progress"
                ? "text-blue-500 border-b-2 border-blue-500"
                : "text-gray-400 hover:text-white"
            }`}
            onClick={() => onTabChange("progress")}
          >
            <BarChart2 className="h-3 w-3 inline mr-1" />
            Progress
          </button>
          <button
            className={`px-3 py-2 text-[13px] font-medium ${
              activeTab === "workload"
                ? "text-blue-500 border-b-2 border-blue-500"
                : "text-gray-400 hover:text-white"
            }`}
            onClick={() => onTabChange("workload")}
          >
            <Users className="h-3 w-3 inline mr-1" />
            Workload
          </button>
          <button
            className={`px-3 py-2 text-xs font-medium ${
              activeTab === "messages"
                ? "text-blue-500 border-b-2 border-blue-500"
                : "text-gray-400 hover:text-white"
            }`}
            onClick={() => onTabChange("messages")}
          >
            <MessageSquare className="h-3 w-3 inline mr-1" />
            Messages
          </button>
        </div>
      </div>
    </div>
  );
};
