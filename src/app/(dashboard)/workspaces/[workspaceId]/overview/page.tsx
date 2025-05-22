"use client";

import { useState, useEffect } from "react";
import { fetchWorkspaceById } from "@/api-service";
import { useRouter, useParams } from "next/navigation";
import { Workspace, User, Project, Goal } from "@/types";
import { Button } from "@/components/ui/button";
import { ChevronDown, Plus, List } from "lucide-react";
import Link from "next/link";
import {
  fetchWorkspaceMembers,
  fetchProjectsByWorkspace,
  fetchGoals,
} from "@/api-service";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { MemberInviteModal } from "@/components/workspace/MemberInviteModal";

// Simple loading component
function WorkspaceLoading() {
  return (
    <div className="p-8">
      <div className="h-8 w-48 bg-neutral-800 animate-pulse rounded mb-4"></div>
      <div className="h-4 w-64 bg-neutral-800 animate-pulse rounded"></div>
    </div>
  );
}

export default function WorkspaceOverviewPage() {
  const params = useParams();
  const workspaceId =
    typeof params.workspaceId === "string"
      ? params.workspaceId
      : Array.isArray(params.workspaceId)
      ? params.workspaceId[0]
      : "";

  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    // Avoid triggering this effect unnecessarily
    if (!workspaceId) return;

    async function loadWorkspace() {
      try {
        setIsLoading(true);
        setError(null);
        const data = await fetchWorkspaceById(workspaceId);

        // Check if workspace data is valid
        if (!data || !data._id) {
          throw new Error("Invalid workspace data received");
        }

        setWorkspace(data);

        // Set page title after successful load
        if (data.name) {
          document.title = `${data.name} | Workspace Overview`;
        }
      } catch (err) {
        console.error("Error fetching workspace:", err);
        setError(
          err instanceof Error ? err.message : "Failed to load workspace"
        );
      } finally {
        setIsLoading(false);
      }
    }

    loadWorkspace();
  }, [workspaceId]);

  // Loading state
  if (isLoading) {
    return <WorkspaceLoading />;
  }

  // Error state
  if (error) {
    return (
      <div className="p-8 text-center">
        <h2 className="text-2xl font-semibold text-white mb-4">
          {error.includes("401") || error.includes("Unauthorized")
            ? "Authentication Error"
            : error.includes("403") || error.includes("Forbidden")
            ? "Access Denied"
            : "Something went wrong"}
        </h2>
        <p className="text-neutral-400 mb-6">
          {error.includes("401") || error.includes("Unauthorized")
            ? "You need to be logged in to view this workspace."
            : error.includes("403") || error.includes("Forbidden")
            ? "You don't have permission to access this workspace."
            : "We couldn't load the workspace information. Please try again later."}
        </p>
        {(error.includes("401") || error.includes("Unauthorized")) && (
          <button
            onClick={() => router.push("/login")}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded"
          >
            Login
          </button>
        )}
      </div>
    );
  }

  // Success state - Workspace data is loaded
  if (!workspace) return null;

  // Instead of dynamically importing the component, we'll use a direct implementation
  return <ClientWorkspaceOverview workspace={workspace} />;
}

// Direct implementation of the WorkspaceOverview component
function ClientWorkspaceOverview({ workspace }: { workspace: Workspace }) {
  const [members, setMembers] = useState<User[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [isLoadingMembers, setIsLoadingMembers] = useState(true);
  const [isLoadingProjects, setIsLoadingProjects] = useState(true);
  const [isLoadingGoals, setIsLoadingGoals] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoadingMembers(true);
        setIsLoadingProjects(true);
        setIsLoadingGoals(true);

        // Fetch members, projects, and goals in parallel
        const [membersData, projectsData, goalsData] = await Promise.all([
          fetchWorkspaceMembers(workspace._id),
          fetchProjectsByWorkspace(workspace._id),
          fetchGoals({ workspaceId: workspace._id, isPrivate: false }),
        ]);

        setMembers(membersData);
        setProjects(projectsData);
        setGoals(goalsData);
      } catch (error) {
        console.error("Failed to load workspace data:", error);
      } finally {
        setIsLoadingMembers(false);
        setIsLoadingProjects(false);
        setIsLoadingGoals(false);
      }
    };
    loadData();
  }, [workspace._id]);

  const handleCreateGoal = () => {
    router.push("/goals/new");
  };

  // Helper function to get status color based on goal status
  const getStatusStyle = (status: string) => {
    switch (status) {
      case "on-track":
        return {
          bg: "bg-[#1e2e1e]",
          text: "text-green-400",
          dot: "bg-green-500",
        };
      case "at-risk":
        return {
          bg: "bg-[#2e2a1e]",
          text: "text-yellow-400",
          dot: "bg-yellow-500",
        };
      case "off-track":
        return { bg: "bg-[#2e1e1e]", text: "text-red-400", dot: "bg-red-500" };
      case "achieved":
        return {
          bg: "bg-[#1e2e2e]",
          text: "text-blue-400",
          dot: "bg-blue-500",
        };
      default:
        return {
          bg: "bg-[#252525]",
          text: "text-gray-400",
          dot: "bg-gray-500",
        };
    }
  };

  // Function to determine progress color
  const getProgressColor = (progress: number) => {
    if (progress >= 75) return "bg-green-500";
    if (progress >= 50) return "bg-[#4573D2]";
    if (progress >= 25) return "bg-yellow-500";
    return "bg-[#4573D2]";
  };

  return (
    <div className="px-6 py-8 bg-[#121212] min-h-full flex flex-col">
      <div className="grid grid-cols-3 gap-8 flex-1">
        {/* Main Content - Curated Work */}
        <div className="col-span-2">
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-medium text-white">Curated work</h2>
              <Button
                variant="ghost"
                className="text-[#a1a1a1] hover:text-white hover:bg-[#353535]"
              >
                View all work <ChevronDown className="ml-1 h-4 w-4" />
              </Button>
            </div>

            {isLoadingProjects ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="h-16 bg-[#252525] rounded-lg animate-pulse"
                  ></div>
                ))}
              </div>
            ) : projects.length === 0 ? (
              <div className="bg-[#252525] rounded-lg p-8 text-center border border-[#353535]">
                <p className="text-[#a1a1a1] mb-4">
                  Organize links to important work such as portfolios, projects,
                  and documents
                </p>
                <Button
                  variant="outline"
                  className="border-[#353535] text-white hover:bg-[#353535] hover:text-white hover:border-[#454545]"
                >
                  <Plus className="h-4 w-4 mr-2" /> Add curated item
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {projects.slice(0, 3).map((project) => (
                  <Link
                    key={project._id}
                    href={`/projects/${project._id}/board`}
                    className="block p-4 rounded-lg bg-[#1a1a1a] hover:bg-[#353535] transition-colors border border-[#353535]"
                  >
                    <div className="flex items-center">
                      <div
                        className="h-8 w-8 rounded-md mr-3 flex items-center justify-center"
                        style={{ backgroundColor: project.color || "#4573D2" }}
                      >
                        <List className="h-4 w-4 text-white" />
                      </div>
                      <div>
                        <h3 className="text-white font-medium">
                          {project.name}
                        </h3>
                        <p className="text-sm text-[#a1a1a1]">
                          {project.description || "No description"}
                        </p>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="col-span-1 space-y-8">
          {/* Members Section */}
          <div className="bg-[#1a1a1a] rounded-lg p-4 border border-[#353535]">
            <div className="flex items-center  justify-between mb-4">
              <h2 className="text-xl font-medium text-white">Members</h2>
              <Button
                variant="ghost"
                className="text-[#a1a1a1] hover:text-white hover:bg-[#353535]"
              >
                View all {members.length}{" "}
                <ChevronDown className="ml-1 h-4 w-4" />
              </Button>
            </div>

            {isLoadingMembers ? (
              <div className="flex flex-wrap gap-2">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="h-10 w-10 bg-[#353535] rounded-full animate-pulse"
                  ></div>
                ))}
              </div>
            ) : (
              <div className="flex flex-wrap gap-2">
                {members.map((member) => (
                  <Avatar key={member._id} className="h-10 w-10 bg-[#4573D2]">
                    <AvatarFallback className="bg-[#4573D2] text-white">
                      {member.fullName
                        ?.split(" ")
                        .map((n: string) => n[0])
                        .join("") || member.email.substring(0, 2)}
                    </AvatarFallback>
                  </Avatar>
                ))}
                <MemberInviteModal
                  workspaceId={workspace._id}
                  projects={projects.map((p) => ({ id: p._id, name: p.name }))}
                  onInviteSent={() => {
                    // Reload members data after invitation is sent
                    const loadMembers = async () => {
                      try {
                        const membersData = await fetchWorkspaceMembers(
                          workspace._id
                        );
                        setMembers(membersData);
                      } catch (error) {
                        console.error("Failed to reload members data:", error);
                      }
                    };
                    loadMembers();
                  }}
                />
              </div>
            )}
          </div>

          {/* Goals Section */}
          <div className="bg-[#1a1a1a] rounded-lg p-4 border border-[#353535]">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-medium text-white">Goals</h2>
              <Button
                variant="outline"
                size="sm"
                className="text-white border-[#353535] bg-[#252525] hover:bg-[#353535] hover:text-white"
                onClick={handleCreateGoal}
              >
                Create goal
              </Button>
            </div>

            {isLoadingGoals ? (
              <div className="bg-[#252525] rounded-lg p-6 border border-[#353535] flex items-center justify-center">
                <div className="animate-pulse text-[#a1a1a1]">
                  Loading goals...
                </div>
              </div>
            ) : goals.length === 0 ? (
              <div className="bg-[#252525] rounded-lg p-6 border border-[#353535]">
                <h3 className="text-white font-medium mb-2">
                  This team hasn&apos;t created any goals yet
                </h3>
                <p className="text-[#a1a1a1] text-sm mb-4">
                  Add a goal so the team can see what you hope to achieve.
                </p>
                <div className="h-4 w-full bg-[#353535] rounded-full"></div>
              </div>
            ) : (
              <div className="space-y-3">
                {goals.slice(0, 3).map((goal) => {
                  const statusStyle = getStatusStyle(goal.status);
                  const progressColor = getProgressColor(goal.progress);

                  return (
                    <div
                      key={goal._id}
                      className="bg-[#252525] rounded-lg p-4 border border-[#353535] cursor-pointer hover:bg-[#303030] transition-colors"
                      onClick={() => router.push(`/insights/goals/${goal._id}`)}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="text-white font-medium truncate pr-2">
                          {goal.title}
                        </h3>
                        <div
                          className={`text-xs rounded-full px-2 py-0.5 flex items-center ${statusStyle.bg} ${statusStyle.text}`}
                        >
                          <span
                            className={`h-1.5 w-1.5 rounded-full ${statusStyle.dot} mr-1`}
                          ></span>
                          {goal.status === "no-status"
                            ? "No status"
                            : goal.status.replace(/-/g, " ")}
                        </div>
                      </div>

                      <div className="relative pt-1 mb-2">
                        <div className="flex items-center justify-between mb-1">
                          <div className="text-xs text-[#a1a1a1]">
                            {goal.progress}% Complete
                          </div>
                        </div>
                        <div className="flex h-2 bg-[#353535] rounded-full overflow-hidden">
                          <div
                            className={`${progressColor} rounded-full transition-all duration-300`}
                            style={{ width: `${goal.progress}%` }}
                          ></div>
                        </div>
                      </div>

                      <div className="flex justify-between items-center text-xs text-[#a1a1a1]">
                        <span>
                          {goal.timeframe} {goal.timeframeYear}
                        </span>
                        {goal.progress === 100 && (
                          <span className="text-green-400 font-medium">
                            Completed
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
                {goals.length > 3 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full text-[#4573D2] hover:text-[#5584E3] hover:bg-[#252525]"
                    onClick={() =>
                      router.push("/insights/goals/workspace-goals")
                    }
                  >
                    View all goals
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
