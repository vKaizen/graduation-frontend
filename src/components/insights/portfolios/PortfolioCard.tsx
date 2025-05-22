import React from "react";
import Link from "next/link";
import { Briefcase, ChevronRight, LayoutGrid } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { Portfolio } from "@/types";
import { PortfolioStatusBadge } from "./PortfolioStatusBadge";
import { ProgressIndicator } from "./ProgressIndicator";

interface PortfolioCardProps {
  portfolio: Portfolio;
  className?: string;
}

export const PortfolioCard = ({ portfolio, className }: PortfolioCardProps) => {
  // Get the count of projects
  const projectCount = Array.isArray(portfolio.projects)
    ? portfolio.projects.length
    : 0;

  // Format the owner name
  const ownerName =
    typeof portfolio.owner === "object" && portfolio.owner?.fullName
      ? portfolio.owner.fullName
      : "Unknown";

  const ownerInitial = ownerName ? ownerName.charAt(0) : "U";

  return (
    <Link
      href={`/insights/portfolios/${portfolio._id}`}
      className={`
        block bg-[#1a1a1a] border border-[#353535] rounded-lg p-5 hover:border-[#4573D2] 
        transition-all duration-200 hover:shadow-md ${className || ""}
      `}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center">
          <div className="w-10 h-10 bg-[#252525] rounded-md flex items-center justify-center mr-3">
            <Briefcase className="h-5 w-5 text-[#4573D2]" />
          </div>
          <div>
            <h3 className="font-medium text-white text-lg">{portfolio.name}</h3>
            {portfolio.workspace && (
              <div className="flex items-center text-xs text-gray-400 mt-0.5">
                <LayoutGrid className="h-3 w-3 mr-1" />
                <span>{portfolio.workspace.name}</span>
              </div>
            )}
          </div>
        </div>

        <ChevronRight className="h-5 w-5 text-gray-500" />
      </div>

      {portfolio.description && (
        <p className="text-gray-400 text-sm mb-4 line-clamp-2">
          {portfolio.description}
        </p>
      )}

      <div className="mb-4">
        <ProgressIndicator progress={portfolio.progress} />
      </div>

      <div className="flex items-center justify-between">
        <PortfolioStatusBadge
          status={portfolio.status || "no-status"}
          size="sm"
        />

        <div className="flex items-center text-gray-400 text-sm">
          <span className="mr-2">
            {projectCount} project{projectCount !== 1 ? "s" : ""}
          </span>
          <Avatar className="h-6 w-6 bg-[#4573D2]">
            <span className="text-[10px] font-medium text-white">
              {ownerInitial}
            </span>
          </Avatar>
        </div>
      </div>
    </Link>
  );
};
