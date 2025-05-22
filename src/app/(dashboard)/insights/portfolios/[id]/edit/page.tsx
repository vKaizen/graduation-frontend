"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { ChevronLeft, AlertTriangle } from "lucide-react";
import { CreateEditForm } from "@/components/insights/portfolios/CreateEditForm";
import { fetchPortfolioById } from "@/api-service";
import { Portfolio } from "@/types";
import { useWorkspace } from "@/contexts/workspace-context";

interface EditPortfolioPageProps {
  params: {
    id: string;
  };
}

export default function EditPortfolioPage({ params }: EditPortfolioPageProps) {
  const unwrappedParams = React.use(params);
  const portfolioId = unwrappedParams.id;
  const { currentWorkspace } = useWorkspace();

  const [portfolio, setPortfolio] = useState<Portfolio | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch portfolio
  useEffect(() => {
    const loadPortfolio = async () => {
      try {
        setLoading(true);
        setError(null);

        const data = await fetchPortfolioById(portfolioId);
        setPortfolio(data);
        setLoading(false);
      } catch (err) {
        console.error("Error fetching portfolio:", err);
        setError("Failed to load portfolio details. Please try again.");
        setLoading(false);
      }
    };

    loadPortfolio();
  }, [portfolioId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#1E201E] pt-8 px-4">
        <div className="container mx-auto mb-6">
          <Link
            href={`/insights/portfolios/${portfolioId}`}
            className="flex items-center text-gray-400 hover:text-white text-sm transition-colors"
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            Back to Portfolio
          </Link>
        </div>

        <div className="container mx-auto flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-[#4573D2]"></div>
        </div>
      </div>
    );
  }

  if (error || !portfolio) {
    return (
      <div className="min-h-screen bg-[#1E201E] pt-8 px-4">
        <div className="container mx-auto mb-6">
          <Link
            href={`/insights/portfolios/${portfolioId}`}
            className="flex items-center text-gray-400 hover:text-white text-sm transition-colors"
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            Back to Portfolio
          </Link>
        </div>

        <div className="container mx-auto bg-red-500/10 border border-red-500/20 text-red-500 rounded-md p-4 flex items-start">
          <AlertTriangle className="h-5 w-5 mr-2 mt-0.5" />
          <div>
            <h3 className="font-medium">Error</h3>
            <p>{error || "Portfolio not found"}</p>
          </div>
        </div>
      </div>
    );
  }

  if (!currentWorkspace?._id) {
    return (
      <div className="min-h-screen bg-[#1E201E] pt-8 px-4">
        <div className="container mx-auto mb-6">
          <Link
            href={`/insights/portfolios/${portfolioId}`}
            className="flex items-center text-gray-400 hover:text-white text-sm transition-colors"
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            Back to Portfolio
          </Link>
        </div>

        <div className="container mx-auto bg-red-500/10 border border-red-500/20 text-red-500 rounded-md p-4">
          No workspace selected. Please select a workspace to edit this
          portfolio.
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#1E201E] pt-8 px-4">
      <div className="container mx-auto mb-6">
        <Link
          href={`/insights/portfolios/${portfolioId}`}
          className="flex items-center text-gray-400 hover:text-white text-sm transition-colors"
        >
          <ChevronLeft className="h-4 w-4 mr-1" />
          Back to Portfolio
        </Link>
      </div>

      <div className="container mx-auto">
        <CreateEditForm
          isEditing={true}
          portfolio={portfolio}
          workspaceId={currentWorkspace._id}
        />
      </div>
    </div>
  );
}
