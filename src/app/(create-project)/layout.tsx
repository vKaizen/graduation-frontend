import type React from "react";
import { WorkspaceProvider } from "@/contexts/workspace-context";

// This layout is for full-page layouts like project creation
export default function CreateProjectLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <WorkspaceProvider>{children}</WorkspaceProvider>;
}
