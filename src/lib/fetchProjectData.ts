import { fetchProject } from "@/api-service";
import { Project } from "@/types";

export async function fetchProjectData(
  projectId: string
): Promise<Project | null> {
  try {
    const project = await fetchProject(projectId); // Fetch project data from API
    return project;
  } catch (error) {
    console.error("Error fetching project data:", error);
    return null;
  }
}
