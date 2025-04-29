"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ChevronDown, Plus, Users, List } from "lucide-react";
import Link from "next/link";
import { fetchWorkspaceMembers, fetchProjectsByWorkspace } from "@/api-service";
import type { Workspace, User, Project } from "@/types";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

interface WorkspaceOverviewProps {
  workspace: Workspace;
}

export function WorkspaceOverview({ workspace }: WorkspaceOverviewProps) {
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
    <div className="px-6 py-8">
      <div className="grid grid-cols-3 gap-8">
        {/* Main Content - Curated Work */}
        <div className="col-span-2">
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-medium text-white">Curated work</h2>
              <Button
                variant="ghost"
                className="text-[#353535] hover:text-white"
              >
                View all work <ChevronDown className="ml-1 h-4 w-4 " />
              </Button>
            </div>

            {isLoadingProjects ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="h-16 bg-neutral-800 rounded-lg animate-pulse"
                  ></div>
                ))}
              </div>
            ) : projects.length === 0 ? (
              <div className="bg-neutral-800 rounded-lg p-8 text-center">
                <p className="text-neutral-400 mb-4">
                  Organize links to important work such as portfolios, projects,
                  and documents
                </p>
                <Button
                  variant="outline"
                  className="border-neutral-600 text-white"
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
                    className="block p-4 rounded-lg bg-[#353535] hover:bg-[#1a1a1a] transition-colors"
                  >
                    <div className="flex items-center">
                      <div
                        className="h-8 w-8 rounded-md mr-3 flex items-center justify-center"
                        style={{ backgroundColor: project.color || "#6366f1" }}
                      >
                        <List className="h-4 w-4 text-white" />
                      </div>
                      <div>
                        <h3 className="text-white font-medium">
                          {project.name}
                        </h3>
                        <p className="text-sm text-neutral-400">
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
                className="text-neutral-400 hover:text-white"
              >
                View all 1 <ChevronDown className="ml-1 h-4 w-4" />
              </Button>
            </div>

            {isLoadingMembers ? (
              <div className="flex flex-wrap gap-2">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="h-10 w-10 bg-neutral-700 rounded-full animate-pulse"
                  ></div>
                ))}
              </div>
            ) : (
              <div className="flex flex-wrap gap-2">
                {members.map((member) => (
                  <Avatar key={member._id} className="h-10 w-10 bg-rose-400">
                    <AvatarFallback className="bg-rose-400 text-white">
                      {member.fullName
                        ?.split(" ")
                        .map((n) => n[0])
                        .join("") || member.email.substring(0, 2)}
                    </AvatarFallback>
                  </Avatar>
                ))}
                <Button className="h-10 w-10 rounded-full bg-neutral-800 hover:bg-neutral-700 p-0">
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
                className="text-white border-neutral-700 bg-neutral-800 hover:bg-neutral-700"
              >
                Create goal
              </Button>
            </div>

            <div className="bg-neutral-800 rounded-lg p-6">
              <h3 className="text-white font-medium mb-2">
                This team hasn't created any goals yet
              </h3>
              <p className="text-neutral-400 text-sm mb-4">
                Add a goal so the team can see what you hope to achieve.
              </p>
              <div className="h-4 w-full bg-neutral-700 rounded-full"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
