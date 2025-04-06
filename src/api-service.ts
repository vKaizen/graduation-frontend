import type {
  Project,
  Task,
  Subtask,
  Section,
  CreateProjectDto,
  AddMemberDto,
  UpdateProjectStatusDto,
} from "./types";
import { getAuthCookie } from "./lib/cookies";

const API_BASE_URL = "http://localhost:3000/api";

// Helper function to get auth headers
const getAuthHeaders = (): HeadersInit => {
  const token = getAuthCookie();
  if (!token) {
    console.warn("No auth token found in cookies");
  } else {
    console.log("Auth token found, length:", token.length);
  }

  const headers: HeadersInit = {
    "Content-Type": "application/json",
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  return headers;
};

// Auth-related API calls
export const login = async (email: string, password: string) => {
  try {
    const response = await fetch(`${API_BASE_URL}/users/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      throw new Error("Invalid email or password");
    }

    const data = await response.json();
    return {
      accessToken: data.accessToken,
      userId: data.userId,
      username: data.username || email,
    };
  } catch (error) {
    console.error("Login error:", error);
    throw error;
  }
};

export const register = async (email: string, password: string) => {
  const response = await fetch(`${API_BASE_URL}/users/register`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email, password }),
  });

  if (!response.ok) {
    throw new Error("Registration failed");
  }

  return response.json();
};

// Project-related API calls
export const fetchProjects = async (): Promise<Project[]> => {
  try {
    console.log(
      "fetchProjects: Making request with headers:",
      getAuthHeaders()
    );
    const response = await fetch(`${API_BASE_URL}/projects`, {
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch projects: ${response.statusText}`);
    }

    const projects = await response.json();
    console.log("fetchProjects: Received projects:", projects);
    return projects;
  } catch (error) {
    console.error("Error fetching projects:", error);
    throw error;
  }
};

export const fetchProject = async (projectId: string): Promise<Project> => {
  try {
    const token = getAuthCookie();
    if (!token) {
      throw new Error("No authentication token found");
    }

    const response = await fetch(`${API_BASE_URL}/projects/${projectId}`, {
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.message || `Failed to fetch project: ${response.statusText}`
      );
    }

    const project = await response.json();
    if (!project) {
      throw new Error("Project data is empty");
    }

    return project;
  } catch (error) {
    console.error("Error fetching project:", error);
    throw error;
  }
};

export const createProject = async (
  projectData: CreateProjectDto
): Promise<Project> => {
  try {
    const response = await fetch(`${API_BASE_URL}/projects`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify(projectData),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || "Failed to create project");
    }

    return response.json();
  } catch (error) {
    console.error("Error creating project:", error);
    throw error;
  }
};

export const addProjectMember = async (
  projectId: string,
  memberData: AddMemberDto
): Promise<Project> => {
  try {
    const response = await fetch(
      `${API_BASE_URL}/projects/${projectId}/members`,
      {
        method: "PATCH",
        headers: getAuthHeaders(),
        body: JSON.stringify(memberData),
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || "Failed to add member to project");
    }

    return response.json();
  } catch (error) {
    console.error("Error adding member to project:", error);
    throw error;
  }
};

export const updateProjectStatus = async (
  projectId: string,
  statusData: UpdateProjectStatusDto
): Promise<Project> => {
  try {
    const response = await fetch(
      `${API_BASE_URL}/projects/${projectId}/status`,
      {
        method: "PATCH",
        headers: getAuthHeaders(),
        body: JSON.stringify(statusData),
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || "Failed to update project status");
    }

    return response.json();
  } catch (error) {
    console.error("Error updating project status:", error);
    throw error;
  }
};

// Section-related API calls
export const createSection = async (
  projectId: string,
  title: string
): Promise<Section> => {
  try {
    console.log("Creating section with:", { projectId, title });

    const response = await fetch(
      `${API_BASE_URL}/projects/${projectId}/sections`,
      {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({
          title,
          project: projectId,
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Server response:", {
        status: response.status,
        statusText: response.statusText,
        body: errorText,
      });
      throw new Error(`Failed to create section: ${response.statusText}`);
    }

    const sectionData = await response.json();
    console.log("Created section:", sectionData);
    return sectionData;
  } catch (error) {
    console.error("Error in createSection:", error);
    throw error;
  }
};

export const updateSection = async (
  projectId: string,
  sectionId: string,
  updates: Partial<Section>
): Promise<Section> => {
  const response = await fetch(
    `${API_BASE_URL}/projects/${projectId}/sections/${sectionId}`,
    {
      method: "PATCH",
      headers: getAuthHeaders(),
      body: JSON.stringify(updates),
    }
  );
  if (!response.ok) {
    throw new Error("Failed to update section");
  }
  return response.json();
};

export const deleteSection = async (
  projectId: string,
  sectionId: string
): Promise<void> => {
  try {
    if (!projectId || !sectionId) {
      throw new Error("Project ID and Section ID are required");
    }

    const response = await fetch(
      `${API_BASE_URL}/projects/${projectId}/sections/${sectionId}`,
      {
        method: "DELETE",
        headers: getAuthHeaders(),
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || "Failed to delete section");
    }
  } catch (error) {
    console.error("Error deleting section:", error);
    throw error;
  }
};

export const reorderSections = async (
  projectId: string,
  sectionIds: string[]
): Promise<Section[]> => {
  try {
    if (!projectId || !Array.isArray(sectionIds) || sectionIds.length === 0) {
      throw new Error("Invalid parameters for reordering sections");
    }

    console.log("Reordering sections:", {
      projectId,
      sectionIds,
      endpoint: `${API_BASE_URL}/projects/${projectId}/reorder-sections`,
    });

    const response = await fetch(
      `${API_BASE_URL}/projects/${projectId}/reorder-sections`,
      {
        method: "PATCH",
        headers: getAuthHeaders(),
        body: JSON.stringify({ sectionIds }),
      }
    );

    const responseText = await response.text();
    console.log("Raw response:", responseText);

    let responseData;
    try {
      responseData = responseText ? JSON.parse(responseText) : null;
    } catch (parseError) {
      console.error("Failed to parse response:", parseError);
      throw new Error("Invalid response format");
    }

    if (!response.ok) {
      console.error("Reorder response:", {
        status: response.status,
        statusText: response.statusText,
        data: responseData,
      });
      throw new Error(responseData?.message || "Failed to reorder sections");
    }

    if (!responseData || !Array.isArray(responseData)) {
      console.error("Invalid response data format:", responseData);
      throw new Error("Invalid response data format");
    }

    console.log("Sections reordered successfully:", responseData);
    return responseData;
  } catch (error) {
    console.error("Error reordering sections:", error);
    throw error;
  }
};

// Task-related API calls
export const addTask = async (
  projectId: string,
  sectionId: string,
  task: Omit<Task, "_id">
): Promise<Task> => {
  const response = await fetch(`${API_BASE_URL}/tasks`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify({
      ...task,
      project: projectId,
      section: sectionId,
    }),
  });
  return response.json();
};

export const moveTask = async (
  taskId: string,
  newSectionId: string,
  newOrder: number
): Promise<Task> => {
  const response = await fetch(`${API_BASE_URL}/tasks/${taskId}/move`, {
    method: "PATCH",
    headers: getAuthHeaders(),
    body: JSON.stringify({
      section: newSectionId,
      order: newOrder,
    }),
  });
  return response.json();
};

export const reorderTasks = async (
  sectionId: string,
  taskIds: string[]
): Promise<Task[]> => {
  const response = await fetch(`${API_BASE_URL}/tasks/reorder/${sectionId}`, {
    method: "PATCH",
    headers: getAuthHeaders(),
    body: JSON.stringify({ taskIds }),
  });
  return response.json();
};

export const updateTask = async (
  taskId: string,
  updates: Partial<Task>
): Promise<Task> => {
  const response = await fetch(`${API_BASE_URL}/tasks/${taskId}`, {
    method: "PATCH",
    headers: getAuthHeaders(),
    body: JSON.stringify(updates),
  });

  if (!response.ok) {
    throw new Error("Failed to update task");
  }

  return response.json();
};

export const deleteTask = async (taskId: string): Promise<void> => {
  try {
    const response = await fetch(`${API_BASE_URL}/tasks/${taskId}`, {
      method: "DELETE",
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || "Failed to delete task");
    }
  } catch (error) {
    console.error("Error deleting task:", error);
    throw error;
  }
};

// Add this new function to get the list of project IDs
export const getProjectIds = async (): Promise<string[]> => {
  try {
    console.log("getProjectIds: Starting request");
    const response = await fetch(`${API_BASE_URL}/projects`, {
      method: "GET",
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      console.error("getProjectIds: Response not OK:", {
        status: response.status,
        statusText: response.statusText,
      });
      const errorText = await response.text();
      console.error("getProjectIds: Error response body:", errorText);
      return [];
    }

    const projects = await response.json();
    console.log("getProjectIds: Raw projects data:", projects);

    // Handle both array and object responses
    const projectArray = Array.isArray(projects) ? projects : [projects];
    console.log("getProjectIds: Processed project array:", projectArray);

    // Filter out any invalid projects and extract IDs
    const projectIds = projectArray
      .filter((project) => project && project._id)
      .map((project) => project._id);

    console.log("getProjectIds: Final project IDs:", projectIds);
    return projectIds;
  } catch (error) {
    console.error("Error in getProjectIds:", error);
    return [];
  }
};

// Add a function to add a subtask to a task
export const addSubtask = async (
  projectId: string,
  sectionId: string,
  taskId: string,
  subtask: Omit<Subtask, "id" | "taskId">
): Promise<Subtask> => {
  // This is a mock implementation. Replace with actual API call when ready.
  return new Promise((resolve) => {
    setTimeout(() => {
      const newSubtask: Subtask = {
        ...subtask,
        id: `subtask-${Date.now()}`,
        taskId: taskId,
      };
      resolve(newSubtask);
    }, 200);
  });
};

// Add a function to update a subtask
export const updateSubtask = async (
  projectId: string,
  taskId: string,
  subtaskId: string,
  updates: Partial<Subtask>
): Promise<Subtask> => {
  // This is a mock implementation. Replace with actual API call when ready.
  return new Promise((resolve) => {
    setTimeout(() => {
      // In a real implementation, you would update the subtask in the database
      // Here we just return the updated subtask
      const updatedSubtask: Subtask = {
        id: subtaskId,
        title: updates.title || "Updated Subtask",
        completed: updates.completed !== undefined ? updates.completed : false,
        taskId: taskId,
        assignee: updates.assignee,
        dueDate: updates.dueDate,
        description: updates.description,
      };
      resolve(updatedSubtask);
    }, 200);
  });
};
