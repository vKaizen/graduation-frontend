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
          
        </div>
      </div>
    </div>
  );
};
