import { cookies } from "next/headers";
import { Project } from "@/types";

export async function fetchProjectData(
  projectId: string
): Promise<Project | null> {
  try {
    console.log("fetchProjectData: Fetching project with ID:", projectId);

    // Get the auth token from server-side cookies
    const cookieStore = cookies();
    const token = cookieStore.get("auth_token")?.value;

    if (!token) {
      console.error("fetchProjectData: No auth token found in cookies");
      return null;
    }

    // Make the fetch request directly instead of using api-service
    const response = await fetch(
      `http://localhost:3000/api/projects/${projectId}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        cache: "no-store", // Disable caching to always get fresh data
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch project: ${response.statusText}`);
    }

    const project = await response.json();

    if (!project) {
      console.error("fetchProjectData: Project not found");
      return null;
    }

    console.log("fetchProjectData: Successfully fetched project:", project);
    return {
      _id: project._id,
      name: project.name,
      color: project.color || "bg-blue-500",
      sections: project.sections || [],
      description: project.description,
      roles: project.roles || [],
      __v: project.__v,
    };
  } catch (error) {
    console.error("Error in fetchProjectData:", error);
    return null;
  }
}
