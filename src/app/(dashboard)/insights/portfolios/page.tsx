"use client";

import React, { useState, useEffect } from "react";
import { Plus, Briefcase, AlertCircle } from "lucide-react";
import { fetchPortfolios } from "@/api-service";
import { Portfolio } from "@/types";
import { PortfolioCard } from "@/components/insights/portfolios/PortfolioCard";
import { useWorkspace } from "@/contexts/workspace-context";
import { useRBAC } from "@/hooks/useRBAC";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useRouter } from "next/navigation";

export default function PortfoliosPage() {
  const { currentWorkspace } = useWorkspace();
  const { checkPermission, getPermissionMessage } = useRBAC();
  const router = useRouter();
  const [portfolios, setPortfolios] = useState<Portfolio[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Check if user has permission to create portfolios
  const canCreatePortfolio = checkPermission("create", "portfolio");
  const permissionMessage = getPermissionMessage("create", "portfolio");

  // Fetch portfolios
  useEffect(() => {
    const loadPortfolios = async () => {
      try {
        setLoading(true);
        setError(null);

        if (!currentWorkspace?._id) {
          // Don't set error for workspace selection to avoid flash
          // setError("No workspace selected");
          setLoading(false);
          return;
        }

        const data = await fetchPortfolios(currentWorkspace._id);
        setPortfolios(data);
        setLoading(false);
      } catch (err) {
        console.error("Error fetching portfolios:", err);
        setError("Failed to load portfolios. Please try again.");
        setLoading(false);
      }
    };

    loadPortfolios();
  }, [currentWorkspace]);

  // Handle create portfolio button click
  const handleCreatePortfolio = () => {
    if (canCreatePortfolio) {
      router.push("/portfolio");
    }
  };

  // Create Portfolio Button with RBAC
  const CreatePortfolioButton = ({
    className = "",
  }: {
    className?: string;
  }) => {
    const buttonContent = (
      <Button
        className={`flex items-center ${
          canCreatePortfolio
            ? "bg-[#4573D2] hover:bg-[#3a63b8]"
            : "bg-gray-600 cursor-not-allowed"
        } text-white px-4 py-2 rounded-md transition-colors ${className}`}
        onClick={handleCreatePortfolio}
        disabled={!canCreatePortfolio}
      >
        <Plus className="h-4 w-4 mr-2" />
        Create Portfolio
      </Button>
    );

    return canCreatePortfolio ? (
      buttonContent
    ) : (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>{buttonContent}</TooltipTrigger>
          <TooltipContent className="bg-[#252525] text-white border-[#353535]">
            <div className="flex items-center">
              <AlertCircle className="h-4 w-4 text-orange-400 mr-2" />
              <p>{permissionMessage}</p>
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  };

  return (
    <div className="min-h-screen bg-[#121212] pt-8 px-4">
      {/* Header with title and create button */}
      <div className="container mx-auto flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white">Portfolios</h1>
          <p className="text-gray-400 mt-1">
            Group and monitor multiple projects in one view
          </p>
        </div>

        <CreatePortfolioButton />
      </div>

      <div className="container mx-auto">
        {/* Loading state */}
        {loading && (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-[#4573D2]"></div>
          </div>
        )}

        {/* Error state */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-500 rounded-md p-4 mb-8">
            {error}
          </div>
        )}

        {/* Empty state */}
        {!loading && !error && portfolios.length === 0 && (
          <div className="bg-[#1a1a1a] border border-[#353535] rounded-lg p-8 text-center">
            <div className="w-16 h-16 bg-[#252525] rounded-full flex items-center justify-center mx-auto mb-4">
              <Briefcase className="h-8 w-8 text-[#4573D2]" />
            </div>
            <h3 className="text-xl font-medium text-white mb-2">
              No portfolios yet
            </h3>
            <p className="text-gray-400 mb-6 max-w-md mx-auto">
              Create your first portfolio to group and monitor multiple projects
              in one view
            </p>
            <CreatePortfolioButton className="inline-flex" />
          </div>
        )}

        {/* Portfolios grid */}
        {!loading && !error && portfolios.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {portfolios.map((portfolio) => (
              <PortfolioCard key={portfolio._id} portfolio={portfolio} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
