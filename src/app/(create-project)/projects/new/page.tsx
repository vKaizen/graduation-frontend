"use client";

import { NewProjectForm } from "@/components/projects/new-project-form";
import { PermissionGuard } from "@/components/permission/PermissionGuard";

export default function NewProjectPage() {
  return (
    <PermissionGuard action="create" resource="project">
      <NewProjectForm />
    </PermissionGuard>
  );
}
