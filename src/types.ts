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
}

// Add new types for task details
export interface TaskActivity {
  type: "created" | "completed" | "updated" | "commented";
  user: string;
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
  ownerId?: string;
  color: string;
  status: string;
}

export interface AddMemberDto {
  userId: string;
  role: "Owner" | "Member" | "Admin";
}

export interface UpdateProjectStatusDto {
  status: "active" | "completed" | "archived";
}
