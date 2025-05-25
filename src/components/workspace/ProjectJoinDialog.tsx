"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { addProjectMember } from "@/api-service";
import { getUserIdCookie } from "@/lib/cookies";

interface ProjectJoinDialogProps {
  projectId: string;
  projectName: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function ProjectJoinDialog({
  projectId,
  projectName,
  isOpen,
  onClose,
  onSuccess,
}: ProjectJoinDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleJoinProject = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const userId = getUserIdCookie();
      if (!userId) {
        throw new Error("User ID not found");
      }

      await addProjectMember(projectId, {
        userId,
        role: "member",
      });

      onSuccess();
      onClose();
    } catch (error) {
      console.error("Error joining project:", error);
      setError("Failed to join project. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md bg-[#1a1a1a] border-[#353535] text-white">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">
            Join "{projectName}"
          </DialogTitle>
        </DialogHeader>

        <div className="py-4">
          <p className="text-gray-300">
            Would you like to join this project? You'll be added as a member and
            gain access to all project content.
          </p>

          {error && (
            <div className="mt-4 p-3 bg-red-900/20 border border-red-800 text-red-100 rounded-md text-sm">
              {error}
            </div>
          )}
        </div>

        <DialogFooter className="sm:justify-between gap-2 sm:gap-0">
          <Button
            type="button"
            variant="ghost"
            onClick={onClose}
            disabled={isLoading}
            className="mt-2 sm:mt-0 order-2 sm:order-1 w-full sm:w-auto border-[#353535] text-gray-300 hover:text-white hover:bg-[#353535]"
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleJoinProject}
            disabled={isLoading}
            className="bg-blue-600 hover:bg-blue-700 order-1 sm:order-2 w-full sm:w-auto"
          >
            {isLoading ? "Joining..." : "Join Project"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
