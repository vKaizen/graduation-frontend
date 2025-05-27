"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ChevronLeft, X } from "lucide-react";
import { useWorkspace } from "@/contexts/workspace-context";
import { PermissionGuard } from "@/components/permission/PermissionGuard";
import { createPortfolio } from "@/api-service";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/use-toast";

function CreatePortfolioForm() {
  const router = useRouter();
  const { toast } = useToast();
  const { currentWorkspace } = useWorkspace();
  const [portfolioName, setPortfolioName] = useState("");
  const [selectedView, setSelectedView] = useState("list");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!portfolioName.trim()) {
      toast({
        title: "Error",
        description: "Please enter a portfolio name",
        variant: "destructive",
      });
      return;
    }

    if (!currentWorkspace?._id) {
      toast({
        title: "Error",
        description: "No workspace selected",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsSubmitting(true);

      // Create new portfolio
      const portfolio = await createPortfolio({
        name: portfolioName,
        workspaceId: currentWorkspace._id,
        projects: [], // Add empty projects array to satisfy the DTO type
      });

      toast({
        title: "Success",
        description: "Portfolio created successfully",
      });

      // Redirect to the new portfolio
      router.push(`/insights/portfolios/${portfolio._id}`);
    } catch (error) {
      console.error("Error creating portfolio:", error);
      toast({
        title: "Error",
        description: "Failed to create portfolio. Please try again.",
        variant: "destructive",
      });
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#1A1A1A] flex">
      {/* Left Panel */}
      <div className="w-1/3 border-r border-gray-800 p-8">
        <div className="flex justify-between items-center mb-8">
          <Link
            href="/insights/portfolios"
            className="flex items-center text-gray-400 hover:text-white text-sm transition-colors"
          >
            <ChevronLeft className="h-5 w-5" />
          </Link>
          <Link
            href="/insights/portfolios"
            className="text-gray-400 hover:text-white"
          >
            <X className="h-5 w-5" />
          </Link>
        </div>

        <h1 className="text-3xl font-bold text-white mb-8">New portfolio</h1>

        <div className="space-y-6">
          <div className="space-y-2">
            <label className="text-sm text-gray-400">Portfolio name</label>
            <input
              type="text"
              value={portfolioName}
              onChange={(e) => setPortfolioName(e.target.value)}
              className="w-full bg-transparent border border-gray-700 rounded-md p-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter portfolio name"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm text-gray-400">Privacy</label>
            <div className="relative">
              <select className="w-full appearance-none bg-[#1a1a1a] border border-gray-700 rounded-md p-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 pr-8">
                <option value="public">Public to My workspace</option>
                <option value="private">Private</option>
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                <svg
                  className="h-4 w-4 text-gray-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            
            <div className="grid grid-cols-2 gap-4">
              

              
                
              

              
                
                
            </div>
          </div>
        </div>

        <button
          className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-md mt-8 transition-colors disabled:bg-gray-600 disabled:cursor-not-allowed"
          onClick={handleSubmit}
          disabled={isSubmitting || !portfolioName.trim()}
        >
          {isSubmitting ? "Creating..." : "Continue"}
        </button>
      </div>

      {/* Right Panel - Preview */}
      <div className="w-2/3 p-8">
        <div className="bg-[#222222] rounded-lg border border-gray-800 overflow-hidden">
          {/* Header */}
          <div className="p-4 border-b border-gray-800">
            <div className="flex items-center space-x-3 mb-4">
              <div className="bg-gray-700 h-8 w-8 rounded"></div>
              <h3 className="text-white font-medium">
                {portfolioName || "Portfolio name"}
              </h3>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-gray-800">
              <div className="text-blue-500 border-b-2 border-blue-500 px-4 py-2">
                List
              </div>
              <div className="text-gray-400 px-4 py-2">Timeline</div>
              <div className="text-gray-400 px-4 py-2">Progress</div>
              <div className="text-gray-400 px-4 py-2">Workload</div>
              <div className="text-gray-400 px-4 py-2">Messages</div>
            </div>
          </div>

          {/* Content */}
          <div className="grid grid-cols-4 divide-x divide-gray-800">
            {/* Column headers */}
            <div className="p-3 bg-[#1E1E1E] text-gray-500 text-sm">Task</div>
            <div className="p-3 bg-[#1E1E1E] text-gray-500 text-sm">Status</div>
            <div className="p-3 bg-[#1E1E1E] text-gray-500 text-sm">
              Progress
            </div>
            <div className="p-3 bg-[#1E1E1E] text-gray-500 text-sm">
              Priority
            </div>

            {/* Sample rows */}
            {[...Array(7)].map((_, index) => (
              <React.Fragment key={index}>
                <div className="p-3 border-b border-gray-800 flex items-center">
                  <div
                    className={`h-5 w-5 rounded mr-3 bg-${getRandomColor(
                      index
                    )}-500`}
                  ></div>
                  <div className="bg-gray-700 h-4 w-32 rounded"></div>
                </div>
                <div className="p-3 border-b border-gray-800">
                  <div
                    className={`h-5 w-5 rounded bg-${getRandomColor(
                      index + 1
                    )}-500`}
                  ></div>
                </div>
                <div className="p-3 border-b border-gray-800">
                  <div
                    className={`h-3 w-${getRandomWidth()} rounded bg-green-500`}
                  ></div>
                </div>
                <div className="p-3 border-b border-gray-800 flex justify-between items-center">
                  <div
                    className={`h-3 w-${getRandomWidth()} rounded bg-${getRandomColor(
                      index + 2
                    )}-500`}
                  ></div>
                  <div className="h-8 w-8 rounded-full bg-gray-700"></div>
                </div>
              </React.Fragment>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// Helper functions for the preview
function getRandomColor(seed: number) {
  const colors = ["blue", "green", "pink", "yellow", "purple", "red", "orange"];
  return colors[seed % colors.length];
}

function getRandomWidth() {
  const widths = ["16", "24", "32", "40", "48"];
  return widths[Math.floor(Math.random() * widths.length)];
}

export default function CreatePortfolioPage() {
  return (
    <PermissionGuard action="create" resource="portfolio">
      <CreatePortfolioForm />
    </PermissionGuard>
  );
}
