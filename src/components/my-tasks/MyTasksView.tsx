"use client";

import React, { useEffect, useState } from "react";
import { DragDropContext, DropResult } from "@hello-pangea/dnd";
import type { Task } from "@/types";
import { MyTasksBoardView } from "./my-tasks-board-view";
import { ListView } from "./list-view";

interface MyTasksViewProps {
  view?: string;
}

// Mock data for initial UI development
const MOCK_TASKS: Record<string, Task[]> = {
  "recently-assigned": [
    {
      _id: "task1",
      title: "Review project proposal",
      assignee: "user1",
      dueDate: "2023-04-30",
      priority: "High",
      status: "in progress",
      order: 0,
      section: "recently-assigned",
      project: "project1",
    },
    {
      _id: "task2",
      title: "Prepare presentation slides",
      assignee: "user1",
      dueDate: "2023-05-05",
      priority: "Medium",
      status: "not started",
      order: 1,
      section: "recently-assigned",
      project: "project2",
    },
  ],
  today: [
    {
      _id: "task3",
      title: "Team meeting at 2 PM",
      assignee: "user1",
      dueDate: "2023-04-28",
      priority: "High",
      status: "not started",
      order: 0,
      section: "today",
      project: "project1",
    },
  ],
  upcoming: [
    {
      _id: "task5",
      title: "Client presentation",
      assignee: "user1",
      dueDate: "2023-05-10",
      priority: "High",
      status: "not started",
      order: 0,
      section: "upcoming",
      project: "project2",
    },
  ],
  later: [
    {
      _id: "task6",
      title: "Quarterly review",
      assignee: "user1",
      dueDate: "2023-06-15",
      priority: "Low",
      status: "not started",
      order: 0,
      section: "later",
      project: "project1",
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

  useEffect(() => {
    setActiveView(view);
    loadTasks();
  }, [view]);

  const loadTasks = async () => {
    try {
      setLoading(true);
      // In the future, this would fetch real data from the API
      // const loadedTasks = await fetchUserTasks();
      // setTasks(loadedTasks);
      // setOriginalTasks(loadedTasks);
    } catch (error) {
      console.error("Error loading tasks:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddTask = async (sectionId: string, task: Omit<Task, "_id">) => {
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

  return (
    <div className="flex flex-col h-full bg-black">
      <DragDropContext onDragEnd={handleDragEnd}>
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
            <p className="text-lg">Calendar view will be implemented soon</p>
          </div>
        )}
      </DragDropContext>
    </div>
  );
}
