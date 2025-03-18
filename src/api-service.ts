import type { Project, Task } from "./types";

export const fetchProject = async (
  projectId: string
): Promise<Project | null> => {
  // This is a mock implementation. Replace with actual API call when ready.
  return new Promise((resolve) => {
    setTimeout(() => {
      const projects: Record<string, Project> = {
        AboRas: {
          id: "AboRas",
          name: "AboRas",
          color: "bg-purple-500",
          sections: [
            {
              id: "section-1",
              title: "To Do",
              tasks: [
                {
                  id: "task-1",
                  title: "Design homepage",
                  assignee: "CX",
                  dueDate: "Feb 4",
                  priority: "Medium",
                },
                {
                  id: "task-2",
                  title: "Implement API",
                  assignee: "JD",
                  dueDate: "24/3/2025",
                  priority: "High",
                },
              ],
            },
            {
              id: "section-2",
              title: "In Progress",
              tasks: [
                {
                  id: "task-3",
                  title: "Database setup",
                  assignee: null,
                  priority: "Low",
                },
              ],
            },
          ],
        },
        "Cross-functional": {
          id: "Cross-functional",
          name: "Cross-functional",
          color: "bg-green-500",
          sections: [
            {
              id: "section-1",
              title: "Planning",
              tasks: [
                {
                  id: "task-1",
                  title: "Define project scope",
                  assignee: "JD",
                  dueDate: "Mar 15",
                  priority: "High",
                },
                {
                  id: "task-2",
                  title: "Identify stakeholders",
                  assignee: "CX",
                  dueDate: "Mar 18",
                  priority: "Medium",
                },
              ],
            },
            {
              id: "section-2",
              title: "Execution",
              tasks: [
                {
                  id: "task-3",
                  title: "Cross-team meeting",
                  assignee: "JD",
                  dueDate: "Mar 25",
                  priority: "High",
                },
              ],
            },
          ],
        },
        gggg: {
          id: "gggg",
          name: "gggg",
          color: "bg-blue-500",
          sections: [
            {
              id: "section-1",
              title: "Backlog",
              tasks: [
                {
                  id: "task-1",
                  title: "Task 1",
                  assignee: "JD",
                  dueDate: "May 5",
                  priority: "Low",
                },
                {
                  id: "task-2",
                  title: "Task 2",
                  assignee: "CX",
                  dueDate: "May 10",
                  priority: "Medium",
                },
              ],
            },
          ],
        },
        bydato: {
          id: "bydato",
          name: "bydato",
          color: "bg-[#fd3939]",
          sections: [
            {
              id: "section-1",
              title: "Research",
              tasks: [
                {
                  id: "task-1",
                  title: "Market analysis",
                  assignee: "JD",
                  dueDate: "Jun 5",
                  priority: "High",
                },
              ],
            },
            {
              id: "section-2",
              title: "Development",
              tasks: [
                {
                  id: "task-2",
                  title: "Feature implementation",
                  assignee: "CX",
                  dueDate: "Jun 20",
                  priority: "Medium",
                },
              ],
            },
          ],
        },
      };
      resolve(projects[projectId] || null);
    }, 500);
  });
};

export const addTask = async (
  projectId: string,
  sectionId: string,
  task: Omit<Task, "id">
): Promise<Task> => {
  // This is a mock implementation. Replace with actual API call when ready.
  return new Promise((resolve) => {
    setTimeout(() => {
      const newTask: Task = {
        ...task,
        id: `task-${Date.now()}`,
      };
      resolve(newTask);
    }, 200);
  });
};

// Add this new function to get the list of project IDs
export const getProjectIds = async (): Promise<string[]> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(["AboRas", "Cross-functional", "gggg", "bydato"]);
    }, 200);
  });
};
