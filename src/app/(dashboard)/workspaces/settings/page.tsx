"use client";

import React from "react";
import { useWorkspace } from "@/contexts/workspace-context";
import WorkspaceMembers from "@/components/workspace/WorkspaceMembers";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useState } from "react";
import { toast } from "sonner";
import RequireWorkspacePermission from "@/components/workspace/RequireWorkspacePermission";
import { ArrowLeft, Save, Trash2 } from "lucide-react";
import Link from "next/link";

export default function WorkspaceSettingsPage() {
  const { currentWorkspace, refreshWorkspaces } = useWorkspace();
  const [workspaceName, setWorkspaceName] = useState(
    currentWorkspace?.name || ""
  );
  const [isLoading, setIsLoading] = useState(false);

  const handleUpdateWorkspace = async () => {
    if (!currentWorkspace) return;

    setIsLoading(true);
    try {
      const response = await fetch(`/api/workspaces/${currentWorkspace._id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name: workspaceName }),
      });

      if (!response.ok) {
        throw new Error("Failed to update workspace");
      }

      toast.success("Workspace updated successfully");
      refreshWorkspaces();
    } catch (error) {
      console.error("Error updating workspace:", error);
      toast.error("Failed to update workspace");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteWorkspace = async () => {
    if (
      !currentWorkspace ||
      !confirm(
        "Are you sure you want to delete this workspace? This action cannot be undone."
      )
    )
      return;

    setIsLoading(true);
    try {
      const response = await fetch(`/api/workspaces/${currentWorkspace._id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete workspace");
      }

      toast.success("Workspace deleted successfully");
      refreshWorkspaces();
      // Redirect to dashboard after deletion
      window.location.href = "/";
    } catch (error) {
      console.error("Error deleting workspace:", error);
      toast.error("Failed to delete workspace");
    } finally {
      setIsLoading(false);
    }
  };

  if (!currentWorkspace) {
    return <div className="p-6">Loading workspace settings...</div>;
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Link href="/">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <h1 className="text-2xl font-bold">Workspace Settings</h1>
        </div>
      </div>

      <Tabs defaultValue="general">
        <TabsList className="mb-6">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="members">Members</TabsTrigger>
          <TabsTrigger value="danger">Danger Zone</TabsTrigger>
        </TabsList>

        <TabsContent value="general">
          <RequireWorkspacePermission
            requiredRoles={["owner", "admin"]}
            fallback={
              <Card>
                <CardHeader>
                  <CardTitle>Workspace Details</CardTitle>
                  <CardDescription>
                    You don't have permission to edit workspace details
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-sm font-medium">Workspace Name</h3>
                      <p className="text-gray-500">{currentWorkspace.name}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            }
          >
            <Card>
              <CardHeader>
                <CardTitle>Workspace Details</CardTitle>
                <CardDescription>
                  Update your workspace information
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label htmlFor="name" className="text-sm font-medium">
                      Workspace Name
                    </label>
                    <Input
                      id="name"
                      value={workspaceName}
                      onChange={(e) => setWorkspaceName(e.target.value)}
                    />
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button
                  onClick={handleUpdateWorkspace}
                  disabled={
                    isLoading ||
                    !workspaceName.trim() ||
                    workspaceName === currentWorkspace.name
                  }
                >
                  <Save className="h-4 w-4 mr-2" />
                  Save Changes
                </Button>
              </CardFooter>
            </Card>
          </RequireWorkspacePermission>
        </TabsContent>

        <TabsContent value="members">
          <WorkspaceMembers />
        </TabsContent>

        <TabsContent value="danger">
          <RequireWorkspacePermission requiredRoles={["owner"]}>
            <Card>
              <CardHeader>
                <CardTitle className="text-red-600">Danger Zone</CardTitle>
                <CardDescription>
                  Actions here can have permanent consequences
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="border border-red-200 rounded-md p-4">
                    <h3 className="text-lg font-medium">Delete Workspace</h3>
                    <p className="text-gray-500 mb-4">
                      Permanently delete this workspace and all its data. This
                      action cannot be undone.
                    </p>
                    <Button
                      variant="destructive"
                      onClick={handleDeleteWorkspace}
                      disabled={isLoading}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete Workspace
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </RequireWorkspacePermission>
        </TabsContent>
      </Tabs>
    </div>
  );
}
