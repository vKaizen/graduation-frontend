import { NextRequest, NextResponse } from "next/server";
import {
  fetchWorkspaceById,
  removeWorkspaceMember,
  addWorkspaceMember,
  updateWorkspaceMemberRole,
  getUserWorkspaceRole,
} from "@/api-service";
import { headers } from "next/headers";
import { getAuthCookie } from "@/lib/cookies";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const workspace = await fetchWorkspaceById(params.id);
    return NextResponse.json(workspace);
  } catch (error) {
    console.error("Error fetching workspace:", error);
    return NextResponse.json(
      { error: "Failed to fetch workspace" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const data = await request.json();

    // Forward to the backend API
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/workspaces/${params.id}`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getAuthCookie()}`,
        },
        body: JSON.stringify(data),
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to update workspace: ${response.statusText}`);
    }

    const updatedWorkspace = await response.json();
    return NextResponse.json(updatedWorkspace);
  } catch (error) {
    console.error("Error updating workspace:", error);
    return NextResponse.json(
      { error: "Failed to update workspace" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // First check if user is owner
    const { role } = await getUserWorkspaceRole(params.id);

    if (role !== "owner") {
      return NextResponse.json(
        { error: "Only the workspace owner can delete a workspace" },
        { status: 403 }
      );
    }

    // Forward to the backend API
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/workspaces/${params.id}`,
      {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${getAuthCookie()}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to delete workspace: ${response.statusText}`);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting workspace:", error);
    return NextResponse.json(
      { error: "Failed to delete workspace" },
      { status: 500 }
    );
  }
}
