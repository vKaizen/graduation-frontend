"use client";

import { useRouter } from "next/navigation";
import { useWorkspace } from "@/contexts/workspace-context";
import { useToast } from "@/components/ui/use-toast";
import { ReactNode, useEffect, useRef } from "react";
import { getUserIdCookie } from "@/lib/cookies";

// Removed unused Role type
type PermissionAction = "create" | "edit" | "delete" | "view";
type PermissionResource =
  | "goal"
  | "project"
  | "portfolio"
  | "task"
  | "workspace"
  | "invitation";

// Define the Project type interface based on what's needed for permission checks
interface ProjectWithRoles {
  _id: string;
  roles?: Array<{
    userId: string | { _id: string; toString: () => string };
    role: string;
  }>;
  // Add other required fields as needed
}

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
  // Add other actions for type safety
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

/**
 * Hook to check permissions and provide RBAC functionality
 */
export function useRBAC() {
  const { hasPermission, currentRole } = useWorkspace();
  const router = useRouter();
  const { toast } = useToast();

  // Create a persistent ref to track redirects
  const redirectedRef = useRef<Set<string>>(new Set());

  // Check if user has permission for a specific action on a resource
  // For project-related operations, we need to check project-specific roles
  const checkPermission = (
    action: PermissionAction,
    resource: PermissionResource,
    context?: {
      projectId?: string;
      project?: ProjectWithRoles; // Use the defined interface instead of any
    }
  ): boolean => {
    // For viewing, all users typically have permission
    if (action === "view") return true;

    // For project-specific operations, check project roles if context is provided
    if ((resource === "project" || resource === "task") && context) {
      // Specifically use project roles for project and task resources
      return checkProjectPermission(action, context);
    }

    // Default to workspace permission check for all other cases
    return hasPermission(["owner", "admin"]);
  };

  // Helper function to check project-specific permissions
  const checkProjectPermission = (
    action: PermissionAction,
    context: {
      projectId?: string;
      project?: ProjectWithRoles; // Use the defined interface instead of any
    }
  ): boolean => {
    const { project } = context;

    // If no project data is provided, default to workspace permission
    if (!project || !project.roles) {
      return hasPermission(["owner", "admin"]);
    }

    // Get the current user ID from cookies
    const userId = getUserIdCookie();
    if (!userId) {
      return false;
    }

    // Find the user's role in this specific project
    const userRole = project.roles.find((role) => {
      try {
        const roleUserId =
          typeof role.userId === "object"
            ? role.userId._id || role.userId.toString()
            : role.userId;

        return roleUserId === userId;
      } catch (e) {
        // Log the error but keep going
        console.error("Error comparing user IDs:", e);
        return false;
      }
    });

    if (!userRole) {
      return false;
    }

    // Check if the user's project role has sufficient permissions - CASE INSENSITIVE
    const normalizedRole = userRole.role.toLowerCase();

    switch (action) {
      case "view":
        // Any project member can view
        return true;
      case "create":
      case "edit":
      case "delete":
        // Only project admins/owners can modify
        return normalizedRole === "admin" || normalizedRole === "owner";
      default:
        return false;
    }
  };

  // A component that enforces permissions for protected routes
  const EnforcePermission = ({
    requiredPermission,
    redirectPath,
    context,
    children,
  }: {
    requiredPermission: {
      action: PermissionAction;
      resource: PermissionResource;
    };
    redirectPath?: string;
    context?: {
      projectId?: string;
      project?: ProjectWithRoles;
    };
    children: ReactNode;
  }) => {
    const hasRequired = checkPermission(
      requiredPermission.action,
      requiredPermission.resource,
      context
    );

    // Determine appropriate redirect path based on resource type if not provided
    const getRedirectPath = () => {
      if (redirectPath) return redirectPath;

      // First try to get an action-specific path
      if (
        REDIRECT_MAP[requiredPermission.action]?.[requiredPermission.resource]
      ) {
        return REDIRECT_MAP[requiredPermission.action][
          requiredPermission.resource
        ];
      }

      // Fall back to view paths
      return REDIRECT_MAP.view[requiredPermission.resource] || "/home";
    };

    const finalRedirectPath = getRedirectPath();

    // Create a unique key for this permission check
    const permissionKey = `${requiredPermission.action}-${
      requiredPermission.resource
    }-${finalRedirectPath}${context?.projectId || ""}`;

    useEffect(() => {
      if (!hasRequired && !redirectedRef.current.has(permissionKey)) {
        // Mark this specific permission check as redirected
        redirectedRef.current.add(permissionKey);

        toast({
          title: "Permission Denied",
          description: `You don't have permission to ${requiredPermission.action} this ${requiredPermission.resource}.`,
          variant: "destructive",
        });
        router.push(finalRedirectPath);
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [hasRequired, finalRedirectPath, permissionKey]);

    return <>{children}</>;
  };

  // Function to enforce permissions (wrapper for EnforcePermission)
  const enforcePermission = (
    requiredPermission: {
      action: PermissionAction;
      resource: PermissionResource;
    },
    redirectPath?: string,
    context?: {
      projectId?: string;
      project?: ProjectWithRoles;
    }
  ) => {
    const hasRequired = checkPermission(
      requiredPermission.action,
      requiredPermission.resource,
      context
    );

    return hasRequired;
  };

  // Conditional rendering based on permissions
  const RenderIfPermitted = ({
    action,
    resource,
    children,
    fallback = null,
    context,
  }: {
    action: PermissionAction;
    resource: PermissionResource;
    children: ReactNode;
    fallback?: ReactNode;
    context?: {
      projectId?: string;
      project?: ProjectWithRoles; // Use the defined interface instead of any
    };
  }) => {
    return checkPermission(action, resource, context) ? (
      <>{children}</>
    ) : (
      <>{fallback}</>
    );
  };

  // Get a descriptive message about the current permissions
  const getPermissionMessage = (
    action: PermissionAction,
    resource: PermissionResource,
    context?: {
      projectId?: string;
      project?: ProjectWithRoles; // Use the defined interface instead of any
    }
  ): string => {
    if (checkPermission(action, resource, context)) {
      return "";
    }

    return `You need to be an admin or owner to ${action} a ${resource}.`;
  };

  return {
    checkPermission,
    enforcePermission,
    EnforcePermission,
    RenderIfPermitted,
    getPermissionMessage,
    currentRole,
  };
}
