import type {
  Project,
  Task,
  Subtask,
  Section,
  CreateProjectDto,
  AddMemberDto,
  UpdateProjectStatusDto,
  TaskActivity,
  Workspace,
  AddWorkspaceMemberDto,
  UpdateWorkspaceMemberRoleDto,
} from "./types";
import { getAuthCookie } from "./lib/cookies";

// Make sure the API base URL is correct
const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api";
console.log("API base URL:", API_BASE_URL);

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
      defaultWorkspaceId: data.defaultWorkspaceId,
    };
  } catch (error) {
    console.error("Login error:", error);
    throw error;
  }
};

export const fetchUsers = async (): Promise<any[]> => {
  try {
    console.log("Fetching users with auth headers");

    const headers = getAuthHeaders();
    const response = await fetch(`${API_BASE_URL}/users`, {
      headers,
      // Add a timeout to prevent hanging requests
      signal: AbortSignal.timeout(10000), // 10 second timeout
    });

    console.log(
      "Users API response status:",
      response.status,
      response.statusText
    );

    if (!response.ok) {
      // Try to get more information from the error response
      let errorMsg = `Failed to fetch users: ${response.status} ${response.statusText}`;

      try {
        const errorData = await response.json();
        errorMsg = errorData.message || errorMsg;
      } catch (e) {
        // If JSON parsing fails, try to get text
        try {
          const errorText = await response.text();
          if (errorText) errorMsg += ` - ${errorText}`;
        } catch (e2) {
          // Ignore text parsing error
        }
      }

      if (response.status === 403) {
        console.warn(
          "Permission denied accessing users API - this is expected if you're not an admin"
        );
      } else {
        console.error(errorMsg);
      }

      throw new Error(errorMsg);
    }

    const users = await response.json();
    return users;
  } catch (error) {
    if (error.name === "AbortError") {
      console.error("Request for users timed out");
    } else if (
      error.name === "TypeError" &&
      error.message.includes("Failed to fetch")
    ) {
      console.error("Network error when fetching users - server may be down");
    } else {
      console.error("Error fetching users:", error);
    }
    return []; // Return empty array on error
  }
};

export const fetchUserById = async (userId: string): Promise<any> => {
  try {
    console.log(`Fetching user by ID: ${userId}`);

    const response = await fetch(`${API_BASE_URL}/users/${userId}`, {
      headers: getAuthHeaders(),
      // Add a timeout to prevent hanging requests
      signal: AbortSignal.timeout(5000), // 5 second timeout
    });

    if (!response.ok) {
      // Try to get more information from the error response
      let errorMsg = `Failed to fetch user ${userId}: ${response.status} ${response.statusText}`;

      try {
        const errorData = await response.json();
        errorMsg = errorData.message || errorMsg;
      } catch (e) {
        // Ignore JSON parsing error
      }

      console.warn(errorMsg);
      throw new Error(errorMsg);
    }

    return await response.json();
  } catch (error) {
    if (error.name === "AbortError") {
      console.warn(`Request for user ${userId} timed out`);
    } else if (
      error.name === "TypeError" &&
      error.message.includes("Failed to fetch")
    ) {
      console.warn(`Network error when fetching user ${userId}`);
    } else {
      console.warn(`Error fetching user ${userId}:`, error);
    }

    // Return fallback user data
    return {
      _id: userId,
      email: "Unknown User",
      fullName: "Unknown User",
    };
  }
};

export const register = async (
  email: string,
  password: string,
  fullName: string,
  jobTitle?: string,
  bio?: string
) => {
  try {
    const response = await fetch(`${API_BASE_URL}/users/register`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email,
        password,
        fullName,
        jobTitle,
        bio,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || "Registration failed");
    }

    const data = await response.json();
    return {
      userId: data._id,
      email: data.email,
      fullName: data.fullName,
      defaultWorkspaceId: data.defaultWorkspaceId,
    };
  } catch (error) {
    console.error("Registration error:", error);
    throw error;
  }
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

export const fetchProjectActivities = async (
  projectId: string
): Promise<TaskActivity[]> => {
  try {
    const response = await fetch(
      `${API_BASE_URL}/projects/${projectId}/activities`,
      {
        headers: getAuthHeaders(),
      }
    );

    if (!response.ok) {
      throw new Error(
        `Failed to fetch project activities: ${response.statusText}`
      );
    }

    return await response.json();
  } catch (error) {
    console.error("Error fetching project activities:", error);
    throw error;
  }
};

export const updateProjectDescription = async (
  projectId: string,
  description: string
): Promise<Project> => {
  try {
    const response = await fetch(`${API_BASE_URL}/projects/${projectId}`, {
      method: "PATCH",
      headers: getAuthHeaders(),
      body: JSON.stringify({ description }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(
        errorData.message || "Failed to update project description"
      );
    }

    return response.json();
  } catch (error) {
    console.error("Error updating project description:", error);
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

// Add these new workspace-related functions

// Fetch all workspaces for the current user
export const fetchWorkspaces = async (): Promise<Workspace[]> => {
  try {
    const response = await fetch(`${API_BASE_URL}/workspaces`, {
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch workspaces: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Error fetching workspaces:", error);
    throw error;
  }
};

// Fetch a specific workspace by ID
export const fetchWorkspaceById = async (
  workspaceId: string
): Promise<Workspace> => {
  try {
    const response = await fetch(`${API_BASE_URL}/workspaces/${workspaceId}`, {
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch workspace: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error(`Error fetching workspace ${workspaceId}:`, error);
    throw error;
  }
};

// Create a new workspace
export const createWorkspace = async (name: string): Promise<Workspace> => {
  try {
    const response = await fetch(`${API_BASE_URL}/workspaces`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify({ name }),
    });

    if (!response.ok) {
      throw new Error(`Failed to create workspace: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Error creating workspace:", error);
    throw error;
  }
};

// Fetch projects by workspace
export const fetchProjectsByWorkspace = async (
  workspaceId: string
): Promise<Project[]> => {
  try {
    console.log(`Fetching projects for workspace ${workspaceId}`);
    const headers = getAuthHeaders();
    console.log(
      "Authorization header length:",
      headers.Authorization?.length || 0
    );

    // Debug log
    if (!headers.Authorization) {
      console.error("No authorization token available for request");
      // Return empty array instead of throwing to prevent UI errors
      return [];
    }

    const response = await fetch(
      `${API_BASE_URL}/workspaces/${workspaceId}/projects`,
      {
        method: "GET",
        headers,
        // Remove credentials:include which can cause CORS issues
      }
    );

    console.log("Response status:", response.status, response.statusText);

    if (!response.ok) {
      // Try to get more information from the error response
      let errorDetails = "";
      try {
        const errorData = await response.json();
        errorDetails = errorData.message || errorData.error || "";
        console.error("Error details:", errorData);
      } catch (parseError) {
        // If we can't parse JSON, try to get text
        try {
          errorDetails = await response.text();
        } catch (textError) {
          // If we can't get text either, use status text
          errorDetails = response.statusText;
        }
      }

      if (response.status === 401) {
        console.error("Authentication error - token may be invalid or expired");
        // Return empty array instead of throwing
        return [];
      }

      console.error(
        `Fetch projects error: ${response.status} - ${errorDetails}`
      );
      // Return empty array instead of throwing to prevent UI errors
      return [];
    }

    const projects = await response.json();
    console.log(`Successfully fetched ${projects.length} projects`);
    return projects;
  } catch (error) {
    console.error(
      `Error fetching projects for workspace ${workspaceId}:`,
      error
    );
    // Return empty array instead of throwing to prevent UI errors
    return [];
  }
};

// Create a project in a specific workspace
export const createProjectInWorkspace = async (
  workspaceId: string,
  projectData: Omit<CreateProjectDto, "workspaceId">
): Promise<Project | null> => {
  try {
    console.log(`Creating project in workspace ${workspaceId}`, projectData);
    const headers = getAuthHeaders();
    console.log(
      "Authorization header length:",
      headers.Authorization?.length || 0
    );

    if (!headers.Authorization) {
      console.error("No authorization token available for request");
      return null;
    }

    const response = await fetch(
      `${API_BASE_URL}/workspaces/${workspaceId}/projects`,
      {
        method: "POST",
        headers,
        // Remove credentials
        body: JSON.stringify(projectData),
      }
    );

    console.log("Response status:", response.status, response.statusText);

    if (!response.ok) {
      let errorMessage = response.statusText;
      try {
        const errorData = await response.json();
        errorMessage = errorData.message || errorData.error || errorMessage;
        console.error("Error details:", errorData);
      } catch (e) {
        // Error parsing JSON
        try {
          errorMessage = await response.text();
        } catch (textError) {
          // If we can't get text either, use status text
          errorMessage = response.statusText;
        }
      }

      if (response.status === 403) {
        console.error(
          "Access forbidden - user may not have correct workspace role"
        );
      }

      console.error(`Failed to create project in workspace: ${errorMessage}`);
      return null;
    }

    const project = await response.json();
    console.log("Project created successfully:", project);
    return project;
  } catch (error) {
    console.error(`Error creating project in workspace ${workspaceId}:`, error);
    return null;
  }
};

// Add the fetch tasks by workspace function
export const fetchTasksByWorkspace = async (
  workspaceId: string
): Promise<Task[]> => {
  try {
    console.log(`Fetching tasks for workspace ${workspaceId}`);
    const headers = getAuthHeaders();

    // Debug log
    if (!headers.Authorization) {
      console.error("No authorization token available for request");
      return [];
    }

    const response = await fetch(
      `${API_BASE_URL}/workspaces/${workspaceId}/tasks`,
      {
        headers,
      }
    );

    if (!response.ok) {
      // Try to get more information from the error response
      let errorDetails = "";
      try {
        const errorData = await response.json();
        errorDetails = errorData.message || errorData.error || "";
      } catch (parseError) {
        // If we can't parse JSON, try to get text
        try {
          errorDetails = await response.text();
        } catch (textError) {
          // If we can't get text either, use status text
          errorDetails = response.statusText;
        }
      }

      console.error(`Fetch tasks error: ${response.status} - ${errorDetails}`);
      // Return empty array instead of throwing to prevent UI errors
      return [];
    }

    const tasks = await response.json();
    console.log(`Successfully fetched ${tasks.length} tasks`);
    return tasks;
  } catch (error) {
    console.error(`Error fetching tasks for workspace ${workspaceId}:`, error);
    // Return empty array instead of throwing to prevent UI errors
    return [];
  }
};

// Get the current user's role in a workspace
export const getUserWorkspaceRole = async (
  workspaceId: string
): Promise<{ role: "owner" | "admin" | "member" | null }> => {
  try {
    const response = await fetch(
      `${API_BASE_URL}/workspaces/${workspaceId}/role`,
      {
        headers: getAuthHeaders(),
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to get user role: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error(`Error getting role for workspace ${workspaceId}:`, error);
    throw error;
  }
};

// Add a member to a workspace with a specific role
export const addWorkspaceMember = async (
  workspaceId: string,
  memberData: AddWorkspaceMemberDto
): Promise<Workspace> => {
  try {
    const response = await fetch(
      `${API_BASE_URL}/workspaces/${workspaceId}/members`,
      {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify(memberData),
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to add workspace member: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error(`Error adding member to workspace ${workspaceId}:`, error);
    throw error;
  }
};

// Update a workspace member's role
export const updateWorkspaceMemberRole = async (
  workspaceId: string,
  memberId: string,
  roleData: UpdateWorkspaceMemberRoleDto
): Promise<Workspace> => {
  try {
    const response = await fetch(
      `${API_BASE_URL}/workspaces/${workspaceId}/members/${memberId}/role`,
      {
        method: "PATCH",
        headers: getAuthHeaders(),
        body: JSON.stringify(roleData),
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to update member role: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error(`Error updating role in workspace ${workspaceId}:`, error);
    throw error;
  }
};

// Remove a member from a workspace
export const removeWorkspaceMember = async (
  workspaceId: string,
  memberId: string
): Promise<Workspace> => {
  try {
    const response = await fetch(
      `${API_BASE_URL}/workspaces/${workspaceId}/members/${memberId}`,
      {
        method: "DELETE",
        headers: getAuthHeaders(),
      }
    );

    if (!response.ok) {
      throw new Error(
        `Failed to remove workspace member: ${response.statusText}`
      );
    }

    return await response.json();
  } catch (error) {
    console.error(
      `Error removing member from workspace ${workspaceId}:`,
      error
    );
    throw error;
  }
};
