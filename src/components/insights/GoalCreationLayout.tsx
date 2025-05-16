"use client";

import { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { ChevronLeft } from "lucide-react";
import { Goal, GoalTimeframe, Project, User } from "@/types";
import Link from "next/link";
import { GoalPreview } from "./GoalPreview";

interface GoalCreationLayoutProps {
  children: ReactNode;
  title: string;
  onBack?: () => void;
  backUrl?: string;
  goalTitle: string;
  goalDescription: string;
  selectedTimeframe: GoalTimeframe;
  selectedTimeframeYear: number;
  selectedProjects: string[];
  projects: Project[];
  currentUser: User | null;
  isPrivate?: boolean;
  selectedMembers?: string[];
  workspaceUsers?: User[];
  progressSource?: "projects" | "tasks" | "none";
}

export function GoalCreationLayout({
  children,
  title,
  onBack,
  backUrl = "/insights/goals/my-goals",
  goalTitle,
  goalDescription,
  selectedTimeframe,
  selectedTimeframeYear,
  selectedProjects,
  projects,
  currentUser,
  isPrivate = false,
  selectedMembers = [],
  workspaceUsers = [],
  progressSource = "none",
}: GoalCreationLayoutProps) {
  // Find the selected projects from the projects array
  const connectedProjects = projects.filter((project) =>
    selectedProjects.includes(project._id)
  );

  return (
    <div className="flex min-h-screen">
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 flex items-center justify-between p-4 z-10">
        {onBack ? (
          <Button
            variant="ghost"
            size="icon"
            className="text-gray-400 hover:text-white"
            onClick={onBack}
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>
        ) : (
          <Link href={backUrl}>
            <Button
              variant="ghost"
              size="icon"
              className="text-gray-400 hover:text-white"
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
          </Link>
        )}
      </div>

      {/* Main content */}
      <div className="flex flex-1">
        {/* Form column - left side */}
        <div className="w-full lg:w-1/2 bg-[#1E1E1E] p-4 overflow-y-auto">
          <div className="py-8 space-y-6 max-w-md mx-auto">
            <h1 className="text-3xl font-bold text-white">{title}</h1>
            {children}
          </div>
        </div>

        {/* Preview column - right side */}
        <div className="hidden lg:block lg:w-1/2 bg-[#1a3847] p-4 overflow-y-auto">
          <div className="h-full flex flex-col pt-12">
            <h2 className="text-xl font-semibold text-white mb-6 px-4">
              Preview
            </h2>

            <GoalPreview
              title={goalTitle}
              description={goalDescription}
              timeframe={selectedTimeframe}
              timeframeYear={selectedTimeframeYear}
              connectedProjects={connectedProjects}
              owner={currentUser}
              isPrivate={isPrivate}
              selectedMembers={selectedMembers}
              workspaceUsers={workspaceUsers}
              progressSource={progressSource}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
