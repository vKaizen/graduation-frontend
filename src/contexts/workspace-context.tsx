"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { Workspace } from "@/types";
import {
  fetchWorkspaces,
  createWorkspace,
  getUserWorkspaceRole,
} from "@/api-service";
import { getCookie, setCookie } from "@/lib/cookies";
import { getIsLoggingOut } from "@/contexts/AuthContext";

type WorkspaceRole = "owner" | "admin" | "member" | null;

interface WorkspaceContextType {
  workspaces: Workspace[];
  currentWorkspace: Workspace | null;
  currentRole: WorkspaceRole;
  isLoading: boolean;
  error: string | null;
  setCurrentWorkspace: (workspace: Workspace) => void;
  refreshWorkspaces: () => Promise<void>;
  hasPermission: (requiredRoles: WorkspaceRole[]) => boolean;
}

const WorkspaceContext = createContext<WorkspaceContextType | undefined>(
  undefined
);

export function WorkspaceProvider({ children }: { children: ReactNode }) {
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [currentWorkspace, setCurrentWorkspace] = useState<Workspace | null>(
    null
  );
  const [currentRole, setCurrentRole] = useState<WorkspaceRole>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch user's role in current workspace
  const fetchCurrentRole = async (workspaceId: string) => {
    // Skip if we're in the process of logging out
    if (getIsLoggingOut()) {
      return;
    }

    try {
      const { role } = await getUserWorkspaceRole(workspaceId);
      // Check if we're logging out after the API call
      if (!getIsLoggingOut()) {
        setCurrentRole(role);
      }
    } catch (err) {
      console.error("Error fetching user role:", err);
      setCurrentRole(null);
    }
  };

  // Check if user has permission based on their role
  const hasPermission = (requiredRoles: WorkspaceRole[]): boolean => {
    // If logging out, return false
    if (getIsLoggingOut()) {
      return false;
    }

    // If no role is found but the user is checking for owner permissions,
    // check if the current user is the owner of the workspace
    if (!currentRole && requiredRoles.includes("owner") && currentWorkspace) {
      const userId = localStorage.getItem("userId");
      return userId === currentWorkspace.owner?.toString();
    }

    // Case-insensitive role checking
    if (!currentRole) return false;

    // Convert current role to lowercase for comparison
    const normalizedCurrentRole = currentRole.toLowerCase();

    // Convert all required roles to lowercase for comparison
    const normalizedRequiredRoles = requiredRoles.map((role) =>
      role ? (role.toLowerCase() as WorkspaceRole) : null
    );

    return normalizedRequiredRoles.includes(
      normalizedCurrentRole as WorkspaceRole
    );
  };

  // Handle workspaces with old or new member structure format
  const processWorkspace = (workspace: Workspace): Workspace => {
    // If members is an array of strings (old format), convert to new format
    if (Array.isArray(workspace.members) && workspace.members.length > 0) {
      if (typeof workspace.members[0] !== "object") {
        // Convert old format to new format
        const newMembers = workspace.members.map((member: any) => ({
          userId: member,
          role: "member" as const,
        }));
        return { ...workspace, members: newMembers };
      }
    }
    return workspace;
  };

  const refreshWorkspaces = async () => {
    // Skip if we're in the process of logging out
    if (getIsLoggingOut()) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const fetchedWorkspaces = await fetchWorkspaces();

      // Check if we're logging out after the API call
      if (getIsLoggingOut()) {
        setIsLoading(false);
        return;
      }

      // Process workspaces to ensure consistent member structure
      const processedWorkspaces = fetchedWorkspaces.map(processWorkspace);
      setWorkspaces(processedWorkspaces);

      // If there are no workspaces, create a default one
      if (processedWorkspaces.length === 0) {
        // Skip workspace creation if logging out
        if (getIsLoggingOut()) {
          setIsLoading(false);
          return;
        }

        const newWorkspace = await createWorkspace("My Workspace");

        // Check if we're logging out after workspace creation
        if (getIsLoggingOut()) {
          setIsLoading(false);
          return;
        }

        const processedNewWorkspace = processWorkspace(newWorkspace);
        setWorkspaces([processedNewWorkspace]);

        // Set as current workspace
        setCurrentWorkspace(processedNewWorkspace);
        setCookie("currentWorkspaceId", processedNewWorkspace._id, 30); // expires in 30 days
        setCurrentRole("owner"); // User is automatically owner of new workspace
      }
      // Otherwise, try to set the current workspace from saved ID or use the first one
      else if (!currentWorkspace) {
        // First check for defaultWorkspaceId from login, stored in session/local storage
        const defaultWorkspaceId = localStorage.getItem("defaultWorkspaceId");
        // Then check for saved workspace preference
        const savedWorkspaceId =
          defaultWorkspaceId || getCookie("currentWorkspaceId");

        const savedWorkspace = savedWorkspaceId
          ? processedWorkspaces.find((w) => w._id === savedWorkspaceId)
          : undefined;

        if (savedWorkspace) {
          setCurrentWorkspace(savedWorkspace);
          fetchCurrentRole(savedWorkspace._id);
        } else {
          setCurrentWorkspace(processedWorkspaces[0]);
          setCookie("currentWorkspaceId", processedWorkspaces[0]._id, 30);
          fetchCurrentRole(processedWorkspaces[0]._id);
        }

        // Clear the defaultWorkspaceId after using it
        if (defaultWorkspaceId) {
          localStorage.removeItem("defaultWorkspaceId");
        }
      }
    } catch (err) {
      console.error("Error loading workspaces:", err);
      setError(
        err instanceof Error ? err.message : "Failed to load workspaces"
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // Reset workspace state when workspace changes
    if (currentWorkspace) {
      console.log(
        `Current workspace set to: ${currentWorkspace.name} (${currentWorkspace._id})`
      );
      // Update cookie
      setCookie("currentWorkspaceId", currentWorkspace._id, 30);
      // Fetch user role for this workspace
      fetchCurrentRole(currentWorkspace._id);
    }
  }, [currentWorkspace?._id]);

  useEffect(() => {
    refreshWorkspaces();
  }, []);

  const handleSetCurrentWorkspace = (workspace: Workspace) => {
    // Skip if we're in the process of logging out
    if (getIsLoggingOut()) {
      return;
    }

    // Skip if it's the same workspace
    if (currentWorkspace && workspace._id === currentWorkspace._id) {
      return;
    }

    console.log(
      `Switching workspace from ${currentWorkspace?.name || "none"} to ${
        workspace.name
      }`
    );
    setCurrentWorkspace(workspace);
    setCookie("currentWorkspaceId", workspace._id, 30);
    fetchCurrentRole(workspace._id);
  };

  return (
    <WorkspaceContext.Provider
      value={{
        workspaces,
        currentWorkspace,
        currentRole,
        isLoading,
        error,
        setCurrentWorkspace: handleSetCurrentWorkspace,
        refreshWorkspaces,
        hasPermission,
      }}
    >
      {children}
    </WorkspaceContext.Provider>
  );
}

export function useWorkspace() {
  const context = useContext(WorkspaceContext);
  if (context === undefined) {
    throw new Error("useWorkspace must be used within a WorkspaceProvider");
  }
  return context;
}
