"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Check, Plus, Circle } from "lucide-react"
import { BaseCard } from "./BaseCard"
import { cn } from "@/lib/utils"

// Sample tasks data
const initialTasks = [
  {
    id: "1",
    title: "Draft project brief",
    project: "Cross-functional",
    projectColor: "bg-teal-400/20 text-teal-400",
    dueDate: "Oct 15, 2024",
    completed: false,
    overdue: false,
  },
]

export function TasksCard() {
  const [tasks, setTasks] = useState(initialTasks)
  const [activeTab, setActiveTab] = useState("upcoming")

  // Filter tasks based on their status
  const upcomingTasks = tasks.filter((task) => !task.completed && !task.overdue)
  const overdueTasks = tasks.filter((task) => !task.completed && task.overdue)
  const completedTasks = tasks.filter((task) => task.completed)

  // Toggle task completion status
  const toggleTaskCompletion = (taskId: string) => {
    setTasks(tasks.map((task) => (task.id === taskId ? { ...task, completed: !task.completed } : task)))
  }

  return (
    <BaseCard title="My tasks">
      <div className="h-full flex flex-col">
        {/* Simple tab buttons */}
        <div className="flex space-x-2 mb-4 border-b border-gray-800">
          <button
            className={cn(
              "px-3 py-2 text-sm font-medium",
              activeTab === "upcoming" ? "text-white border-b-2 border-white" : "text-gray-400 hover:text-white",
            )}
            onClick={() => setActiveTab("upcoming")}
          >
            Upcoming
          </button>
          <button
            className={cn(
              "px-3 py-2 text-sm font-medium",
              activeTab === "overdue" ? "text-white border-b-2 border-white" : "text-gray-400 hover:text-white",
            )}
            onClick={() => setActiveTab("overdue")}
          >
            Overdue ({overdueTasks.length})
          </button>
          <button
            className={cn(
              "px-3 py-2 text-sm font-medium",
              activeTab === "completed" ? "text-white border-b-2 border-white" : "text-gray-400 hover:text-white",
            )}
            onClick={() => setActiveTab("completed")}
          >
            Completed
          </button>
        </div>

        <Button variant="ghost" className="w-full justify-start gap-3 mb-4 text-white font-medium hover:bg-white/5 p-2">
          <div className="h-10 w-10 rounded flex items-center justify-center border-2 border-dashed border-gray-600">
            <Plus className="h-5 w-5" />
          </div>
          Create task
        </Button>

        <div className="space-y-2 flex-1 overflow-y-auto">
          {activeTab === "upcoming" &&
            upcomingTasks.map((task) => (
              <div
                key={task.id}
                className="flex items-center gap-3 p-2 hover:bg-white/5 rounded-lg cursor-pointer transition-colors"
              >
                <div
                  className="h-10 w-10 rounded-full flex items-center justify-center border-2 border-gray-500"
                  onClick={() => toggleTaskCompletion(task.id)}
                >
                  <Circle className="h-5 w-5 text-gray-500" />
                </div>
                <span className="text-white">{task.title}</span>
              </div>
            ))}

          {activeTab === "overdue" &&
            overdueTasks.map((task) => (
              <div
                key={task.id}
                className="flex items-center gap-3 p-2 hover:bg-white/5 rounded-lg cursor-pointer transition-colors"
              >
                <div
                  className="h-10 w-10 rounded-full flex items-center justify-center border-2 border-red-500"
                  onClick={() => toggleTaskCompletion(task.id)}
                >
                  <Circle className="h-5 w-5 text-red-500" />
                </div>
                <span className="text-white">{task.title}</span>
              </div>
            ))}

          {activeTab === "completed" &&
            completedTasks.map((task) => (
              <div
                key={task.id}
                className="flex items-center gap-3 p-2 hover:bg-white/5 rounded-lg cursor-pointer transition-colors"
              >
                <div
                  className="h-10 w-10 rounded-full flex items-center justify-center bg-green-500/20 border-2 border-green-500"
                  onClick={() => toggleTaskCompletion(task.id)}
                >
                  <Check className="h-5 w-5 text-green-500" />
                </div>
                <span className="text-gray-400 line-through">{task.title}</span>
              </div>
            ))}

          {activeTab === "upcoming" && upcomingTasks.length === 0 && (
            <div className="p-4 text-gray-400">No upcoming tasks.</div>
          )}

          {activeTab === "overdue" && overdueTasks.length === 0 && (
            <div className="p-4 text-gray-400">No overdue tasks.</div>
          )}

          {activeTab === "completed" && completedTasks.length === 0 && (
            <div className="p-4 text-gray-400">No completed tasks yet.</div>
          )}
        </div>
      </div>
    </BaseCard>
  )
}

