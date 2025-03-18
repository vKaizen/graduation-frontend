export interface Task {
  id: string;
  title: string;
  assignee: string | null;
  dueDate?: string;
  priority?: "High" | "Medium" | "Low";
  description?: string;
}

export interface Section {
  id: string;
  title: string;
  tasks: Task[];
}

export interface Project {
  id: string;
  name: string;
  color: string;
  sections: Section[];
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
}

export interface TaskDetails extends Task {
  description?: string;
  activities: TaskActivity[];
  subtasks: Subtask[];
  collaborators: string[];
  project: {
    id: string;
    name: string;
    status: string;
  };
}
