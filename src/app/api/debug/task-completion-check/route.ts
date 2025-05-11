import { NextResponse } from "next/server";
import { getServerAuthCookie } from "@/lib/server-cookies";

export async function GET() {
  try {
    // Get auth token from server cookies
    const token = await getServerAuthCookie();

    if (!token) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    // Get the API URL from environment variables
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

    // First, check for any completed tasks regardless of date
    const checkCompletedResponse = await fetch(
      `${apiUrl}/analytics/debug/completed-tasks`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (!checkCompletedResponse.ok) {
      return NextResponse.json(
        {
          error: "Failed to check completed tasks",
          status: checkCompletedResponse.status,
          statusText: checkCompletedResponse.statusText,
        },
        { status: checkCompletedResponse.status }
      );
    }

    const completedTasksData = await checkCompletedResponse.json();

    // Get current date range for the last 30 days
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 30);

    // Adjust timezone to avoid issues
    const adjustedStartDate = new Date(startDate);
    adjustedStartDate.setUTCHours(0, 0, 0, 0);

    const adjustedEndDate = new Date(endDate);
    adjustedEndDate.setUTCDate(adjustedEndDate.getUTCDate() + 1);
    adjustedEndDate.setUTCHours(23, 59, 59, 999);

    // Try to get timeline data with the adjusted dates
    const timelineResponse = await fetch(
      `${apiUrl}/analytics/task-completion-timeline?startDate=${adjustedStartDate.toISOString()}&endDate=${adjustedEndDate.toISOString()}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );

    let timelineData = null;
    if (timelineResponse.ok) {
      timelineData = await timelineResponse.json();
    }

    return NextResponse.json({
      completedTasks: completedTasksData,
      dateRange: {
        start: adjustedStartDate.toISOString(),
        end: adjustedEndDate.toISOString(),
      },
      timelineData,
    });
  } catch (error) {
    console.error("Error in debug API route:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        message: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
