"use client";

import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { createInvite, fetchUsers } from "@/api-service";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Loader2 } from "lucide-react";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface MemberInviteModalProps {
  workspaceId: string;
  projects?: Array<{ id: string; name: string }>;
  onInviteSent?: () => void;
}

export function MemberInviteModal({
  workspaceId,
  projects = [],
  onInviteSent,
}: MemberInviteModalProps) {
  const { authState } = useAuth();
  const [emails, setEmails] = useState<string>("");
  const [selectedProjects, setSelectedProjects] = useState<string[]>([]);
  const [selectedRole, setSelectedRole] = useState<string>("member");
  const [isLoading, setIsLoading] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [open, setOpen] = useState(false);

  // Function to find users by email and send invites
  const handleSendInvites = async () => {
    if (!emails.trim()) {
      toast.error("Please enter at least one email address");
      return;
    }

    setIsLoading(true);

    try {
      // Split emails by commas and clean whitespace
      const emailList = emails
        .split(",")
        .map((email) => email.trim())
        .filter((email) => email.length > 0);

      if (emailList.length === 0) {
        toast.error("Please enter valid email addresses");
        setIsLoading(false);
        return;
      }

      // First, search for users by email
      setIsSearching(true);
      const allUsers = await fetchUsers();
      setIsSearching(false);

      // Match users by email
      const matchedUsers = allUsers.filter((user) =>
        emailList.includes(user.email)
      );

      if (matchedUsers.length === 0) {
        toast.error("No registered users found with those email addresses");
        setIsLoading(false);
        return;
      }

      // Send invites to each user
      const invitePromises = matchedUsers.map((user) => {
        console.log(
          `Sending invite to ${user.email} with role: ${selectedRole} and selected projects:`,
          selectedProjects
        );
        return createInvite(
          authState.accessToken || "",
          user._id,
          workspaceId,
          selectedProjects.length > 0 ? selectedProjects : undefined,
          selectedRole // Pass the selected role to createInvite
        );
      });

      await Promise.all(invitePromises);

      toast.success(`Invitations sent to ${matchedUsers.length} users`);

      // Reset form
      setEmails("");
      setSelectedProjects([]);
      setSelectedRole("member");
      setOpen(false);

      // Call the callback if provided
      if (onInviteSent) {
        onInviteSent();
      }
    } catch (error) {
      console.error("Failed to send invites:", error);
      toast.error("Failed to send invitations. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleProjectSelection = (projectId: string) => {
    setSelectedProjects((prev) => {
      if (prev.includes(projectId)) {
        return prev.filter((id) => id !== projectId);
      } else {
        return [...prev, projectId];
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="h-10 w-10 rounded-full bg-[#252525] hover:bg-[#353535] p-0 border border-[#353535]">
          <Plus className="h-4 w-4 text-white" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md bg-[#1a1a1a] border border-[#353535] text-white">
        <DialogHeader>
          <DialogTitle className="text-white">
            Invite people to workspace
          </DialogTitle>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          {/* Email input field */}
          <div className="grid gap-2">
            <Label htmlFor="emails" className="text-[#a1a1a1]">
              Email addresses
            </Label>
            <Input
              id="emails"
              placeholder="name@gmail.com, name@gmail.com, ..."
              value={emails}
              onChange={(e) => setEmails(e.target.value)}
              disabled={isLoading}
              className="bg-[#252525] border-[#353535] text-white placeholder:text-[#666666] focus-visible:ring-[#4573D2] focus-visible:ring-offset-[#1a1a1a]"
            />
          </div>

          {/* Role selection */}
          <div className="grid gap-2">
            <Label htmlFor="role" className="text-[#a1a1a1]">
              Member role
            </Label>
            <Select
              value={selectedRole}
              onValueChange={setSelectedRole}
              disabled={isLoading}
            >
              <SelectTrigger
                id="role"
                className="bg-[#252525] border-[#353535] text-white focus:ring-[#4573D2] focus:ring-offset-[#1a1a1a]"
              >
                <SelectValue placeholder="Select role" />
              </SelectTrigger>
              <SelectContent className="bg-[#252525] border-[#353535] text-white">
                <SelectItem
                  value="admin"
                  className="focus:bg-[#353535] focus:text-white"
                >
                  Admin
                </SelectItem>
                <SelectItem
                  value="member"
                  className="focus:bg-[#353535] focus:text-white"
                >
                  Member
                </SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-[#a1a1a1] mt-1">
              {selectedRole === "admin"
                ? "Admins can manage workspace settings and members"
                : "Members can participate in projects but cannot modify workspace settings"}
            </p>
          </div>

          {/* Project selection */}
          {projects.length > 0 && (
            <div className="grid gap-2">
              <Label htmlFor="projects" className="text-[#a1a1a1]">
                Add to projects (optional)
              </Label>
              <div className="space-y-2">
                <div className="flex flex-wrap gap-2">
                  {projects.map((project) => (
                    <Button
                      key={project.id}
                      variant={
                        selectedProjects.includes(project.id)
                          ? "default"
                          : "outline"
                      }
                      className={
                        selectedProjects.includes(project.id)
                          ? "bg-[#4573D2] hover:bg-[#3a62b3] text-white"
                          : "bg-[#252525] hover:bg-[#353535] border-[#353535] text-white"
                      }
                      onClick={() => handleProjectSelection(project.id)}
                    >
                      {project.name}
                    </Button>
                  ))}
                </div>
              </div>

              {selectedProjects.length > 0 && (
                <div className="mt-2">
                  <p className="text-sm text-[#a1a1a1] mb-1">
                    Selected projects ({selectedProjects.length}):
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {selectedProjects.map((projectId) => {
                      const project = projects.find((p) => p.id === projectId);
                      return project ? (
                        <span
                          key={projectId}
                          className="bg-[#353535] text-white text-sm px-2 py-1 rounded-md flex items-center"
                        >
                          {project.name}
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-5 w-5 p-0 ml-1 text-white hover:bg-[#4a4a4a] rounded-full"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleProjectSelection(projectId);
                            }}
                          >
                            ×
                          </Button>
                        </span>
                      ) : null;
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            type="submit"
            onClick={handleSendInvites}
            disabled={isLoading || isSearching}
            className="bg-[#4573D2] hover:bg-[#3a62b3] text-white"
          >
            {isLoading || isSearching ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {isSearching ? "Searching users..." : "Sending..."}
              </>
            ) : (
              "Send"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
