"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { useWorkspace } from "./workspace-context";

// Define the shape of our context
interface ProjectContextType {
  refreshSidebar: () => void;
  projectDeleted: boolean;
  setProjectDeleted: (deleted: boolean) => void;
}

// Create the context
const ProjectContext = createContext<ProjectContextType | undefined>(undefined);

// Create the provider component
export function ProjectProvider({ children }: { children: ReactNode }) {
  const [lastRefreshTime, setLastRefreshTime] = useState<number>(Date.now());
  const [projectDeleted, setProjectDeleted] = useState<boolean>(false);

  // Function to trigger a sidebar refresh
  const refreshSidebar = () => {
    setLastRefreshTime(Date.now());
    setProjectDeleted(true);

    // Reset the projectDeleted flag after a short delay
    setTimeout(() => {
      setProjectDeleted(false);
    }, 500);
  };

  return (
    <ProjectContext.Provider
      value={{
        refreshSidebar,
        projectDeleted,
        setProjectDeleted,
      }}
    >
      {children}
    </ProjectContext.Provider>
  );
}

// Create a custom hook to use the context
export function useProject() {
  const context = useContext(ProjectContext);
  if (context === undefined) {
    throw new Error("useProject must be used within a ProjectProvider");
  }
  return context;
}
