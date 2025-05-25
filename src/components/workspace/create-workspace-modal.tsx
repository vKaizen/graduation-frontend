"use client";

import { useState, useEffect, useRef } from "react";
import { DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createWorkspace, createInvite, fetchUsers } from "@/api-service";
import { useWorkspace } from "@/contexts/workspace-context";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { SafeModal } from "@/components/ui/safe-modal";

interface CreateWorkspaceModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CreateWorkspaceModal({
  isOpen,
  onClose,
}: CreateWorkspaceModalProps) {
  const [workspaceName, setWorkspaceName] = useState("Company or Team Name");
  const [members, setMembers] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const { refreshWorkspaces } = useWorkspace();
  const { authState } = useAuth();
  const router = useRouter();

  // Track whether we're in the process of navigating
  const isNavigating = useRef(false);
  // Track if component is mounted
  const isMounted = useRef(true);

  // Reset form when opening modal
  useEffect(() => {
    if (isOpen) {
      setWorkspaceName("Company or Team Name");
      setMembers("");
      setError(null);
      setSuccessMessage(null);
      isNavigating.current = false;
    }
  }, [isOpen]);

  // Track mount state
  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  async function handleSubmit() {
    // Validation
    if (!workspaceName.trim()) {
      setError("Workspace name is required");
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      setSuccessMessage(null);

      // Create workspace
      const newWorkspace = await createWorkspace(workspaceName);

      // Process member invitations
      if (members.trim()) {
        const memberEmails = members
          .split(",")
          .map((email) => email.trim())
          .filter(Boolean);

        if (memberEmails.length > 0) {
          try {
            const allUsers = await fetchUsers();
            const invitedCount = { success: 0, notFound: 0 };

            for (const email of memberEmails) {
              const user = allUsers.find(
                (u) => u.email?.toLowerCase() === email.toLowerCase()
              );

              if (user) {
                try {
                  await createInvite(
                    authState.accessToken || "",
                    user._id,
                    newWorkspace._id
                  );
                  invitedCount.success++;
                } catch (error) {
                  console.error(`Error inviting user ${email}:`, error);
                }
              } else {
                invitedCount.notFound++;
              }
            }

            // Set success message if component is still mounted
            if (invitedCount.success > 0 && isMounted.current) {
              setSuccessMessage(
                `Workspace created! Sent ${invitedCount.success} invitation${
                  invitedCount.success !== 1 ? "s" : ""
                }.`
              );

              if (invitedCount.notFound > 0) {
                setSuccessMessage(
                  (prev) =>
                    `${prev} ${invitedCount.notFound} email${
                      invitedCount.notFound !== 1 ? "s" : ""
                    } not found.`
                );
              }
            }
          } catch (error) {
            console.error("Error processing invitations:", error);
          }
        }
      }

      // Refresh workspaces to get the new one
      await refreshWorkspaces();

      // Mark that we're about to navigate
      isNavigating.current = true;

      // First close the modal safely
      onClose();

      // Then navigate with a slight delay
      setTimeout(() => {
        router.push(`/workspaces/${newWorkspace._id}/overview`);
      }, 100);
    } catch (error) {
      console.error("Error creating workspace:", error);
      if (isMounted.current) {
        setError("Failed to create workspace. Please try again.");
        setIsLoading(false);
      }
    }
  }

  return (
    <SafeModal
      isOpen={isOpen}
      onClose={onClose}
      className="sm:max-w-md bg-[#1a1a1a] border-[#353535] text-white p-0"
    >
      <DialogHeader className="p-6 pb-2">
        <DialogTitle className="text-xl font-semibold text-white">
          Create new workspace
        </DialogTitle>
      </DialogHeader>

      <div className="p-6 pt-4 space-y-6">
        {error && (
          <div className="bg-red-900/20 border border-red-800 text-red-100 px-3 py-2 rounded text-sm">
            {error}
          </div>
        )}

        {successMessage && (
          <div className="bg-green-900/20 border border-green-800 text-green-100 px-3 py-2 rounded text-sm">
            {successMessage}
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="workspace-name" className="text-gray-400">
            Workspace Name
          </Label>
          <Input
            id="workspace-name"
            value={workspaceName}
            onChange={(e) => setWorkspaceName(e.target.value)}
            className="bg-[#1a1a1a] border-[#353535] text-white focus:border-[#4c4c4c] focus:ring-0"
            onFocus={(e) => {
              if (e.target.value === "Company or Team Name") {
                setWorkspaceName("");
              }
            }}
            disabled={isLoading || isNavigating.current}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="members" className="text-gray-400">
            Invite Members
          </Label>
          <Input
            id="members"
            value={members}
            onChange={(e) => setMembers(e.target.value)}
            className="bg-[#1a1a1a] border-[#353535] text-white focus:border-[#4c4c4c] focus:ring-0"
            placeholder="name@company.com, ..."
            disabled={isLoading || isNavigating.current}
          />
          <p className="text-xs text-gray-500 mt-1">
            Enter email addresses separated by commas. Invitations will be sent.
          </p>
        </div>
      </div>

      <div className="flex justify-between p-6 pt-2 bg-[#1a1a1a] border-t border-[#353535]">
        <Button
          variant="ghost"
          onClick={onClose}
          disabled={isLoading || isNavigating.current}
          className="text-gray-400 hover:text-white"
          type="button"
        >
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          disabled={!workspaceName.trim() || isLoading || isNavigating.current}
          className="bg-blue-600 hover:bg-blue-700 text-white"
          type="button"
        >
          {isLoading
            ? "Creating..."
            : isNavigating.current
            ? "Success..."
            : "Create workspace"}
        </Button>
      </div>
    </SafeModal>
  );
}
