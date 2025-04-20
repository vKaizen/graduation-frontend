"use client";

import React, { useEffect, useState } from "react";
import { DragDropContext, DropResult } from "@hello-pangea/dnd";
import type { Task } from "@/types";
import { MyTasksBoardView } from "./my-tasks-board-view";
import { ListView } from "./list-view";
import { useWorkspace } from "@/contexts/workspace-context";
import { fetchTasksByWorkspace } from "@/api-service";

interface MyTasksViewProps {
  view?: string;
}

// Group for temporary mock data
const MOCK_TASKS: Record<string, Task[]> = {
  "not-started": [
    {
      _id: "task1",
      title: "Create project plan",
      assignee: "user1",
      dueDate: "2023-04-30",
      priority: "High",
      status: "not started",
      order: 0,
      section: "not-started",
      project: "Project A",
    },
    {
      _id: "task2",
      title: "Research competitors",
      assignee: "user2",
      dueDate: "2023-04-29",
      priority: "Medium",
      status: "not started",
      order: 1,
      section: "not-started",
      project: "Project B",
    },
    {
      _id: "task3",
      title: "Project sync at 2 PM",
      assignee: "user1",
      dueDate: "2023-04-28",
      priority: "Low",
      status: "not started",
      order: 2,
      section: "not-started",
      project: "Project C",
    },
  ],
  "in-progress": [
    {
      _id: "task4",
      title: "Design new landing page",
      assignee: "user3",
      dueDate: "2023-05-05",
      priority: "High",
      status: "in progress",
      order: 0,
      section: "in-progress",
      project: "Project A",
    },
    {
      _id: "task5",
      title: "Create API documentation",
      assignee: "user1",
      dueDate: "2023-05-02",
      priority: "Medium",
      status: "in progress",
      order: 1,
      section: "in-progress",
      project: "Project B",
    },
  ],
  completed: [
    {
      _id: "task6",
      title: "Setup development environment",
      assignee: "user2",
      dueDate: "2023-04-25",
      priority: "Low",
      status: "completed",
      order: 0,
      section: "completed",
      project: "Project C",
    },
    {
      _id: "task7",
      title: "Initial project meeting",
      assignee: "user1",
      dueDate: "2023-04-20",
      priority: "Medium",
      status: "completed",
      order: 1,
      section: "completed",
      project: "Project A",
    },
  ],
};

export function MyTasksView({ view = "board" }: MyTasksViewProps) {
  const [activeView, setActiveView] = useState<string>(view);
  const [tasks, setTasks] = useState<Record<string, Task[]>>(MOCK_TASKS);
  const [originalTasks, setOriginalTasks] =
    useState<Record<string, Task[]>>(MOCK_TASKS);
  const [loading, setLoading] = useState<boolean>(false);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [collapsedSections, setCollapsedSections] = useState<
    Record<string, boolean>
  >({});
  const [activeFilters, setActiveFilters] = useState<string[]>([]);
  const [activeSort, setActiveSort] = useState<{
    field: string;
    direction: "asc" | "desc";
  } | null>(null);
  const { currentWorkspace } = useWorkspace();

  useEffect(() => {
    setActiveView(view);
    if (currentWorkspace) {
      loadTasks();
    }
  }, [view, currentWorkspace]);

  const loadTasks = async () => {
    if (!currentWorkspace) return;

    try {
      setLoading(true);

      // Fetch tasks filtered by current workspace
      const workspaceTasks = await fetchTasksByWorkspace(currentWorkspace._id);
      console.log("Fetched workspace tasks:", workspaceTasks);

      // Group tasks by section
      const groupedTasks: Record<string, Task[]> = {
        "not-started": [],
        "in-progress": [],
        completed: [],
      };

      // Process fetched tasks
      if (workspaceTasks.length > 0) {
        workspaceTasks.forEach((task) => {
          const sectionKey = task.status.replace(/\s+/g, "-");
          if (!groupedTasks[sectionKey]) {
            groupedTasks[sectionKey] = [];
          }
          groupedTasks[sectionKey].push(task);
        });

        setTasks(groupedTasks);
        setOriginalTasks(groupedTasks);
      }
      // Use mock data if no tasks found (for demo purposes)
      else {
        setTasks(MOCK_TASKS);
        setOriginalTasks(MOCK_TASKS);
      }
    } catch (error) {
      console.error("Error loading tasks:", error);
      // Fallback to mock data on error
      setTasks(MOCK_TASKS);
      setOriginalTasks(MOCK_TASKS);
    } finally {
      setLoading(false);
    }
  };

  const handleAddTask = async (sectionId: string, task: Omit<Task, "_id">) => {
    if (!currentWorkspace) return;

    const newTask: Task = {
      ...task,
      _id: `task${Date.now()}`,
      status: "not started",
      order: tasks[sectionId]?.length || 0,
      section: sectionId,
      project: task.project || "personal",
    };

    const updatedTasks = {
      ...tasks,
      [sectionId]: [...(tasks[sectionId] || []), newTask],
    };

    setTasks(updatedTasks);
    setOriginalTasks(updatedTasks);
  };

  const handleUpdateTask = async (
    sectionId: string,
    taskId: string,
    updatedTask: Partial<Task>
  ) => {
    const updatedTasks = {
      ...tasks,
      [sectionId]: tasks[sectionId].map((task) =>
        task._id === taskId ? { ...task, ...updatedTask } : task
      ),
    };

    setTasks(updatedTasks);
    setOriginalTasks(updatedTasks);
  };

  const handleDeleteTask = async (sectionId: string, taskId: string) => {
    const updatedTasks = {
      ...tasks,
      [sectionId]: tasks[sectionId].filter((task) => task._id !== taskId),
    };

    setTasks(updatedTasks);
    setOriginalTasks(updatedTasks);
  };

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;

    const { source, destination } = result;
    const sourceSectionId = source.droppableId;
    const destSectionId = destination.droppableId;

    const updatedTasks = { ...tasks };
    const [movedTask] = updatedTasks[sourceSectionId].splice(source.index, 1);
    updatedTasks[destSectionId].splice(destination.index, 0, {
      ...movedTask,
      section: destSectionId,
    });

    setTasks(updatedTasks);
    setOriginalTasks(updatedTasks);
  };

  if (!currentWorkspace) {
    return (
      <div className="flex items-center justify-center h-full text-neutral-400">
        <p className="text-lg">Please select a workspace to view your tasks</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-black">
      <DragDropContext onDragEnd={handleDragEnd}>
        {loading ? (
          <div className="flex items-center justify-center h-full text-neutral-400">
            <div className="animate-spin h-8 w-8 border-t-2 border-b-2 border-gray-500 rounded-full"></div>
          </div>
        ) : (
          <>
            {activeView === "board" && (
              <div className="p-6">
                <MyTasksBoardView
                  tasks={tasks}
                  onDragEnd={handleDragEnd}
                  addTask={handleAddTask}
                  updateTask={handleUpdateTask}
                  deleteTask={handleDeleteTask}
                  collapsedSections={collapsedSections}
                  setCollapsedSections={setCollapsedSections}
                  selectedTaskId={selectedTaskId}
                  setSelectedTaskId={setSelectedTaskId}
                />
              </div>
            )}
            {activeView === "list" && (
              <div className="p-6">
                <ListView
                  tasks={tasks}
                  updateTask={handleUpdateTask}
                  deleteTask={handleDeleteTask}
                  selectedTaskId={selectedTaskId}
                  setSelectedTaskId={setSelectedTaskId}
                />
              </div>
            )}
            {activeView === "calendar" && (
              <div className="flex items-center justify-center h-full text-neutral-400">
                <p className="text-lg">
                  Calendar view will be implemented soon
                </p>
              </div>
            )}
          </>
        )}
      </DragDropContext>
    </div>
  );
}
