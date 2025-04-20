"use client";

import React, { ReactNode } from "react";
import { useWorkspace } from "@/contexts/workspace-context";

type WorkspaceRole = "owner" | "admin" | "member" | null;

interface RequireWorkspacePermissionProps {
  requiredRoles: WorkspaceRole[];
  children: ReactNode;
  fallback?: ReactNode;
}

/**
 * Component that conditionally renders content based on workspace permissions
 *
 * @param requiredRoles - Array of roles that are allowed to view the content
 * @param children - Content to display if user has permission
 * @param fallback - Optional content to display if user doesn't have permission
 */
export default function RequireWorkspacePermission({
  requiredRoles,
  children,
  fallback,
}: RequireWorkspacePermissionProps) {
  const { hasPermission } = useWorkspace();

  // Check if the user has any of the required roles
  const userHasPermission = hasPermission(requiredRoles);

  // If user has permission, render children
  if (userHasPermission) {
    return <>{children}</>;
  }

  // If user doesn't have permission, render fallback or null
  return fallback ? <>{fallback}</> : null;
}
