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
  User,
} from "./types";
import { type DashboardCard } from "./contexts/DashboardContext";
import { getAuthCookie } from "./lib/cookies";
import { jwtDecode } from "jwt-decode";

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

  const headers: Record<string, string> = {
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
  console.log("🔍 API: fetchUserById called with ID:", userId);
  try {
    console.log(`Fetching user by ID: ${userId}`);

    // Add token debug
    const token = getAuthCookie();
    console.log(
      "🔍 API: Auth token exists:",
      !!token,
      token ? `(length: ${token.length})` : ""
    );

    // Debug headers
    const headers = getAuthHeaders();
    console.log("🔍 API: Request headers:", JSON.stringify(headers));

    const response = await fetch(`${API_BASE_URL}/users/${userId}`, {
      headers: getAuthHeaders(),
      // Add a timeout to prevent hanging requests
      signal: AbortSignal.timeout(5000), // 5 second timeout
    });

    console.log(
      "🔍 API: User fetch response status:",
      response.status,
      response.statusText
    );

    if (!response.ok) {
      // Try to get more information from the error response
      let errorMsg = `Failed to fetch user ${userId}: ${response.status} ${response.statusText}`;

      try {
        const errorData = await response.json();
        errorMsg = errorData.message || errorMsg;
        console.log(
          "🔍 API: Error data from response:",
          JSON.stringify(errorData)
        );
      } catch (e) {
        // Ignore JSON parsing error
        console.log("🔍 API: Could not parse error response as JSON");
      }

      console.warn(errorMsg);
      throw new Error(errorMsg);
    }

    const userData = await response.json();
    console.log("🔍 API: User data from API:", JSON.stringify(userData));
    return userData;
  } catch (error) {
    console.log(
      "🔍 API: Error type:",
      error instanceof Error ? error.name : typeof error
    );

    if (error instanceof Error) {
      if (error.name === "AbortError") {
        console.warn(`Request for user ${userId} timed out`);
      } else if (
        error.name === "TypeError" &&
        error.message.includes("Failed to fetch")
      ) {
        console.warn(`Network error when fetching user ${userId}`);
      } else {
        console.warn(`Error fetching user ${userId}:`, error.message);
      }
    } else {
      console.warn(`Unknown error type when fetching user ${userId}:`, error);
    }

    // If this is the current user, try to get user info from the JWT token
    console.log("🔍 API: Checking if this is the current user");
    try {
      const token = getAuthCookie();
      if (token) {
        const decoded: {
          sub?: string;
          id?: string;
          userId?: string;
          username?: string;
          name?: string;
          fullName?: string;
          email?: string;
        } = jwtDecode(token);
        console.log(
          "🔍 API: JWT token decoded in fallback:",
          JSON.stringify(decoded)
        );

        // Extract current user ID from token
        const currentUserId = decoded.sub || decoded.id || decoded.userId;
        console.log(`🔍 API: Current user ID from token: ${currentUserId}`);

        // Only use token info if the requested user is the current user
        if (currentUserId === userId) {
          console.log(
            "🔍 API: Requested user is current user, using token info"
          );
          // Extract any potentially useful identity fields from the token
          const email = decoded.email || decoded.username || "Your Account";

          // Use email as fallback for fullName if no name is present
          const fallbackUser = {
            _id: userId,
            email: email,
            fullName: decoded.fullName || decoded.name || email,
          };
          console.log(
            "🔍 API: Using fallback user data from token:",
            JSON.stringify(fallbackUser)
          );
          return fallbackUser;
        }
      }
    } catch (tokenErr) {
      console.warn("Error extracting user info from token:", tokenErr);
    }

    // Return a generic placeholder for non-current users
    console.log("🔍 API: Using generic placeholder for user");
    return {
      _id: userId,
      email: `user-${userId.substring(0, 6)}@example.com`,
      fullName: `User ${userId.substring(0, 6)}`,
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
  console.log("📤 [API] Updating task:", taskId);
  console.log("📤 [API] Update payload:", JSON.stringify(updates, null, 2));

  try {
    const response = await fetch(`${API_BASE_URL}/tasks/${taskId}`, {
      method: "PATCH",
      headers: getAuthHeaders(),
      body: JSON.stringify(updates),
    });

    if (!response.ok) {
      console.error(
        "🚫 [API] Error updating task:",
        response.status,
        response.statusText
      );
      const errorText = await response.text();
      console.error("🚫 [API] Error response:", errorText);
      throw new Error("Failed to update task");
    }

    const updatedTask = await response.json();
    console.log("✅ [API] Task updated successfully:", updatedTask);
    return updatedTask;
  } catch (error) {
    console.error("🚫 [API] Exception in updateTask:", error);
    throw error;
  }
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
    console.log(`Fetching workspace with ID: ${workspaceId}`);
    const headers = getAuthHeaders();

    // Debug log the authorization header
    console.log("Authorization header present:", !!headers.Authorization);

    if (!headers.Authorization) {
      console.error("No authorization token found for workspace request");
      throw new Error("401 Unauthorized: Missing authentication token");
    }

    const response = await fetch(`${API_BASE_URL}/workspaces/${workspaceId}`, {
      method: "GET",
      headers,
      signal: AbortSignal.timeout(5000), // 5 second timeout
    });

    console.log(
      "Workspace fetch response:",
      response.status,
      response.statusText
    );

    if (!response.ok) {
      // Try to get more information from the error response
      let errorDetails = "";
      try {
        const errorData = await response.json();
        errorDetails = errorData.message || errorData.error || "";
      } catch (e) {
        // If we can't parse JSON, try to get text
        try {
          errorDetails = await response.text();
        } catch (textError) {
          // If we can't get text either, use status text
          errorDetails = response.statusText;
        }
      }

      const errorMessage = `${response.status} ${response.statusText}${
        errorDetails ? `: ${errorDetails}` : ""
      }`;
      console.error(`Failed to fetch workspace: ${errorMessage}`);

      throw new Error(`Failed to fetch workspace: ${errorMessage}`);
    }

    const workspace = await response.json();
    return workspace;
  } catch (error) {
    console.error(`Error fetching workspace ${workspaceId}:`, error);
    throw error;
  }
};

// Utility function for batch fetching users by ID
const batchFetchUsers = async (userIds: string[]): Promise<User[]> => {
  if (!userIds || userIds.length === 0) {
    return [];
  }

  try {
    // Clean up IDs - ensure they're strings and unique
    const cleanIds = [
      ...new Set(
        userIds.map((id) => {
          if (typeof id === "object" && id !== null) {
            const objId = id as any;
            return objId._id || String(objId);
          }
          return id;
        })
      ),
    ];

    console.log(`Batch fetching ${cleanIds.length} users`);

    // Try batch endpoint first
    const response = await fetch(`${API_BASE_URL}/users/batch`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify({ userIds: cleanIds }),
    });

    if (response.ok) {
      const users = await response.json();
      console.log(`Successfully batch fetched ${users.length} users`);
      return users;
    }

    console.log(
      "Batch endpoint failed or not available, falling back to individual requests"
    );

    // Fallback to individual requests if batch endpoint fails or isn't available
    const userPromises = cleanIds.map((userId) =>
      fetch(`${API_BASE_URL}/users/${userId}`, { headers: getAuthHeaders() })
        .then((res) => (res.ok ? res.json() : null))
        .catch((err) => {
          if (err instanceof Error) {
            console.warn(`Failed to fetch user ${userId}:`, err.message);
          } else {
            console.warn(`Failed to fetch user ${userId}:`, String(err));
          }
          return null;
        })
    );

    const results = await Promise.all(userPromises);
    return results.filter(Boolean) as User[];
  } catch (err) {
    if (err instanceof Error) {
      console.error("Error in batch fetching users:", err.message);
    } else {
      console.error("Error in batch fetching users:", String(err));
    }
    return [];
  }
};

export const fetchWorkspaceMembers = async (
  workspaceId: string
): Promise<User[]> => {
  try {
    // First fetch the workspace to get the member IDs
    const workspace = await fetchWorkspaceById(workspaceId);

    // Extract member user IDs from the workspace
    const memberIds = Array.isArray(workspace.members)
      ? workspace.members.map((member) => {
          // Handle both object format and string format
          if (typeof member === "object" && member !== null) {
            return member.userId;
          }
          return member; // Handle old format where members are stored as strings
        })
      : [];

    // Also include the workspace owner
    if (workspace.owner && !memberIds.includes(workspace.owner)) {
      memberIds.push(workspace.owner);
    }

    // Ensure unique member IDs - use a Set to remove duplicates
    const uniqueMemberIds = [...new Set(memberIds.filter(Boolean))];
    console.log(
      `Fetching ${uniqueMemberIds.length} unique members for workspace ${workspaceId}`
    );

    if (uniqueMemberIds.length === 0) {
      return [];
    }

    // Use the common utility function to batch fetch users
    return batchFetchUsers(uniqueMemberIds);
  } catch (err) {
    if (err instanceof Error) {
      console.error(
        `Error fetching workspace members for ${workspaceId}:`,
        err.message
      );
    } else {
      console.error(
        `Error fetching workspace members for ${workspaceId}:`,
        String(err)
      );
    }
    return []; // Return empty array on error
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

// Preference-related API calls
export const getUserPreferences = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/preferences`, {
      headers: getAuthHeaders(),
      signal: AbortSignal.timeout(5000), // 5 second timeout
    });

    if (!response.ok) {
      throw new Error(
        `Failed to fetch preferences: ${response.status} ${response.statusText}`
      );
    }

    return await response.json();
  } catch (error) {
    console.error("Error fetching user preferences:", error);
    return null;
  }
};

export const updateUserPreferences = async (preferences: any) => {
  try {
    // Check if we're trying to create a new document or update existing one
    const response = await fetch(`${API_BASE_URL}/preferences`, {
      method: "PATCH", // Use PATCH instead of PUT to update existing document
      headers: getAuthHeaders(),
      body: JSON.stringify(preferences),
    });

    if (!response.ok) {
      throw new Error(
        `Failed to update preferences: ${response.status} ${response.statusText}`
      );
    }

    return await response.json();
  } catch (error) {
    console.error("Error updating user preferences:", error);
    throw error;
  }
};

export const updateBackgroundColor = async (backgroundColor: string) => {
  try {
    const response = await fetch(
      `${API_BASE_URL}/preferences/background-color`,
      {
        method: "PATCH",
        headers: getAuthHeaders(),
        body: JSON.stringify({ backgroundColor }),
      }
    );

    if (!response.ok) {
      throw new Error(
        `Failed to update background color: ${response.status} ${response.statusText}`
      );
    }

    return await response.json();
  } catch (error) {
    console.error("Error updating background color:", error);
    throw error;
  }
};

export const updateDashboardLayout = async (
  dashboardLayout: DashboardCard[]
) => {
  try {
    // Check that dashboardLayout is valid
    if (
      !dashboardLayout ||
      !Array.isArray(dashboardLayout) ||
      dashboardLayout.length === 0
    ) {
      console.error("Invalid dashboard layout data:", dashboardLayout);
      throw new Error("Invalid dashboard layout data");
    }

    // We'll try different API approaches in sequence until one works
    let success = false;
    let responseData = null;

    // Approach 1: Try the dedicated dashboard-layout endpoint with PATCH
    try {
      const url = `${API_BASE_URL}/preferences/dashboard-layout`;
      console.log("Trying dedicated dashboard-layout endpoint with PATCH");

      const response = await fetch(url, {
        method: "PATCH",
        headers: getAuthHeaders(),
        body: JSON.stringify({ dashboardLayout }),
      });

      if (response.ok) {
        success = true;
        responseData = await response.json();
        console.log(
          "Successfully saved dashboard layout using dedicated endpoint with PATCH"
        );
      } else {
        const errorText = await response.text();
        console.log(
          `Dedicated endpoint with PATCH failed with status ${response.status}:`,
          errorText
        );
      }
    } catch (err) {
      console.log("Error using dedicated endpoint with PATCH:", err);
    }

    // Approach 2: Try the dedicated dashboard-layout endpoint with PUT
    if (!success) {
      try {
        const url = `${API_BASE_URL}/preferences/dashboard-layout`;
        console.log("Trying dedicated dashboard-layout endpoint with PUT");

        const response = await fetch(url, {
          method: "PUT",
          headers: getAuthHeaders(),
          body: JSON.stringify({ dashboardLayout }),
        });

        if (response.ok) {
          success = true;
          responseData = await response.json();
          console.log(
            "Successfully saved dashboard layout using dedicated endpoint with PUT"
          );
        } else {
          const errorText = await response.text();
          console.log(
            `Dedicated endpoint with PUT failed with status ${response.status}:`,
            errorText
          );
        }
      } catch (err) {
        console.log("Error using dedicated endpoint with PUT:", err);
      }
    }

    // If first two approaches succeeded, return the result
    if (success && responseData) {
      return responseData;
    }

    // Approach 3: Try updating the entire preferences object with PATCH
    if (!success) {
      try {
        // First get current preferences
        const currentPreferences = await getUserPreferences();
        const url = `${API_BASE_URL}/preferences`;
        console.log("Trying main preferences endpoint with PATCH");

        // Create updated preferences object
        const updatedData = {
          uiPreferences: {
            ...(currentPreferences?.uiPreferences || {}),
            dashboardLayout,
          },
        };

        const response = await fetch(url, {
          method: "PATCH",
          headers: getAuthHeaders(),
          body: JSON.stringify(updatedData),
        });

        if (response.ok) {
          success = true;
          responseData = await response.json();
          console.log(
            "Successfully saved dashboard layout using main preferences endpoint with PATCH"
          );
        } else {
          const errorText = await response.text();
          console.log(
            `Main preferences endpoint with PATCH failed with status ${response.status}:`,
            errorText
          );
        }
      } catch (err) {
        console.log("Error using main preferences endpoint with PATCH:", err);
      }
    }

    // Approach 4: Try updating the entire preferences object with PUT
    if (!success) {
      try {
        // First get current preferences
        const currentPreferences = await getUserPreferences();
        const url = `${API_BASE_URL}/preferences`;
        console.log("Trying main preferences endpoint with PUT");

        // Create updated preferences object
        const updatedData = {
          uiPreferences: {
            ...(currentPreferences?.uiPreferences || {}),
            dashboardLayout,
          },
        };

        const response = await fetch(url, {
          method: "PUT",
          headers: getAuthHeaders(),
          body: JSON.stringify(updatedData),
        });

        if (response.ok) {
          responseData = await response.json();
          console.log(
            "Successfully saved dashboard layout using main preferences endpoint with PUT"
          );
          return responseData;
        } else {
          const errorText = await response.text();
          console.log(
            `Main preferences endpoint with PUT failed with status ${response.status}:`,
            errorText
          );
        }
      } catch (err) {
        console.log("Error using main preferences endpoint with PUT:", err);
      }
    }

    // If we got here, all approaches failed
    throw new Error(
      "Failed to update dashboard layout: All API approaches failed"
    );
  } catch (error: unknown) {
    console.error("Error updating dashboard layout:", error);
    throw error;
  }
};

export const fetchProjectMembers = async (
  projectId: string
): Promise<User[]> => {
  try {
    // First get the project to find member IDs
    const project = await fetchProject(projectId);

    if (!project || !project.roles || project.roles.length === 0) {
      return [];
    }

    // Extract user IDs from project roles
    const userIds = project.roles.map((role) => role.userId);

    console.log(`Fetching ${userIds.length} members for project ${projectId}`);

    // Use the common utility function to batch fetch users
    return batchFetchUsers(userIds);
  } catch (err) {
    if (err instanceof Error) {
      console.error("Error fetching project members:", err.message);
    } else {
      console.error("Error fetching project members:", String(err));
    }
    return [];
  }
};

// --------------------------------
// Invite Management API
// --------------------------------

export type InviteStatus = "pending" | "accepted" | "expired" | "revoked";

export interface Invite {
  id: string;
  inviterId: string;
  inviterName?: string;
  inviteeId: string;
  inviteeName?: string;
  workspaceId: string;
  workspaceName?: string;
  status: InviteStatus;
  inviteTime: string;
  expirationTime: string;
  inviteToken: string;
}

export interface InviteTokenValidation {
  isValid: boolean;
  workspace?: { id: string; name: string };
  inviter?: { id: string; name: string };
}

export async function createInvite(
  accessToken: string,
  inviteeId: string,
  workspaceId: string,
  selectedProjects?: string[]
): Promise<Invite> {
  const response = await fetch(`${API_BASE_URL}/invites`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({ inviteeId, workspaceId, selectedProjects }),
  });

  if (!response.ok) {
    throw await handleApiError(response);
  }

  const data = await response.json();
  return {
    ...data,
    inviteTime: data.inviteTime,
    expirationTime: data.expirationTime,
  };
}

export async function acceptInvite(
  accessToken: string,
  inviteToken: string
): Promise<Invite> {
  const response = await fetch(`${API_BASE_URL}/invites/accept`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({ inviteToken }),
  });

  if (!response.ok) {
    throw new Error("Failed to accept invitation");
  }

  const data = await response.json();
  return {
    ...data,
    inviteTime: data.inviteTime,
    expirationTime: data.expirationTime,
  };
}

export async function getInvites(
  accessToken: string,
  type: "sent" | "received" = "received"
): Promise<Invite[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/invites?type=${type}`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      throw new Error("Failed to fetch invites");
    }

    const data = await response.json();
    return data.map((invite: any) => ({
      ...invite,
      inviteTime: invite.inviteTime,
      expirationTime: invite.expirationTime,
    }));
  } catch (error) {
    console.error("Error fetching invites:", error);
    // Return mock data for development
    return [
      {
        id: "1",
        inviterId: "user-123",
        inviterName: "John Doe",
        inviteeId: "user-456",
        inviteeName: "Current User",
        workspaceId: "ws-789",
        workspaceName: "Design Team",
        status: "pending",
        inviteTime: new Date(Date.now() - 86400000).toISOString(),
        expirationTime: new Date(Date.now() + 86400000).toISOString(),
        inviteToken: "invitation-token-123",
      },
      {
        id: "2",
        inviterId: "user-789",
        inviterName: "Jane Smith",
        inviteeId: "user-456",
        inviteeName: "Current User",
        workspaceId: "ws-123",
        workspaceName: "Marketing Team",
        status: "pending",
        inviteTime: new Date(Date.now() - 172800000).toISOString(),
        expirationTime: new Date(Date.now() + 86400000).toISOString(),
        inviteToken: "invitation-token-456",
      },
    ];
  }
}

export async function getInviteById(
  accessToken: string,
  inviteId: string
): Promise<Invite> {
  const response = await fetch(`${API_BASE_URL}/invites/${inviteId}`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    throw new Error("Failed to fetch invite");
  }

  const data = await response.json();
  return {
    ...data,
    inviteTime: data.inviteTime,
    expirationTime: data.expirationTime,
  };
}

export async function cancelInvite(
  accessToken: string,
  inviteId: string
): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/invites/${inviteId}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    throw new Error("Failed to cancel invite");
  }
}

export async function validateInviteToken(
  accessToken: string,
  token: string
): Promise<InviteTokenValidation> {
  const response = await fetch(`${API_BASE_URL}/invites/validate/${token}`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    throw new Error("Failed to validate invite token");
  }

  return await response.json();
}

// Helper function to handle API errors
async function handleApiError(response: Response): Promise<Error> {
  let errorMessage: string;
  try {
    const errorData = await response.json();
    errorMessage = errorData.message || `API error: ${response.status}`;
  } catch (_) {
    errorMessage = `API error: ${response.status} ${response.statusText}`;
  }
  return new Error(errorMessage);
}

// Notification API interface
export interface Notification {
  id: string;
  type:
    | "invite_received"
    | "invite_accepted"
    | "invite_rejected"
    | "system_message"
    | "task_assigned"
    | "task_completed"
    | "comment_added"
    | "project_status_changed"
    | "member_added"
    | "deadline_approaching"
    | "task_overdue";
  title: string;
  message: string;
  createdAt: string;
  read: boolean;
  metadata?: Record<string, string>;
}

// Fetch all notifications for the current user
export async function fetchNotifications(): Promise<Notification[]> {
  try {
    console.log(
      "Fetching notifications from:",
      `${API_BASE_URL}/notifications`
    );

    const token = getAuthCookie();
    console.log(
      "Auth token exists:",
      !!token,
      token ? `(length: ${token.length})` : ""
    );

    const headers = getAuthHeaders();
    console.log("Request headers:", JSON.stringify(headers));

    const response = await fetch(`${API_BASE_URL}/notifications`, {
      headers: getAuthHeaders(),
      // Add credentials to include cookies
      credentials: "include",
    });

    console.log(
      "Notifications API response status:",
      response.status,
      response.statusText
    );

    if (!response.ok) {
      console.error(
        "Notifications API error:",
        response.status,
        response.statusText
      );
      throw await handleApiError(response);
    }

    // Get response as text first for debugging
    const responseText = await response.text();
    console.log("Raw notifications response:", responseText);

    // Handle empty response
    if (!responseText.trim()) {
      console.log("Empty response received from notifications API");
      return [];
    }

    // Parse the JSON
    let notifications;
    try {
      notifications = JSON.parse(responseText);
    } catch (parseError) {
      console.error("Failed to parse notifications response:", parseError);
      throw new Error("Invalid response format from notifications API");
    }

    console.log("Parsed notifications:", notifications);

    // Ensure the response is an array
    if (!Array.isArray(notifications)) {
      console.error("Notifications response is not an array:", notifications);

      // If it's an object with a data property that's an array, use that
      if (notifications && Array.isArray(notifications.data)) {
        notifications = notifications.data;
      } else {
        // Otherwise return an empty array
        return [];
      }
    }

    // Transform data if needed to match the frontend Notification interface
    const transformedNotifications = notifications.map((notification) => ({
      id: notification._id || notification.id || String(Math.random()),
      type: notification.type || "system_message",
      title: notification.title || "Notification",
      message: notification.message || "",
      createdAt: notification.createdAt || new Date().toISOString(),
      read: notification.read || false,
      metadata: notification.metadata || {},
    }));

    console.log("Transformed notifications:", transformedNotifications);
    return transformedNotifications;
  } catch (error) {
    console.error("Error fetching notifications:", error);
    throw error; // Throw the error instead of returning mock data
  }
}

// Mark a notification as read
export async function markNotificationAsRead(
  notificationId: string
): Promise<void> {
  try {
    const response = await fetch(
      `${API_BASE_URL}/notifications/${notificationId}/read`,
      {
        method: "PATCH",
        headers: getAuthHeaders(),
      }
    );

    if (!response.ok) {
      throw await handleApiError(response);
    }
  } catch (error) {
    console.error(
      `Error marking notification ${notificationId} as read:`,
      error
    );
    // For now, just log the error but don't throw since we're mocking
  }
}

// Mark all notifications as read
export async function markAllNotificationsAsRead(): Promise<void> {
  try {
    const response = await fetch(`${API_BASE_URL}/notifications/read-all`, {
      method: "PATCH",
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      throw await handleApiError(response);
    }
  } catch (error) {
    console.error("Error marking all notifications as read:", error);
    // For now, just log the error but don't throw since we're mocking
  }
}

// Clear/delete all notifications
export async function clearAllNotifications(): Promise<void> {
  try {
    const response = await fetch(`${API_BASE_URL}/notifications`, {
      method: "DELETE",
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      throw await handleApiError(response);
    }
  } catch (error) {
    console.error("Error clearing all notifications:", error);
    // For now, just log the error but don't throw since we're mocking
  }
}

// Helper function to get mock notifications for development
function getMockNotifications(): Notification[] {
  return [
    {
      id: "1",
      type: "invite_received",
      title: "New Workspace Invitation",
      message: "You have been invited to join Design Team workspace",
      createdAt: new Date(Date.now() - 3600000).toISOString(),
      read: false,
      metadata: {
        workspaceId: "ws-123",
        workspaceName: "Design Team",
        inviterId: "user-456",
        inviterName: "Sarah Johnson",
      },
    },
    {
      id: "2",
      type: "invite_accepted",
      title: "Invitation Accepted",
      message: "Alex Chen has accepted your invitation to Marketing workspace",
      createdAt: new Date(Date.now() - 86400000).toISOString(),
      read: true,
      metadata: {
        workspaceId: "ws-789",
        workspaceName: "Marketing",
        userId: "user-101",
        userName: "Alex Chen",
      },
    },
    {
      id: "3",
      type: "system_message",
      title: "Workspace Upgrade Available",
      message:
        "New features are available for your workspace. Click to learn more.",
      createdAt: new Date(Date.now() - 172800000).toISOString(),
      read: false,
    },
  ];
}
