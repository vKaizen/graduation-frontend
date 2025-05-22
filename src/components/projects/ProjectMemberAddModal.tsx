"use client";

import { useState, useEffect } from "react";
import { useWorkspace } from "@/contexts/workspace-context";
import { fetchWorkspaceMembers, addProjectMember } from "@/api-service";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { User, Project } from "@/types";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { User as UserIcon, Check } from "lucide-react";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import RequireWorkspacePermission from "@/components/workspace/RequireWorkspacePermission";

interface ProjectMemberAddModalProps {
  project: Project;
  onMemberAdded?: () => void;
}

export function ProjectMemberAddModal({
  project,
  onMemberAdded,
}: ProjectMemberAddModalProps) {
  const { currentWorkspace, hasPermission } = useWorkspace();
  const [workspaceMembers, setWorkspaceMembers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMembers, setIsLoadingMembers] = useState(true);
  const [selectedMemberId, setSelectedMemberId] = useState("");
  const [selectedRole, setSelectedRole] = useState<string>("Member");
  const [open, setOpen] = useState(false);

  // Load workspace members
  useEffect(() => {
    if (!currentWorkspace || !open) return;

    const loadWorkspaceMembers = async () => {
      setIsLoadingMembers(true);
      try {
        const members = await fetchWorkspaceMembers(currentWorkspace._id);

        // Filter out members who are already in the project
        const projectMemberIds = project.roles.map((role) =>
          typeof role.userId === "string" ? role.userId : role.userId.toString()
        );

        const filteredMembers = members.filter(
          (member) => !projectMemberIds.includes(member._id)
        );

        setWorkspaceMembers(filteredMembers);
      } catch (error) {
        console.error("Failed to load workspace members:", error);
        toast.error("Failed to load workspace members");
      } finally {
        setIsLoadingMembers(false);
      }
    };

    loadWorkspaceMembers();
  }, [currentWorkspace, project, open]);

  const handleAddMember = async () => {
    if (!selectedMemberId) {
      toast.error("Please select a member to add");
      return;
    }

    setIsLoading(true);
    try {
      const selectedMember = workspaceMembers.find(
        (m) => m._id === selectedMemberId
      );
      const memberName = selectedMember
        ? selectedMember.fullName || selectedMember.email
        : "Selected member";

      await addProjectMember(project._id, {
        userId: selectedMemberId,
        role: selectedRole,
        userName: memberName,
      });

      toast.success(`Added ${memberName} to the project`);
      setSelectedMemberId("");
      setOpen(false);

      if (onMemberAdded) {
        onMemberAdded();
      }
    } catch (error) {
      console.error("Failed to add member to project:", error);
      toast.error("Failed to add member to project");
    } finally {
      setIsLoading(false);
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((part) => (part ? part[0] : ""))
      .join("")
      .toUpperCase();
  };

  return (
    <RequireWorkspacePermission requiredRoles={["owner", "admin"]}>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className="border-dashed border-[#454545] text-neutral-400 hover:text-white"
          >
            <UserIcon className="h-4 w-4 mr-2" />
            Add member
          </Button>
        </DialogTrigger>
        <DialogContent className="bg-[#1a1a1a] border-[#353535] text-white sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-white">Add Project Member</DialogTitle>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            {isLoadingMembers ? (
              <div className="flex justify-center">
                <div className="h-8 w-full bg-[#252525] animate-pulse rounded"></div>
              </div>
            ) : workspaceMembers.length === 0 ? (
              <div className="text-center py-4">
                <div className="text-neutral-400 mb-3">
                  All workspace members are already part of this project
                </div>
                <div className="text-sm text-neutral-500">
                  To add more members, first invite them to your workspace
                </div>
              </div>
            ) : (
              <>
                <div className="grid gap-2">
                  <div className="text-sm text-neutral-300">
                    Select a member
                  </div>
                  <div className="grid grid-cols-1 gap-2 max-h-60 overflow-y-auto pr-1">
                    {workspaceMembers.map((member) => (
                      <div
                        key={member._id}
                        className={`flex items-center justify-between p-2 rounded-md cursor-pointer ${
                          selectedMemberId === member._id
                            ? "bg-violet-900/30 border border-violet-800"
                            : "hover:bg-[#252525] border border-transparent"
                        }`}
                        onClick={() => setSelectedMemberId(member._id)}
                      >
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8 bg-[#252525]">
                            <AvatarFallback className="bg-violet-700 text-white">
                              {getInitials(member.fullName || member.email)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="text-sm text-white">
                            {member.fullName || member.email}
                          </div>
                        </div>
                        {selectedMemberId === member._id && (
                          <Check className="h-4 w-4 text-violet-500" />
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="grid gap-2">
                  <div className="text-sm text-neutral-300">Role</div>
                  <Select value={selectedRole} onValueChange={setSelectedRole}>
                    <SelectTrigger className="bg-[#252525] border-[#353535]">
                      <SelectValue placeholder="Select a role" />
                    </SelectTrigger>
                    <SelectContent className="bg-[#252525] border-[#353535] text-white">
                      <SelectItem value="Member">Member</SelectItem>
                      <SelectItem value="Admin">Admin</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}
          </div>

          <DialogFooter>
            {workspaceMembers.length === 0 ? (
              <Button
                variant="outline"
                onClick={() => setOpen(false)}
                className="bg-[#252525] hover:bg-[#353535] text-white"
              >
                Close
              </Button>
            ) : (
              <Button
                onClick={handleAddMember}
                disabled={!selectedMemberId || isLoading || isLoadingMembers}
                className="bg-violet-700 hover:bg-violet-800 text-white"
              >
                {isLoading ? "Adding..." : "Add to project"}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </RequireWorkspacePermission>
  );
}
