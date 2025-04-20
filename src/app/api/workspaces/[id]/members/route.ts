import { NextRequest, NextResponse } from "next/server";
import { addWorkspaceMember, getUserWorkspaceRole } from "@/api-service";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { userId, role } = await request.json();

    // Check user permissions before adding
    const userRole = await getUserWorkspaceRole(params.id);

    if (userRole.role !== "owner" && userRole.role !== "admin") {
      return NextResponse.json(
        { error: "Only workspace owners and admins can add members" },
        { status: 403 }
      );
    }

    // If user is admin and trying to add another admin, reject
    if (userRole.role === "admin" && role === "admin") {
      return NextResponse.json(
        { error: "Only workspace owners can add admin members" },
        { status: 403 }
      );
    }

    const workspace = await addWorkspaceMember(params.id, { userId, role });

    return NextResponse.json(workspace);
  } catch (error) {
    console.error("Error adding member:", error);
    return NextResponse.json(
      { error: "Failed to add member" },
      { status: 500 }
    );
  }
}
