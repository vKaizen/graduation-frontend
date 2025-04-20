import { NextRequest, NextResponse } from "next/server";
import {
  updateWorkspaceMemberRole,
  removeWorkspaceMember,
  getUserWorkspaceRole,
} from "@/api-service";

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string; memberId: string } }
) {
  try {
    const { role } = await request.json();

    // Check user permissions before updating
    const userRole = await getUserWorkspaceRole(params.id);

    if (userRole.role !== "owner") {
      return NextResponse.json(
        { error: "Only the workspace owner can update member roles" },
        { status: 403 }
      );
    }

    const workspace = await updateWorkspaceMemberRole(
      params.id,
      params.memberId,
      { role }
    );

    return NextResponse.json(workspace);
  } catch (error) {
    console.error("Error updating member role:", error);
    return NextResponse.json(
      { error: "Failed to update member role" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; memberId: string } }
) {
  try {
    // Check user permissions before removing
    const userRole = await getUserWorkspaceRole(params.id);

    if (userRole.role !== "owner" && userRole.role !== "admin") {
      return NextResponse.json(
        { error: "Only workspace owners and admins can remove members" },
        { status: 403 }
      );
    }

    const workspace = await removeWorkspaceMember(params.id, params.memberId);
    return NextResponse.json(workspace);
  } catch (error) {
    console.error("Error removing member:", error);
    return NextResponse.json(
      { error: "Failed to remove member" },
      { status: 500 }
    );
  }
}
