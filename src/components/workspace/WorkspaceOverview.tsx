"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ChevronDown, Plus, List, UserPlus } from "lucide-react";
import Link from "next/link";
import {
  fetchWorkspaceMembers,
  fetchProjectsByWorkspace,
  fetchProjectMembers,
} from "@/api-service";
import type { Workspace, User, Project } from "@/types";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { MemberInviteModal } from "./MemberInviteModal";
import { TestDialog } from "./TestDialog";
import { TestButton } from "./TestButton";
import { ProjectJoinDialog } from "./ProjectJoinDialog";
import { getUserIdCookie } from "@/lib/cookies";

interface WorkspaceOverviewProps {
  workspace: Workspace;
}

interface ProjectWithMembership extends Project {
  isMember: boolean;
}

export function WorkspaceOverview({ workspace }: WorkspaceOverviewProps) {
  const [members, setMembers] = useState<User[]>([]);
  const [projects, setProjects] = useState<ProjectWithMembership[]>([]);
  const [isLoadingMembers, setIsLoadingMembers] = useState(true);
  const [isLoadingProjects, setIsLoadingProjects] = useState(true);
  const [selectedProject, setSelectedProject] =
    useState<ProjectWithMembership | null>(null);
  const [isJoinDialogOpen, setIsJoinDialogOpen] = useState(false);

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

      // Get current user ID
      const userId = getUserIdCookie();
      console.log("Current user ID:", userId);

      // Default to showing join buttons by marking isMember as false for all projects
      const projectsWithMembership: ProjectWithMembership[] = projectsData.map(
        (project) => ({
          ...project,
          isMember: false, // Default to not a member to ensure join button appears
        })
      );

      // Only if we have a userId, attempt to check membership
      if (userId) {
        try {
          // Check membership for each project
          for (let i = 0; i < projectsWithMembership.length; i++) {
            const project = projectsWithMembership[i];
            try {
              // Fetch project members
              const projectMembers = await fetchProjectMembers(project._id);
              console.log(`Project "${project.name}" members:`, projectMembers);

              // Check if current user is a member
              const isMember = projectMembers.some(
                (member) => member._id === userId
              );

              console.log(`User is member of "${project.name}": ${isMember}`);

              // Update membership status
              projectsWithMembership[i] = {
                ...project,
                isMember,
              };
            } catch (error) {
              console.error(
                `Error checking membership for project ${project.name}:`,
                error
              );
              // Keep default isMember: false
            }
          }
        } catch (error) {
          console.error("Error checking project memberships:", error);
        }
      } else {
        console.warn("No user ID found, showing join buttons for all projects");
      }

      console.log("Projects with membership:", projectsWithMembership);
      setProjects(projectsWithMembership);
    } catch (error) {
      console.error("Failed to load workspace data:", error);

      // Handle the error by showing all projects without membership
      try {
        const projectsData = await fetchProjectsByWorkspace(workspace._id);
        const projectsWithoutMembership = projectsData.map((project) => ({
          ...project,
          isMember: false, // Default all to not members when error occurs
        }));
        setProjects(projectsWithoutMembership);
      } catch (fallbackError) {
        console.error("Failed to load projects in fallback:", fallbackError);
      }
    } finally {
      setIsLoadingMembers(false);
      setIsLoadingProjects(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [workspace._id]);

  const handleJoinClick = (
    project: ProjectWithMembership,
    e: React.MouseEvent
  ) => {
    e.preventDefault();
    e.stopPropagation();
    setSelectedProject(project);
    setIsJoinDialogOpen(true);
  };

  const handleJoinSuccess = () => {
    loadData(); // Refresh the data after joining
  };

  // Function to render project card
  const renderProjectCard = (project: ProjectWithMembership) => {
    const showJoinButton = !project.isMember;

    return (
      <div
        key={project._id}
        className="p-4 rounded-lg bg-[#353535] hover:bg-[#1a1a1a] transition-colors"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <div
              className="h-8 w-8 rounded-md mr-3 flex items-center justify-center"
              style={{
                backgroundColor: project.color || "#6366f1",
              }}
            >
              <List className="h-4 w-4 text-white" />
            </div>
            <div>
              <h3 className="text-white font-medium">{project.name}</h3>
              <p className="text-sm text-neutral-400">
                {project.description || "No description"}
              </p>
            </div>
          </div>

          {showJoinButton ? (
            <Button
              onClick={(e) => handleJoinClick(project, e)}
              size="sm"
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              <UserPlus className="h-4 w-4 mr-1.5" />
              Join
            </Button>
          ) : (
            <Link
              href={`/projects/${project._id}/board`}
              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded"
            >
              View Project
            </Link>
          )}
        </div>
      </div>
    );
  };

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
                {projects
                  .slice(0, 3)
                  .map((project) => renderProjectCard(project))}
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
                View all {members.length}{" "}
                <ChevronDown className="ml-1 h-4 w-4" />
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

                <MemberInviteModal
                  workspaceId={workspace._id}
                  projects={projects.map((p) => ({ id: p._id, name: p.name }))}
                  onInviteSent={loadData}
                />

                {/* Test dialog to see if dialogs work in general */}
                <TestDialog />

                {/* Test button to see if basic button clicks work */}
                <TestButton />
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
                This team hasn&apos;t created any goals yet
              </h3>
              <p className="text-neutral-400 text-sm mb-4">
                Add a goal so the team can see what you hope to achieve.
              </p>
              <div className="h-4 w-full bg-neutral-700 rounded-full"></div>
            </div>
          </div>
        </div>
      </div>

      {/* Join Project Dialog */}
      {selectedProject && (
        <ProjectJoinDialog
          projectId={selectedProject._id}
          projectName={selectedProject.name}
          isOpen={isJoinDialogOpen}
          onClose={() => setIsJoinDialogOpen(false)}
          onSuccess={handleJoinSuccess}
        />
      )}
    </div>
  );
}
