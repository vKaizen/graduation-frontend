import React, { ReactNode } from "react";
import Link from "next/link";
import { ChevronLeft, MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { Portfolio } from "@/types";
import { PortfolioStatusBadge } from "./PortfolioStatusBadge";
import { ProgressIndicator } from "./ProgressIndicator";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface PortfolioDetailsLayoutProps {
  portfolio: Portfolio;
  children: ReactNode;
  onDelete?: () => void;
}

export const PortfolioDetailsLayout = ({
  portfolio,
  children,
  onDelete,
}: PortfolioDetailsLayoutProps) => {
  // Calculate project count
  const projectCount = Array.isArray(portfolio.projects)
    ? portfolio.projects.length
    : 0;

  return (
    <div className="container mx-auto py-8 px-4">
      {/* Breadcrumb navigation */}
      <div className="mb-6">
        <Link
          href="/insights/portfolios"
          className="flex items-center text-gray-400 hover:text-white text-sm transition-colors"
        >
          <ChevronLeft className="h-4 w-4 mr-1" />
          Back to Portfolios
        </Link>
      </div>

      {/* Header */}
      <div className="mb-8 border-b border-[#353535] pb-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-white">{portfolio.name}</h1>
            {portfolio.description && (
              <p className="text-gray-400 mt-2">{portfolio.description}</p>
            )}
          </div>

          {/* Actions dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="p-2 rounded-md hover:bg-[#252525]">
                <MoreHorizontal className="h-5 w-5 text-gray-400" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="bg-[#252525] border-[#353535]"
            >
              <DropdownMenuItem className="text-white hover:bg-[#353535] cursor-pointer">
                <Link
                  href={`/insights/portfolios/${portfolio._id}/edit`}
                  className="flex items-center w-full"
                >
                  <Pencil className="h-4 w-4 mr-2" />
                  Edit Portfolio
                </Link>
              </DropdownMenuItem>
              {onDelete && (
                <DropdownMenuItem
                  className="text-red-500 hover:bg-[#353535] cursor-pointer"
                  onClick={onDelete}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Portfolio
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-4">
          {/* Status section */}
          <div>
            <div className="text-sm text-gray-400 mb-2">Status</div>
            <PortfolioStatusBadge status={portfolio.status || "no-status"} />
          </div>

          {/* Progress section */}
          <div>
            <div className="text-sm text-gray-400 mb-2">Progress</div>
            <ProgressIndicator progress={portfolio.progress} />
          </div>

          {/* Projects count section */}
          <div>
            <div className="text-sm text-gray-400 mb-2">Projects</div>
            <div className="text-white font-medium">
              {projectCount} project{projectCount !== 1 ? "s" : ""}
            </div>
          </div>
        </div>
      </div>

      {/* Content area */}
      <div className="bg-[#1a1a1a] border border-[#353535] rounded-lg p-6">
        {children}
      </div>
    </div>
  );
};
