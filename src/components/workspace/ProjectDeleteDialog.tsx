"use client";

import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { deleteProject } from "@/api-service";
import { useProject } from "@/contexts/project-context";

interface ProjectDeleteDialogProps {
  projectId: string;
  projectName: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function ProjectDeleteDialog({
  projectId,
  projectName,
  isOpen,
  onClose,
  onSuccess,
}: ProjectDeleteDialogProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { refreshSidebar } = useProject();

  const handleDelete = async () => {
    try {
      setIsDeleting(true);
      setError(null);

      // Call the API to delete the project
      await deleteProject(projectId);

      // Refresh the sidebar to remove the deleted project
      refreshSidebar();

      // Call the success callback
      onSuccess();
    } catch (error: any) {
      setError(error?.message || "Failed to delete project. Please try again.");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-[#252525] border-[#353535] text-white sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-white">
            Delete Project
          </DialogTitle>
        </DialogHeader>

        <div className="py-4">
          <p className="text-[#e0e0e0] mb-4">
            Are you sure you want to delete{" "}
            <span className="font-medium">{projectName}</span>?
          </p>
          <p className="text-[#a1a1a1] text-sm">
            This action cannot be undone. All project data, including tasks,
            sections, and comments will be permanently deleted.
          </p>

          {error && (
            <div className="mt-4 p-3 bg-red-900/30 border border-red-900 rounded-md text-red-200 text-sm">
              {error}
            </div>
          )}
        </div>

        <DialogFooter className="sm:justify-between">
          <Button
            type="button"
            variant="ghost"
            onClick={onClose}
            className="text-white hover:bg-[#353535]"
            disabled={isDeleting}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={handleDelete}
            className="bg-red-600 hover:bg-red-700 text-white"
            disabled={isDeleting}
          >
            {isDeleting ? "Deleting..." : "Delete Project"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
