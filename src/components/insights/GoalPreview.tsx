"use client";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { GoalTimeframe, Project, User } from "@/types";
import {
  ChevronDown,
  Lock,
  Clipboard,
  ListChecks,
  AlertCircle,
} from "lucide-react";

interface GoalPreviewProps {
  title: string;
  description: string;
  timeframe: GoalTimeframe;
  timeframeYear: number;
  connectedProjects: Project[];
  owner: User | null;
  isPrivate?: boolean;
  selectedMembers?: string[];
  workspaceUsers?: User[];
  progressSource?: "projects" | "tasks" | "none";
}

export function GoalPreview({
  title,
  description,
  timeframe,
  timeframeYear,
  connectedProjects,
  owner,
  isPrivate = false,
  selectedMembers = [],
  workspaceUsers = [],
  progressSource = "none",
}: GoalPreviewProps) {
  // Helper function to get user initials
  const getInitials = (name?: string) => {
    if (!name) return "U";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();
  };

  // Find member users
  const memberUsers = selectedMembers
    .map((memberId) => workspaceUsers.find((user) => user._id === memberId))
    .filter((user) => user !== undefined) as User[];

  return (
    <div className="bg-[#1a1a1a] border border-[#353535] rounded-lg overflow-hidden">
      {/* Header with title and members */}
      <div className="p-6 flex items-center justify-between border-b border-[#353535]">
        <div className="flex items-center">
          <h3 className="text-lg font-medium text-white">
            {title || "New goal"}
          </h3>
          {isPrivate && <Lock className="h-4 w-4 ml-2 text-gray-400" />}
        </div>
        <div className="flex items-center">
          <span className="text-gray-400 mr-2">Members</span>
          <div className="flex -space-x-2">
            {/* Owner avatar */}
            {owner && (
              <Avatar className="h-8 w-8 border-2 border-[#1a1a1a] bg-[#f87171]">
                <AvatarFallback>{getInitials(owner.fullName)}</AvatarFallback>
              </Avatar>
            )}

            {/* Selected members (up to 3) */}
            {memberUsers.slice(0, 3).map((member) => (
              <Avatar
                key={member._id}
                className="h-8 w-8 border-2 border-[#1a1a1a] bg-[#4573D2]"
              >
                <AvatarFallback>{getInitials(member.fullName)}</AvatarFallback>
              </Avatar>
            ))}

            {/* Show +X for additional members */}
            {memberUsers.length > 3 && (
              <Avatar className="h-8 w-8 border-2 border-[#1a1a1a] bg-[#353535]">
                <AvatarFallback>+{memberUsers.length - 3}</AvatarFallback>
              </Avatar>
            )}
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex">
        {/* Left side - progress and projects */}
        <div className="flex-1 p-6 border-r border-[#353535]">
          {/* Overall progress */}
          <div className="mb-6">
            <Progress value={0} className="h-1.5 bg-[#353535]" />
          </div>

          {/* Connected projects section - show only if progressSource is projects */}
          {progressSource === "projects" && (
            <div>
              <div className="flex items-center mb-4 text-white">
                <ChevronDown className="h-4 w-4 mr-2" />
                <h4 className="font-medium">Connected projects</h4>
              </div>

              {connectedProjects.length > 0 ? (
                <div className="space-y-4">
                  {connectedProjects.map((project, index) => (
                    <div
                      key={project._id}
                      className="flex items-center justify-between"
                    >
                      <div className="flex items-center">
                        <div
                          className="w-2 h-2 rounded-full mr-2"
                          style={{
                            backgroundColor:
                              project.color || getProjectColor(index),
                          }}
                        ></div>
                        <span className="text-white">{project.name}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Progress
                          value={30}
                          className="w-24 h-1.5 bg-[#353535]"
                        />
                        <Avatar className="h-6 w-6 bg-[#353535]">
                          <AvatarFallback>U</AvatarFallback>
                        </Avatar>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-gray-400 text-sm">
                  No connected projects
                </div>
              )}
            </div>
          )}

          {/* Connected tasks section - show only if progressSource is tasks */}
          {progressSource === "tasks" && (
            <div>
              <div className="flex items-center mb-4 text-white">
                <ChevronDown className="h-4 w-4 mr-2" />
                <h4 className="font-medium">Connected tasks</h4>
              </div>
              <div className="text-gray-400 text-sm">
                No tasks connected yet
              </div>
            </div>
          )}

          {/* Description */}
          <div className="mt-6">
            <h4 className="text-gray-400 text-sm mb-2">Description</h4>
            <p className="text-white text-sm">
              {description || "No description provided"}
            </p>
          </div>
        </div>

        {/* Right side - metadata */}
        <div className="w-64 p-6 space-y-6">
          {/* Owner */}
          <div>
            <h4 className="text-gray-400 text-sm mb-2">Owned by</h4>
            <div className="flex items-center">
              <Avatar className="h-8 w-8 mr-2 bg-[#f87171]">
                <AvatarFallback>{getInitials(owner?.fullName)}</AvatarFallback>
              </Avatar>
              <span className="text-white">
                {owner?.fullName || "Current user"}
              </span>
            </div>
          </div>

          {/* Progress source */}
          <div>
            <h4 className="text-gray-400 text-sm mb-2">Progress source</h4>
            <div className="flex items-center">
              {progressSource === "projects" && (
                <>
                  <Clipboard className="h-4 w-4 mr-2 text-blue-400" />
                  <span className="text-white">Projects</span>
                </>
              )}
              {progressSource === "tasks" && (
                <>
                  <ListChecks className="h-4 w-4 mr-2 text-green-400" />
                  <span className="text-white">Tasks</span>
                </>
              )}
              {progressSource === "none" && (
                <>
                  <AlertCircle className="h-4 w-4 mr-2 text-gray-400" />
                  <span className="text-white">Manual updates</span>
                </>
              )}
            </div>
          </div>

          {/* Time period */}
          <div>
            <h4 className="text-gray-400 text-sm mb-2">Time period</h4>
            <div className="flex items-center">
              <span className="text-white">
                {timeframe} {timeframeYear}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Helper function to generate project colors
function getProjectColor(index: number): string {
  const colors = ["#3b82f6", "#f59e0b", "#ef4444", "#10b981", "#8b5cf6"];
  return colors[index % colors.length];
}
