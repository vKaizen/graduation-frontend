"use client";

import { useEffect, useState } from "react";
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
    { id: string; name: string; color: string }[]
  >([]);
  const [loading, setLoading] = useState(true);
  const { currentWorkspace, setCurrentWorkspace, workspaces } = useWorkspace();
  const { authState } = useAuth();

  // Add new useEffect to detect workspace change from URL
  useEffect(() => {
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
          setCurrentWorkspace(workspaceFromUrl);
        }
      }
    }
  }, [pathname, workspaces, currentWorkspace, setCurrentWorkspace]);

  useEffect(() => {
    const loadProjects = async () => {
      if (!currentWorkspace || !currentWorkspace._id) {
        console.log("No current workspace or workspace ID");
        setProjects([]);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        console.log(
          "AppSidebar: Starting to load projects for workspace",
          currentWorkspace._id
        );

        // Fetch projects filtered by the current workspace
        // Note: The backend API returns all accessible projects (including public ones)
        const workspaceProjects = await fetchProjectsByWorkspace(
          currentWorkspace._id
        );

        console.log(
          "AppSidebar: Received workspace projects:",
          workspaceProjects
        );

        // Get current user ID from auth context
        const userId = authState.userId;
        console.log("Current user ID from auth context:", userId);

        if (!userId) {
          console.error("No user ID found in auth context");
          setProjects([]);
          setLoading(false);
          return;
        }

        // Filter to only include projects where the user is explicitly a member
        const userProjects = (workspaceProjects || [])
          .filter((project) => {
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

            console.log(
              `Project ${project.name} (${project._id}) - User is member: ${isMember}`
            );

            // Only show projects where user is an actual member
            return isMember;
          })
          .map((project) => ({
            id: project._id,
            name: project.name || "Untitled Project",
            color: project.color || "#6366f1", // Default to indigo if no color
          }));

        console.log("AppSidebar: User's projects:", userProjects);
        setProjects(userProjects);
      } catch (error) {
        console.error("Unexpected error in loadProjects:", error);
        setProjects([]);
      } finally {
        setLoading(false);
      }
    };

    loadProjects();
  }, [currentWorkspace, authState.userId, pathname]);

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
          <SidebarNavItem href="/my-tasks" label="My Tasks" icon={Info} />
          <SidebarNavItem href="/inbox" label="Inbox" icon={Inbox} />
        </nav>

        {/* Insights Section */}
        <div className="mt-6 px-2">
          <div className="flex items-center justify-between px-3 py-2">
            <span className="text-sm text-gray-400">Insights</span>
            <Button
              variant="ghost"
              size="icon"
              className="h-4 w-4 text-gray-400"
            >
              <Plus className="h-3 w-3" />
            </Button>
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
            <Button
              variant="ghost"
              size="icon"
              className="h-4 w-4 text-gray-400 hover:text-white"
              asChild
            >
              <Link href="/projects/new">
                <Plus className="h-3 w-3" />
              </Link>
            </Button>
          </div>

          {/* Dynamic Projects List with Empty State */}
          {loading ? (
            <div className="text-gray-400 text-sm px-5">
              Loading projects...
            </div>
          ) : projects.length === 0 ? (
            <EmptyProjectsState />
          ) : (
            <div className="space-y-1 px-2">
              {projects.map((project) => (
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

        {/* Bottom Section */}
        <div className="mt-auto space-y-2 p-2">
          <SidebarNavItem href="/about" label="About" icon={Info} />
          <Button
            variant="outline"
            className="w-full border-gray-600 text-gray-300"
          >
            <Mail className="h-4 w-4 mr-2" />
            Invite collaborators
          </Button>
        </div>
      </div>
    </aside>
  );
}
