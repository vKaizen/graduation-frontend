export interface Task {
  _id: string;
  title: string;
  assignee: string | null;
  dueDate?: string;
  priority?: "High" | "Medium" | "Low";
  description?: string;
  completed?: boolean;
  subtasks?: Subtask[];
  status: "not started" | "in progress" | "completed";
  order: number;
  section: string;
  project: string;
  createdBy?: string;
  updatedBy?: string;
  updatedByName?: string;
}

export interface Section {
  _id: string;
  title: string;
  tasks: Task[];
  project: string;
  order: number;
}

export interface Project {
  _id: string;
  name: string;
  description?: string;
  color: string;
  status?: "on-track" | "at-risk" | "off-track";
  workspaceId: string;
  workspace?: {
    _id: string;
    name: string;
    description?: string;
  };
  roles: {
    userId: string;
    role: string;
  }[];
  sections: {
    _id: string;
    title: string;
    project: string;
    tasks: Task[];
    order?: number;
  }[];
  createdBy?: string;
  createdAt?: string;
  updatedAt?: string;
}

// Add new types for task details
export interface TaskActivity {
  type: "created" | "completed" | "updated" | "commented";
  user: string | { userId: string; name: string; _id?: string };
  timestamp: string;
  content?: string;
}

export interface Subtask {
  id: string;
  title: string;
  completed: boolean;
  taskId: string;
  assignee?: string | null;
  dueDate?: string;
  description?: string;
}

export interface TaskDetails extends Omit<Task, "project"> {
  description?: string;
  activities: TaskActivity[];
  subtasks: Subtask[];
  collaborators: string[];
  project: {
    id: string;
    name: string;
    status: string;
    color?: string;
  };
}

// Only DTO needed for projects based on backend
export interface CreateProjectDto {
  name: string;
  description?: string;
  ownerId: string;
  color?: string;
  status?: string;
  workspaceId: string;
  selectedMembers?: string[];
}

export interface AddMemberDto {
  userId: string;
  role: "Owner" | "Member" | "Admin";
}

export interface UpdateProjectStatusDto {
  status: "on-track" | "at-risk" | "off-track";
}

export interface WorkspaceMember {
  userId: string;
  role: "owner" | "admin" | "member";
}

export interface Workspace {
  _id: string;
  name: string;
  owner: string;
  members: WorkspaceMember[];
  createdAt: string;
  updatedAt: string;
}

export interface AddWorkspaceMemberDto {
  userId: string;
  role: "admin" | "member";
}

export interface UpdateWorkspaceMemberRoleDto {
  role: "admin" | "member";
}

export interface User {
  _id: string;
  email: string;
  fullName?: string;
  isAdmin?: boolean;
  createdAt?: string;
  updatedAt?: string;
}
