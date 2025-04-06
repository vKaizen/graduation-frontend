"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { SidebarNavItem } from "./sidebar-nav-item";
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
} from "lucide-react";
import { getProjectIds, fetchProject } from "@/api-service"; // Import API functions

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

  useEffect(() => {
    const loadProjects = async () => {
      try {
        setLoading(true);
        console.log("AppSidebar: Starting to load projects");
        const projectIds = await getProjectIds();
        console.log("AppSidebar: Received project IDs:", projectIds);

        const projectPromises = projectIds.map((id) => fetchProject(id));
        const projectResults = await Promise.all(projectPromises);
        console.log("AppSidebar: Fetched project details:", projectResults);

        const projectList = projectResults
          .filter((project) => project !== null)
          .map((project) => ({
            id: project!._id,
            name: project!.name || "Untitled Project",
            color: project!.color || "#6366f1", // Default to indigo if no color
          }));

        console.log("AppSidebar: Final processed project list:", projectList);
        setProjects(projectList);
      } catch (error) {
        console.error("Error in AppSidebar loadProjects:", error);
      } finally {
        setLoading(false);
      }
    };

    loadProjects();
  }, []);

  return (
    <aside
      className={`w-64 h-[calc(100vh-3.5rem)] bg-[#1a1a1a] flex flex-col border-r border-[#353535] overflow-y-auto ${scrollbarHideClass}`}
    >
      <div className="flex flex-col flex-1">
        {/* Navigation Items */}
        <nav className="space-y-1 px-2 mt-2">
          <SidebarNavItem href="/home" label="Home" icon={Home} />
          <SidebarNavItem href="/my-tasks" label="My Tasks" icon={Info} />
          <SidebarNavItem href="/inbox" label="Inbox" icon={Inbox} />
        </nav>

        {/* Insights & Projects Section */}
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

          {/* Projects Section */}
          <div className="mt-6">
            <div className="flex items-center justify-between px-3 py-2">
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
              <div className="text-gray-400 text-sm px-3">
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
        </div>

        {/* Team Section */}
        <div className="mt-6 px-2">
          <div className="flex items-center justify-between px-3 py-2">
            <span className="text-sm text-gray-400">Team</span>
          </div>
          <SidebarNavItem href="/workspace" label="My Workspace" icon={Users} />
        </div>

        {/* Bottom Section */}
        <div className="mt-auto space-y-2 p-2">
          <SidebarNavItem href="/about" label="About" icon={Info} />
          <Button
            variant="outline"
            className="w-full border-gray-600 text-gray-300"
          >
            <Mail className="h-4 w-4 mr-2" />
            Invite teammates
          </Button>
        </div>
      </div>
    </aside>
  );
}
