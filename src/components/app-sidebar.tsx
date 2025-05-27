"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { SidebarNavItem } from "./sidebar-nav-item";
import { WorkspaceSelector } from "./workspace-selector";
import {
  Home,
  Inbox,
  Info,
  Mail,
  Plus,
  Users,
  Rocket,
  Star,
  UserCircle,
  BarChart3,
  Target,
  FolderKanban,
} from "lucide-react";
import {
  getProjectIds,
  fetchProject,
  fetchProjectsByWorkspace,
} from "@/api-service";
import { useWorkspace } from "@/contexts/workspace-context";
import { useAuth } from "@/contexts/AuthContext";
import { getIsLoggingOut } from "@/contexts/AuthContext";
import { useProject } from "@/contexts/project-context";

const scrollbarHideClass = `
  scrollbar-hide [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:none]
`;

function EmptyProjectsState() {
  return (
    <div className="px-4 py-6">
      <div className="rounded-lg bg-[#252525] p-4">
        <div className="flex justify-center space-x-2 mb-4">
          <div className="p-2 bg-blue-500/20 rounded-lg">
            <UserCircle className="h-5 w-5 text-blue-500" />
          </div>
          <div className="p-2 bg-purple-500/20 rounded-lg">
            <Rocket className="h-5 w-5 text-purple-500" />
          </div>
          <div className="p-2 bg-green-500/20 rounded-lg">
            <Star className="h-5 w-5 text-green-500" />
          </div>
        </div>
        <h3 className="text-sm text-center text-gray-200 font-medium mb-2">
          Organize and plan your work with projects
        </h3>
        <Link href="/projects/new" className="block">
          <Button
            variant="secondary"
            className="w-full bg-[#353535] hover:bg-[#404040] text-gray-200"
          >
            New project
          </Button>
        </Link>
      </div>
    </div>
  );
}

export function AppSidebar() {
  const pathname = usePathname();
  const [projects, setProjects] = useState<
    { id: string; name: string; color: string; workspaceId: string }[]
  >([]);
  const [loading, setLoading] = useState(true);
  const { currentWorkspace, setCurrentWorkspace, workspaces } = useWorkspace();
  const { authState } = useAuth();
  const { projectDeleted } = useProject();

  // Use a ref to track the current workspace ID for fetch operations
  const currentWorkspaceIdRef = useRef<string | null>(null);

  // Update ref when workspace changes
  useEffect(() => {
    currentWorkspaceIdRef.current = currentWorkspace?._id || null;
  }, [currentWorkspace]);

  // Handle workspace changes from URL
  useEffect(() => {
    // Skip if we're in the process of logging out
    if (getIsLoggingOut()) {
      return;
    }

    if (pathname && pathname.includes("/workspaces/")) {
      // Extract workspace ID from pathname
      const match = pathname.match(/\/workspaces\/([^\/]+)/);
      if (
        match &&
        match[1] &&
        currentWorkspace &&
        match[1] !== currentWorkspace._id
      ) {
        console.log(
          `URL workspace (${match[1]}) doesn't match current workspace (${currentWorkspace._id})`
        );
        // Find the workspace in the list
        const workspaceFromUrl = workspaces.find((w) => w._id === match[1]);
        if (workspaceFromUrl) {
          console.log(
            `Switching to workspace from URL: ${workspaceFromUrl.name}`
          );
          // Clear projects before switching workspace to prevent showing projects from previous workspace
          setProjects([]);
          setCurrentWorkspace(workspaceFromUrl);
        }
      }
    }
  }, [pathname, workspaces, currentWorkspace, setCurrentWorkspace]);

  // Load projects when workspace changes or when a project is deleted
  useEffect(() => {
    const loadProjects = async () => {
      // Skip if we're in the process of logging out
      if (getIsLoggingOut()) {
        setLoading(false);
        return;
      }

      // Clear projects when workspace changes
      setProjects([]);
      setLoading(true);

      if (!currentWorkspace || !currentWorkspace._id) {
        console.log("No current workspace or workspace ID");
        setLoading(false);
        return;
      }

      // Store the current workspace ID for this fetch operation
      const fetchWorkspaceId = currentWorkspace._id;

      // Skip if user is not authenticated
      if (!authState.userId || !authState.accessToken) {
        console.log("User is not authenticated, skipping project loading");
        setLoading(false);
        return;
      }

      try {
        console.log(
          "AppSidebar: Starting to load projects for workspace",
          fetchWorkspaceId
        );

        // Fetch projects filtered by the current workspace
        const workspaceProjects = await fetchProjectsByWorkspace(
          fetchWorkspaceId
        );

        // Check if we're logging out or workspace changed during fetch
        if (
          getIsLoggingOut() ||
          currentWorkspaceIdRef.current !== fetchWorkspaceId
        ) {
          console.log(
            "Workspace changed during fetch or logging out, discarding results",
            { current: currentWorkspaceIdRef.current, fetch: fetchWorkspaceId }
          );
          setLoading(false);
          return;
        }

        console.log(
          "AppSidebar: Received workspace projects:",
          workspaceProjects?.length || 0
        );

        // Get current user ID from auth context
        const userId = authState.userId;

        if (!userId) {
          console.error("No user ID found in auth context");
          setLoading(false);
          return;
        }

        // Filter to only include projects for the correct workspace and where user is a member
        const userProjects = (workspaceProjects || [])
          .filter((project) => {
            // Ensure project belongs to the current workspace
            if (project.workspaceId !== fetchWorkspaceId) {
              console.warn(
                `Project ${project._id} belongs to workspace ${project.workspaceId}, not current workspace ${fetchWorkspaceId}`
              );
              return false;
            }

            // Ensure project has roles
            if (!project || !project.roles || !Array.isArray(project.roles)) {
              return false;
            }

            // Check if user is a member of this project
            const isMember = project.roles.some((role) => {
              const roleUserId =
                typeof role.userId === "object"
                  ? role.userId._id || role.userId.toString()
                  : role.userId;
              return roleUserId === userId;
            });

            return isMember;
          })
          .map((project) => ({
            id: project._id,
            name: project.name || "Untitled Project",
            color: project.color || "#6366f1",
            workspaceId: project.workspaceId, // Store workspaceId for verification
          }));

        // Final check to ensure workspace hasn't changed
        if (currentWorkspaceIdRef.current !== fetchWorkspaceId) {
          console.warn(
            "Workspace changed during processing, discarding results"
          );
          setLoading(false);
          return;
        }

        console.log(
          `AppSidebar: Found ${userProjects.length} projects for workspace ${fetchWorkspaceId}`
        );
        setProjects(userProjects);
      } catch (error) {
        console.error("Unexpected error in loadProjects:", error);
        // Only clear projects if we're still on the same workspace
        if (currentWorkspaceIdRef.current === fetchWorkspaceId) {
          setProjects([]);
        }
      } finally {
        // Only update loading state if we're still on the same workspace
        if (currentWorkspaceIdRef.current === fetchWorkspaceId) {
          setLoading(false);
        }
      }
    };

    loadProjects();
  }, [
    currentWorkspace?._id,
    authState.userId,
    authState.accessToken,
    projectDeleted,
  ]);

  // Filter projects to only show those from the current workspace
  const filteredProjects = projects.filter(
    (project) => project.workspaceId === currentWorkspace?._id
  );

  return (
    <aside
      className={`w-64 h-[calc(100vh-3.5rem)] bg-[#1a1a1a] flex flex-col border-r border-[#353535] overflow-y-auto ${scrollbarHideClass}`}
    >
      <div className="flex flex-col flex-1">
        {/* Workspace Selector */}
        <WorkspaceSelector />

        {/* Navigation Items */}
        <nav className="space-y-1 px-2 mt-2">
          <SidebarNavItem href="/home" label="Home" icon={Home} />

          <SidebarNavItem href="/inbox" label="Inbox" icon={Inbox} />
        </nav>

        {/* Insights Section */}
        <div className="mt-6 px-2">
          <div className="flex items-center justify-between px-3 py-2">
            <span className="text-sm text-gray-400">Insights</span>
          </div>
          <div className="space-y-1 mt-1">
            <SidebarNavItem
              href="/insights/reporting"
              label="Reporting"
              icon={BarChart3}
            />
            <SidebarNavItem
              href="/insights/goals"
              label="Goals"
              icon={Target}
            />
            <SidebarNavItem
              href="/insights/portfolios"
              label="Portfolios"
              icon={FolderKanban}
            />
          </div>
        </div>

        {/* Projects Section */}
        <div className="mt-6">
          <div className="flex items-center justify-between px-5 py-2">
            <span className="text-sm text-gray-400">Projects</span>
          </div>

          {/* Dynamic Projects List with Empty State */}
          {loading ? (
            <div className="text-gray-400 text-sm px-5">
              Loading projects...
            </div>
          ) : filteredProjects.length === 0 ? (
            <EmptyProjectsState />
          ) : (
            <div className="space-y-1 px-2">
              {filteredProjects.map((project) => (
                <Link
                  key={project.id}
                  href={`/projects/${project.id}/board`}
                  className="block"
                >
                  <Button
                    variant="ghost"
                    className={`w-full justify-start text-gray-300 ${
                      pathname.includes(`/projects/${project.id}`)
                        ? "bg-gray-700 text-white"
                        : ""
                    }`}
                  >
                    <div
                      className="h-3 w-3 rounded-sm mr-3"
                      style={{ backgroundColor: project.color }}
                    />
                    {project.name}
                  </Button>
                </Link>
              ))}
            </div>
          )}
        </div>

        
      </div>
    </aside>
  );
}
