"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { SidebarNavItem } from "./sidebar-nav-item";
import { Home, Inbox, Info, Mail, Plus, Users } from "lucide-react";
import { getProjectIds, fetchProject } from "@/api-service"; // Import API functions

const scrollbarHideClass = `
  scrollbar-hide [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:none]
`;

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
        const projectIds = await getProjectIds();
        const projectPromises = projectIds.map((id) => fetchProject(id));
        const projectResults = await Promise.all(projectPromises);

        const projectList = projectResults
          .filter((project) => project !== null)
          .map((project) => ({
            id: project!._id,
            name: project!.name || "Untitled Project",
            color: project!.color || "#6366f1", // Default to indigo if no color
          }));

        setProjects(projectList);
      } catch (error) {
        console.error("Error fetching projects:", error);
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
          <SidebarNavItem href="/tasks" label="My Tasks" icon={Info} />
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
          <div className="mt-6 px-2">
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

            {/* Dynamic Projects List */}
            {loading ? (
              <div className="text-gray-400 text-sm px-3">
                Loading projects...
              </div>
            ) : (
              <div className="space-y-1">
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
