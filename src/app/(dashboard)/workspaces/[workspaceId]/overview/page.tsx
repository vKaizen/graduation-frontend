"use client";

import { useState, useEffect } from "react";
import { fetchWorkspaceById } from "@/api-service";
import { useRouter, useParams } from "next/navigation";
import { Workspace, User, Project } from "@/types";
import { Button } from "@/components/ui/button";
import { ChevronDown, Plus, List } from "lucide-react";
import Link from "next/link";
import { fetchWorkspaceMembers, fetchProjectsByWorkspace } from "@/api-service";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

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
  const [isLoadingMembers, setIsLoadingMembers] = useState(true);
  const [isLoadingProjects, setIsLoadingProjects] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoadingMembers(true);
        setIsLoadingProjects(true);
        // Fetch members and projects in parallel
        const [membersData, projectsData] = await Promise.all([
          fetchWorkspaceMembers(workspace._id),
          fetchProjectsByWorkspace(workspace._id),
        ]);
        setMembers(membersData);
        setProjects(projectsData);
      } catch (error) {
        console.error("Failed to load workspace data:", error);
      } finally {
        setIsLoadingMembers(false);
        setIsLoadingProjects(false);
      }
    };
    loadData();
  }, [workspace._id]);

  return (
    <div className="px-6 py-8 bg-[#1a1a1a] min-h-full flex flex-col">
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
                    className="block p-4 rounded-lg bg-[#252525] hover:bg-[#353535] transition-colors border border-[#353535]"
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
          <div>
            <div className="flex items-center justify-between mb-4">
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
                <Button className="h-10 w-10 rounded-full bg-[#252525] hover:bg-[#353535] p-0 border border-[#353535]">
                  <Plus className="h-4 w-4 text-white" />
                </Button>
              </div>
            )}
          </div>

          {/* Goals Section */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-medium text-white">Goals</h2>
              <Button
                variant="outline"
                size="sm"
                className="text-white border-[#353535] bg-[#252525] hover:bg-[#353535] hover:text-white"
              >
                Create goal
              </Button>
            </div>

            <div className="bg-[#252525] rounded-lg p-6 border border-[#353535]">
              <h3 className="text-white font-medium mb-2">
                This team hasn&apos;t created any goals yet
              </h3>
              <p className="text-[#a1a1a1] text-sm mb-4">
                Add a goal so the team can see what you hope to achieve.
              </p>
              <div className="h-4 w-full bg-[#353535] rounded-full"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
