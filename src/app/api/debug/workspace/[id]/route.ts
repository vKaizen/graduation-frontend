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

    // Check authorization header
    console.log("Debug - Auth token length:", token.length);
    console.log(
      "Debug - Auth token starts with:",
      token.substring(0, 10) + "..."
    );

    // First, try a direct backend call to fetch the workspace
    console.log(
      `Debug - Fetching workspace ${workspaceId} directly from backend`
    );
    const workspaceResponse = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/workspaces/${workspaceId}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        signal: AbortSignal.timeout(5000),
      }
    );

    const workspaceStatus = {
      status: workspaceResponse.status,
      statusText: workspaceResponse.statusText,
      ok: workspaceResponse.ok,
    };

    console.log("Debug - Workspace response:", workspaceStatus);

    let workspace = null;
    let workspaceError = null;
    try {
      if (workspaceResponse.ok) {
        workspace = await workspaceResponse.json();
      } else {
        const errorText = await workspaceResponse.text();
        workspaceError = errorText || workspaceResponse.statusText;
      }
    } catch (e) {
      console.error("Error parsing workspace response:", e);
      workspaceError = e instanceof Error ? e.message : String(e);
    }

    // Then try to fetch projects for this workspace
    console.log(
      `Debug - Fetching projects for workspace ${workspaceId} directly from backend`
    );
    const projectsResponse = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/workspaces/${workspaceId}/projects`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        signal: AbortSignal.timeout(5000),
      }
    );

    const projectsStatus = {
      status: projectsResponse.status,
      statusText: projectsResponse.statusText,
      ok: projectsResponse.ok,
    };

    console.log("Debug - Projects response:", projectsStatus);

    let projects = null;
    let projectsError = null;
    try {
      if (projectsResponse.ok) {
        projects = await projectsResponse.json();
      } else {
        const errorText = await projectsResponse.text();
        projectsError = errorText || projectsResponse.statusText;
      }
    } catch (e) {
      console.error("Error parsing projects response:", e);
      projectsError = e instanceof Error ? e.message : String(e);
    }

    // Now try the frontend API route
    console.log(
      `Debug - Fetching workspace ${workspaceId} via frontend API route`
    );
    const frontendResponse = await fetch(
      `${request.nextUrl.origin}/api/workspaces/${workspaceId}`,
      {
        headers: {
          Cookie: `auth_token=${token}`,
        },
        credentials: "include",
        signal: AbortSignal.timeout(5000),
      }
    );

    const frontendStatus = {
      status: frontendResponse.status,
      statusText: frontendResponse.statusText,
      ok: frontendResponse.ok,
    };

    console.log("Debug - Frontend API response:", frontendStatus);

    let frontendData = null;
    let frontendError = null;
    try {
      if (frontendResponse.ok) {
        frontendData = await frontendResponse.json();
      } else {
        const errorText = await frontendResponse.text();
        frontendError = errorText || frontendResponse.statusText;
      }
    } catch (e) {
      console.error("Error parsing frontend response:", e);
      frontendError = e instanceof Error ? e.message : String(e);
    }

    return NextResponse.json({
      tokenPresent: !!token,
      tokenLength: token.length,
      direct: {
        workspace: {
          status: workspaceStatus,
          data: workspace,
          error: workspaceError,
        },
        projects: {
          status: projectsStatus,
          data: projects,
          error: projectsError,
        },
      },
      frontend: {
        status: frontendStatus,
        data: frontendData,
        error: frontendError,
      },
    });
  } catch (error) {
    console.error("Debug workspace error:", error);
    return NextResponse.json(
      {
        error: "Debug workspace failed",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
