export interface Task {
  _id: string;
  title: string;
  assignee: string;
  dueDate?: string;
  priority?: "High" | "Medium" | "Low";
  description?: string;
  completed?: boolean;
  completedAt?: string | Date;
  subtasks?: Subtask[];
  status: "not started" | "in progress" | "completed";
  order: number;
  section: string;
  project: {
    _id: string;
    name: string;
    color: string;
  };
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
  status?: "on-track" | "at-risk" | "off-track" | "completed";
  completed?: boolean;
  completedAt?: string | Date;
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
  status: "on-track" | "at-risk" | "off-track" | "completed";
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

export type GoalStatus =
  | "on-track"
  | "at-risk"
  | "off-track"
  | "achieved"
  | "no-status";
export type GoalTimeframe =
  | "Q1"
  | "Q2"
  | "Q3"
  | "Q4"
  | "H1"
  | "H2"
  | "FY"
  | "custom";

export interface Goal {
  _id: string;
  title: string;
  description?: string;
  progress: number;
  parentGoalId?: string;
  ownerId: string;
  linkedTasks?: string[];
  status: GoalStatus;
  isPrivate: boolean;
  timeframe: GoalTimeframe;
  timeframeYear?: number;
  startDate?: string;
  dueDate?: string;
  projects?: string[];
  workspaceId?: string;
  members?: string[];
  progressResource?: "projects" | "tasks" | "none";
  children?: Goal[];
  owner?: User;
  workspace?: Workspace;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateGoalDto {
  title: string;
  description?: string;
  progress?: number;
  parentGoalId?: string;
  ownerId: string;
  linkedTasks?: string[];
  status?: GoalStatus;
  isPrivate?: boolean;
  timeframe?: GoalTimeframe;
  timeframeYear?: number;
  startDate?: string;
  dueDate?: string;
  projects?: string[];
  workspaceId?: string;
  members?: string[];
  progressResource?: "projects" | "tasks" | "none";
}

export interface UpdateGoalDto {
  title?: string;
  description?: string;
  progress?: number;
  parentGoalId?: string;
  ownerId?: string;
  linkedTasks?: string[];
  status?: GoalStatus;
  isPrivate?: boolean;
  timeframe?: GoalTimeframe;
  timeframeYear?: number;
  startDate?: string;
  dueDate?: string;
  projects?: string[];
  workspaceId?: string;
  progressResource?: "projects" | "tasks" | "none";
}

export interface Portfolio {
  _id: string;
  name: string;
  description?: string;
  projects: string[] | Project[];
  status?: "on-track" | "at-risk" | "off-track" | "completed" | "no-status";
  progress: number;
  workspaceId: string;
  workspace?: Workspace;
  owner: string | User;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreatePortfolioDto {
  name: string;
  description?: string;
  projects: string[];
  workspaceId: string;
}

export interface UpdatePortfolioDto {
  name?: string;
  description?: string;
  projects?: string[];
  status?: "on-track" | "at-risk" | "off-track" | "completed" | "no-status";
  progress?: number;
}
