import type React from "react";
import { WorkspaceProvider } from "@/contexts/workspace-context";

// This layout is for full-page goal creation
export default function CreateGoalLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <WorkspaceProvider>{children}</WorkspaceProvider>;
}
