"use client";

import React, { useState } from "react";
import {
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { deleteProject } from "@/api-service";
import { Dialog } from "@/components/ui/dialog";
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
  const { refreshSidebar } = useProject();

  // Safe wrapper for close
  const handleClose = () => {
    if (!isDeleting) {
      onClose();
    }
  };

  // Handle delete button click
  const handleDelete = () => {
    // Set deleting state
    setIsDeleting(true);

    // Close the dialog immediately
    onClose();

    // Use setTimeout to ensure the dialog is fully closed before deletion
    setTimeout(async () => {
      try {
        // Delete the project
        await deleteProject(projectId);

        // After successful deletion, refresh sidebar and call success callback
        refreshSidebar();
        onSuccess();
      } catch (error) {
        console.error("Error deleting project:", error);
      }
    }, 150);
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
        <div className="bg-[#252525] border-[#353535] text-white p-6 rounded-lg max-w-md w-full shadow-lg">
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
          </div>

          <DialogFooter className="sm:justify-between">
            <Button
              type="button"
              variant="ghost"
              onClick={handleClose}
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
        </div>
      </div>
    </Dialog>
  );
}
