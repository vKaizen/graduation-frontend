"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { AlertTriangle, Settings, Trash2, AlertCircle } from "lucide-react";
import { Portfolio, Project } from "@/types";
import {
  fetchPortfolioById,
  deletePortfolio,
  removeProjectFromPortfolio,
  fetchProject,
  updatePortfolio,
} from "@/api-service";
import { useToast } from "@/components/ui/use-toast";
import Link from "next/link";
import { PortfolioHeader } from "@/components/insights/portfolios/PortfolioHeader";
import { PortfolioTabs } from "@/components/insights/portfolios/PortfolioTabs";
import { PortfolioContent } from "@/components/insights/portfolios/PortfolioContent";
import { useRBAC } from "@/hooks/useRBAC";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface PortfolioDetailsPageProps {
  params: {
    id: string;
  };
}

export default function PortfolioDetailsPage({
  params: staticParams,
}: PortfolioDetailsPageProps) {
  // Use the useParams hook to safely access params in Next.js 15.1.3+
  const dynamicParams = useParams();
  const portfolioId =
    typeof dynamicParams.id === "string" ? dynamicParams.id : staticParams.id;

  const router = useRouter();
  const { toast } = useToast();
  const { checkPermission, getPermissionMessage } = useRBAC();

  const [portfolio, setPortfolio] = useState<Portfolio | null>(null);
  const [projectsData, setProjectsData] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [activeTab, setActiveTab] = useState<string>("list");
  const [isUpdatingProgress, setIsUpdatingProgress] = useState(false);

  // Check if user has permission to edit/delete portfolios
  const canEditPortfolio = checkPermission("edit", "portfolio");
  const canDeletePortfolio = checkPermission("delete", "portfolio");
  const editPermissionMessage = getPermissionMessage("edit", "portfolio");
  const deletePermissionMessage = getPermissionMessage("delete", "portfolio");

  // Fetch portfolio
  useEffect(() => {
    const loadPortfolio = async () => {
      try {
        setLoading(true);
        setError(null);

        const data = await fetchPortfolioById(portfolioId);
        console.log("Fetched portfolio:", data);

        setPortfolio(data);

        // Check if projects are already populated as objects or just IDs
        const hasPopulatedProjects =
          Array.isArray(data.projects) &&
          data.projects.length > 0 &&
          typeof data.projects[0] !== "string";

        if (hasPopulatedProjects) {
          console.log("Projects are already populated:", data.projects);
          setProjectsData(data.projects as Project[]);
        } else if (Array.isArray(data.projects) && data.projects.length > 0) {
          // If projects are just IDs, we need to fetch each project individually
          console.log(
            "Projects are IDs, fetching project details:",
            data.projects
          );

          try {
            // Get all project IDs (converting objects to IDs if needed)
            const projectIds = data.projects.map((p) =>
              typeof p === "string" ? p : p._id
            );

            // Fetch each project's complete data
            const projectPromises = projectIds.map((id) => fetchProject(id));
            const fetchedProjects = await Promise.all(projectPromises);

            console.log("Fetched individual projects:", fetchedProjects);
            setProjectsData(
              fetchedProjects.filter((p) => p !== null) as Project[]
            );
          } catch (projectErr) {
            console.error("Error fetching project details:", projectErr);
            // Still continue as we at least have the portfolio
          }
        }

        setLoading(false);
      } catch (err) {
        console.error("Error fetching portfolio:", err);
        setError("Failed to load portfolio details. Please try again.");
        setLoading(false);
      }
    };

    loadPortfolio();
  }, [portfolioId]);

  // Handle project removal
  const handleRemoveProject = async (projectId: string) => {
    if (!portfolio) return;

    // Check if user has permission to edit portfolio
    if (!canEditPortfolio) {
      toast({
        title: "Permission Denied",
        description: editPermissionMessage,
        variant: "destructive",
      });
      return;
    }

    try {
      await removeProjectFromPortfolio(portfolio._id, projectId);

      // Update the portfolio state to reflect the removed project
      setPortfolio((prev) => {
        if (!prev) return null;

        // Create a properly typed portfolio object with the updated projects array
        const updatedPortfolio: Portfolio = {
          ...prev,
          // Check if projects are string[] or Project[] and handle accordingly
          projects: Array.isArray(prev.projects)
            ? prev.projects.some((p) => typeof p === "object")
              ? // If we have Project objects, filter out the removed project
                (prev.projects.filter(
                  (p) => typeof p === "object" && p._id !== projectId
                ) as Project[])
              : // If we have string IDs, filter out the removed project ID
                (prev.projects.filter(
                  (id) => typeof id === "string" && id !== projectId
                ) as string[])
            : [],
        };

        return updatedPortfolio;
      });

      // Also update projectsData state
      setProjectsData((prevProjects) =>
        prevProjects.filter((project) => project._id !== projectId)
      );

      toast({
        title: "Project removed",
        description: "Project has been removed from this portfolio",
      });
    } catch (err) {
      console.error("Error removing project:", err);
      toast({
        title: "Error",
        description: "Failed to remove project. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Handle portfolio deletion
  const handleDeletePortfolio = async () => {
    if (!portfolio) return;

    // Check if user has permission to delete portfolio
    if (!canDeletePortfolio) {
      toast({
        title: "Permission Denied",
        description: deletePermissionMessage,
        variant: "destructive",
      });
      return;
    }

    if (
      !confirm(
        "Are you sure you want to delete this portfolio? This action cannot be undone."
      )
    ) {
      return;
    }

    try {
      setIsDeleting(true);
      await deletePortfolio(portfolio._id);

      toast({
        title: "Portfolio deleted",
        description: "Portfolio has been deleted successfully",
      });

      // Redirect to portfolios list
      router.push("/insights/portfolios");
    } catch (err) {
      console.error("Error deleting portfolio:", err);
      toast({
        title: "Error",
        description: "Failed to delete portfolio. Please try again.",
        variant: "destructive",
      });
      setIsDeleting(false);
    }
  };

  // Handle tab change
  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
  };

  // Handle progress updates from task calculation
  const handleProgressCalculated = async (progress: number) => {
    if (!portfolio) return;

    // Check if user has permission to edit portfolio
    if (!canEditPortfolio) {
      console.log("User doesn't have permission to update portfolio progress");
      return;
    }

    // Only update if the progress is different from the current value
    if (progress === portfolio.progress) return;

    try {
      setIsUpdatingProgress(true);

      // Update portfolio in database with new progress
      const updatedPortfolio = await updatePortfolio(portfolio._id, {
        progress,
      });

      // Update local state
      setPortfolio(updatedPortfolio);

      console.log(
        `Updated portfolio progress from ${portfolio.progress}% to ${progress}%`
      );

      // Show toast notification for progress update
      toast({
        title: "Portfolio Progress Updated",
        description: `Progress has been updated to ${progress}%`,
        variant: "default",
      });
    } catch (error) {
      console.error("Error updating portfolio progress:", error);
      toast({
        title: "Error",
        description: "Failed to update portfolio progress",
        variant: "destructive",
      });
    } finally {
      setIsUpdatingProgress(false);
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-[#1E201E] flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Error state
  if (error || !portfolio) {
    return (
      <div className="min-h-screen bg-[#1E201E] flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-red-500/10 border border-red-500/20 text-red-500 rounded-md p-4 flex items-start">
          <AlertTriangle className="h-5 w-5 mr-2 mt-0.5" />
          <div>
            <h3 className="font-medium">Error</h3>
            <p>{error || "Portfolio not found"}</p>
          </div>
        </div>
      </div>
    );
  }

  // Create action buttons with RBAC
  const EditButton = () => {
    const buttonContent = (
      <Link
        href={
          canEditPortfolio ? `/insights/portfolios/${portfolio._id}/edit` : "#"
        }
        className={`${
          canEditPortfolio
            ? "bg-[#252525] hover:bg-[#303030]"
            : "bg-gray-600 cursor-not-allowed"
        } text-white p-1.5 rounded-full`}
        title="Edit Portfolio"
        onClick={(e) => !canEditPortfolio && e.preventDefault()}
      >
        <Settings className="h-4 w-4" />
      </Link>
    );

    return canEditPortfolio ? (
      buttonContent
    ) : (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>{buttonContent}</TooltipTrigger>
          <TooltipContent className="bg-[#252525] text-white border-[#353535]">
            <div className="flex items-center">
              <AlertCircle className="h-4 w-4 text-orange-400 mr-2" />
              <p>{editPermissionMessage}</p>
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  };

  const DeleteButton = () => {
    const buttonContent = (
      <button
        onClick={canDeletePortfolio ? handleDeletePortfolio : undefined}
        className={`${
          canDeletePortfolio
            ? "bg-red-600 hover:bg-red-700"
            : "bg-gray-600 cursor-not-allowed"
        } text-white p-1.5 rounded-full`}
        title="Delete Portfolio"
        disabled={isDeleting || !canDeletePortfolio}
      >
        <Trash2 className="h-4 w-4" />
      </button>
    );

    return canDeletePortfolio ? (
      buttonContent
    ) : (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>{buttonContent}</TooltipTrigger>
          <TooltipContent className="bg-[#252525] text-white border-[#353535]">
            <div className="flex items-center">
              <AlertCircle className="h-4 w-4 text-orange-400 mr-2" />
              <p>{deletePermissionMessage}</p>
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  };

  return (
    <div className="min-h-screen bg-[#121212] flex flex-col">
      {/* Fixed header */}
      <div className="sticky top-0 z-10">
        {/* Header */}
        <PortfolioHeader
          portfolio={portfolio}
          isUpdatingProgress={isUpdatingProgress}
        />

        {/* Tabs */}
        <PortfolioTabs activeTab={activeTab} onTabChange={handleTabChange} />
      </div>

      {/* Scrollable main content area */}
      <div className="flex-1 overflow-auto">
        <PortfolioContent
          activeTab={activeTab}
          portfolio={portfolio}
          projectsData={projectsData}
          onRemoveProject={handleRemoveProject}
          onProgressCalculated={handleProgressCalculated}
        />
      </div>

      {/* Buttons for edit/delete functionality */}
      <div className="fixed bottom-3 right-3 flex flex-col space-y-1.5">
        <EditButton />
        <DeleteButton />
      </div>
    </div>
  );
}
