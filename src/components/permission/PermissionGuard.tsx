"use client";

import { ReactNode, useEffect, useRef } from "react";
import { useRBAC } from "@/hooks/useRBAC";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/use-toast";

// Define the Project type interface based on what's needed for permission checks
interface ProjectWithRoles {
  _id: string;
  roles?: Array<{
    userId: string | { _id: string; toString: () => string };
    role: string;
  }>;
  // Add other required fields as needed
}

type PermissionGuardProps = {
  children: ReactNode;
  action: "create" | "edit" | "delete" | "view";
  resource:
    | "goal"
    | "project"
    | "portfolio"
    | "task"
    | "workspace"
    | "invitation";
  redirectTo?: string;
  fallback?: ReactNode;
  projectId?: string; // Add projectId for project-specific checks
  project?: ProjectWithRoles; // Use the defined interface instead of any
};

// Resource-specific redirect paths
const REDIRECT_MAP: Record<string, Record<string, string>> = {
  // Default view paths for each resource
  view: {
    goal: "/insights/goals/my-goals",
    project: "/home",
    portfolio: "/insights/portfolios",
    task: "/home",
    workspace: "/home",
    invitation: "/home",
  },
  // Create paths for each resource
  create: {
    goal: "/goals/new",
    project: "/projects/new",
    portfolio: "/portfolio",
    task: "/home",
    workspace: "/home",
    invitation: "/home",
  },
  // Add other actions to prevent type errors
  edit: {
    goal: "/insights/goals/my-goals",
    project: "/home",
    portfolio: "/insights/portfolios",
    task: "/home",
    workspace: "/home",
    invitation: "/home",
  },
  delete: {
    goal: "/insights/goals/my-goals",
    project: "/home",
    portfolio: "/insights/portfolios",
    task: "/home",
    workspace: "/home",
    invitation: "/home",
  },
};

export function PermissionGuard({
  children,
  action,
  resource,
  redirectTo,
  fallback = null,
  projectId,
  project,
}: PermissionGuardProps) {
  const { checkPermission } = useRBAC();
  const router = useRouter();
  const { toast } = useToast();

  // Create a context object for project-specific permissions
  const context = projectId || project ? { projectId, project } : undefined;

  // Check permission with the context
  const hasPermission = checkPermission(action, resource, context);
  const hasRedirectedRef = useRef(false);

  // Determine appropriate redirect path based on resource type if not provided
  const getRedirectPath = () => {
    if (redirectTo) return redirectTo;

    // First try to get an action-specific path
    if (REDIRECT_MAP[action]?.[resource]) {
      return REDIRECT_MAP[action][resource];
    }

    // Fall back to view paths
    return REDIRECT_MAP.view[resource] || "/home";
  };

  useEffect(() => {
    if (!hasPermission && !hasRedirectedRef.current) {
      hasRedirectedRef.current = true;
      const redirectPath = getRedirectPath();

      toast({
        title: "Permission Denied",
        description: `You don't have permission to ${action} this ${resource}.`,
        variant: "destructive",
      });

      router.push(redirectPath);
    }
  }, [hasPermission, action, resource, redirectTo, router, toast]);

  return <>{hasPermission ? children : fallback}</>;
}

// Usage example:
// <PermissionGuard action="create" resource="goal">
//   <CreateGoalPage />
// </PermissionGuard>
//
// With project context:
// <PermissionGuard action="edit" resource="task" projectId="project-123">
//   <EditTaskForm />
// </PermissionGuard>
