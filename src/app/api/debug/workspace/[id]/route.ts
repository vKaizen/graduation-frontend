import { NextRequest, NextResponse } from "next/server";
import { getAuthCookie } from "@/lib/cookies";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const workspaceId = params.id;
    const token = getAuthCookie();

    if (!token) {
      return NextResponse.json(
        { error: "Authentication token missing" },
        { status: 401 }
      );
    }

    // First, try to fetch the workspace
    console.log(`Fetching workspace ${workspaceId}`);
    const workspaceResponse = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/workspaces/${workspaceId}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    const workspaceStatus = {
      status: workspaceResponse.status,
      statusText: workspaceResponse.statusText,
      ok: workspaceResponse.ok,
    };

    let workspace = null;
    try {
      workspace = await workspaceResponse.json();
    } catch (e) {
      console.error("Error parsing workspace response:", e);
    }

    // Then try to fetch projects for this workspace
    console.log(`Fetching projects for workspace ${workspaceId}`);
    const projectsResponse = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/workspaces/${workspaceId}/projects`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    const projectsStatus = {
      status: projectsResponse.status,
      statusText: projectsResponse.statusText,
      ok: projectsResponse.ok,
    };

    let projects = null;
    try {
      projects = await projectsResponse.json();
    } catch (e) {
      console.error("Error parsing projects response:", e);
    }

    // Check user role in workspace
    console.log(`Checking user role for workspace ${workspaceId}`);
    const roleResponse = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/workspaces/${workspaceId}/role`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    const roleStatus = {
      status: roleResponse.status,
      statusText: roleResponse.statusText,
      ok: roleResponse.ok,
    };

    let role = null;
    try {
      role = await roleResponse.json();
    } catch (e) {
      console.error("Error parsing role response:", e);
    }

    return NextResponse.json({
      workspace: {
        status: workspaceStatus,
        data: workspace,
      },
      projects: {
        status: projectsStatus,
        data: projects,
      },
      role: {
        status: roleStatus,
        data: role,
      },
    });
  } catch (error) {
    console.error("Debug workspace error:", error);
    return NextResponse.json(
      { error: "Debug workspace failed", details: error.message },
      { status: 500 }
    );
  }
}
