import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { Briefcase, ChevronRight, LayoutGrid } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { Portfolio, Project, Task } from "@/types";
import { PortfolioStatusBadge } from "./PortfolioStatusBadge";
import { ProgressIndicator } from "./ProgressIndicator";
import { getInitials, formatUsername } from "@/lib/user-utils";
import { fetchTasksByProject, fetchProject } from "@/api-service";

interface PortfolioCardProps {
  portfolio: Portfolio;
  className?: string;
}

export const PortfolioCard = ({ portfolio, className }: PortfolioCardProps) => {
  // State for real progress calculation
  const [realProgress, setRealProgress] = useState<number>(
    portfolio.progress || 0
  );
  const [isCalculating, setIsCalculating] = useState<boolean>(false);
  const calculationRef = useRef<boolean>(false);

  // Get the count of projects
  const projectCount = Array.isArray(portfolio.projects)
    ? portfolio.projects.length
    : 0;

  // Format the owner name - handle different possible formats
  let ownerName = "Unknown";

  if (typeof portfolio.owner === "object") {
    if (portfolio.owner?.fullName) {
      ownerName = portfolio.owner.fullName;
    } else if (portfolio.owner?.email) {
      ownerName = formatUsername(portfolio.owner.email);
    }
  } else if (typeof portfolio.owner === "string") {
    // Check if it's an email address
    if (portfolio.owner.includes("@")) {
      ownerName = formatUsername(portfolio.owner);
    } else {
      // It's likely a user ID
      ownerName = `User ${portfolio.owner.substring(0, 6)}`;
    }
  }

  // Use the utility function for initials
  const ownerInitial = getInitials(ownerName);

  // Calculate real progress based on task completion
  useEffect(() => {
    const calculateRealProgress = async () => {
      // Prevent concurrent calculations
      if (calculationRef.current) return;
      if (projectCount === 0) return;

      calculationRef.current = true;
      setIsCalculating(true);

      try {
        // Get project IDs from portfolio
        const projectIds = Array.isArray(portfolio.projects)
          ? portfolio.projects.map((p) => (typeof p === "string" ? p : p._id))
          : [];

        if (projectIds.length === 0) {
          setRealProgress(0);
          return;
        }

        // Track progress for each project
        const projectProgressMap: Record<string, number> = {};
        let totalTasks = 0;
        let completedTasks = 0;

        // Fetch and calculate progress for each project
        for (const projectId of projectIds) {
          try {
            // First make sure we have full project data
            const projectData = await fetchProject(projectId);
            if (!projectData) continue;

            // Get all tasks for this project
            const tasks: Task[] = await fetchTasksByProject(projectId);

            if (tasks && tasks.length > 0) {
              // Count tasks and completed tasks
              const projectTotalTasks = tasks.length;
              const projectCompletedTasks = tasks.filter(
                (task) => task.completed || task.status === "completed"
              ).length;

              // Add to totals
              totalTasks += projectTotalTasks;
              completedTasks += projectCompletedTasks;

              // Calculate project progress
              const projectProgress =
                projectTotalTasks > 0
                  ? Math.round(
                      (projectCompletedTasks / projectTotalTasks) * 100
                    )
                  : 0;

              projectProgressMap[projectId] = projectProgress;
            }
          } catch (error) {
            console.error(
              `Error calculating progress for project ${projectId}:`,
              error
            );
          }
        }

        // Calculate overall progress
        const calculatedProgress =
          totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

        setRealProgress(calculatedProgress);
      } catch (error) {
        console.error("Error calculating portfolio progress:", error);
      } finally {
        setIsCalculating(false);
        calculationRef.current = false;
      }
    };

    calculateRealProgress();
  }, [portfolio.projects, projectCount]);

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
        <ProgressIndicator progress={realProgress} />
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
          <Avatar className="h-6 w-6 bg-[#4573D2] flex items-center justify-center">
            <span className="text-[10px] font-medium text-white">
              {ownerInitial}
            </span>
          </Avatar>
        </div>
      </div>
    </Link>
  );
};
