import { fetchProject } from "@/api-service";
import { Project } from "@/types";

export async function fetchProjectData(
  projectId: string
): Promise<Project | null> {
  try {
    console.log("fetchProjectData: Fetching project with ID:", projectId);
    const project = await fetchProject(projectId);

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
