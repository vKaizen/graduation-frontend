import React, { useEffect } from "react";
import { Star, Settings } from "lucide-react";
import { Portfolio } from "@/types";

interface PortfolioHeaderProps {
  portfolio: Portfolio;
  isUpdatingProgress?: boolean;
}

export const PortfolioHeader: React.FC<PortfolioHeaderProps> = ({
  portfolio,
  isUpdatingProgress = false,
}) => {
  // Log progress updates to console instead of showing UI indicator
  useEffect(() => {
    if (isUpdatingProgress) {
      console.log("Portfolio progress is being updated...");
    }
  }, [isUpdatingProgress]);

  return (
    <div className="border-b border-[#353535] bg-[#1a1a1a]">
      <div className="container mx-auto px-5 py-4 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="w-7 h-7 bg-blue-600 rounded flex items-center justify-center text-white text-sm">
            {portfolio.name.charAt(0).toUpperCase()}
          </div>
          <h1 className="text-lg font-medium text-white">{portfolio.name}</h1>
          <button className="text-gray-400 hover:text-white">
            <Star className="h-4 w-4" />
          </button>
        </div>
        <div className="flex items-center space-x-2">
          <button className="text-white bg-blue-600 hover:bg-blue-700 px-2 py-1 rounded flex items-center text-xs">
            <span className="font-medium">Share</span>
          </button>
          <button className="text-white bg-[#252525] hover:bg-[#303030] px-2 py-1 rounded">
            <Settings className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
