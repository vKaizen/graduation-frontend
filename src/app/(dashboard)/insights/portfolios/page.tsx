"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Plus, Briefcase } from "lucide-react";
import { fetchPortfolios } from "@/api-service";
import { Portfolio } from "@/types";
import { PortfolioCard } from "@/components/insights/portfolios/PortfolioCard";
import { useWorkspace } from "@/contexts/workspace-context";

export default function PortfoliosPage() {
  const { currentWorkspace } = useWorkspace();
  const [portfolios, setPortfolios] = useState<Portfolio[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  return (
    <div className="min-h-screen bg-[#1E201E] pt-8 px-4">
      {/* Header with title and create button */}
      <div className="container mx-auto flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white">Portfolios</h1>
          <p className="text-gray-400 mt-1">
            Group and monitor multiple projects in one view
          </p>
        </div>

        <Link
          href="/portfolio"
          className="flex items-center bg-[#4573D2] text-white px-4 py-2 rounded-md hover:bg-[#3a63b8] transition-colors"
        >
          <Plus className="h-4 w-4 mr-2" />
          Create Portfolio
        </Link>
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
            <Link
              href="/portfolio"
              className="inline-flex items-center bg-[#4573D2] text-white px-4 py-2 rounded-md hover:bg-[#3a63b8] transition-colors"
            >
              <Plus className="h-4 w-4 mr-2" />
              Create Portfolio
            </Link>
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
