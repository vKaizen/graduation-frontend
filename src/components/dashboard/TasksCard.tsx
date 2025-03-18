"use client"

import { useState } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { MoreHorizontal, Check } from "lucide-react"

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
  const toggleTaskCompletion = (taskId) => {
    setTasks(tasks.map((task) => (task.id === taskId ? { ...task, completed: !task.completed } : task)))

    // If we're completing a task and there are no other tasks in the current tab,
    // switch to the appropriate tab
    const taskToToggle = tasks.find((task) => task.id === taskId)
    if (!taskToToggle.completed) {
      // We're marking it as completed
      if (upcomingTasks.length === 1 && upcomingTasks[0].id === taskId && activeTab === "upcoming") {
        setActiveTab("completed")
      } else if (overdueTasks.length === 1 && overdueTasks[0].id === taskId && activeTab === "overdue") {
        setActiveTab("completed")
      }
    } else {
      // We're marking it as uncompleted
      if (completedTasks.length === 1 && completedTasks[0].id === taskId && activeTab === "completed") {
        setActiveTab("upcoming")
      }
    }
  }

  return (
    <Card className="bg-[#1a1a1a] border-0 shadow-md">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div className="flex items-center space-x-3">
          <Avatar className="h-8 w-8 bg-purple-600">
            <AvatarImage
              src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/image-WUXcKQSumnMERmyMj9qQSP48QcRvJY.png"
              alt="Avatar"
            />
            <AvatarFallback>CI</AvatarFallback>
          </Avatar>
          <h3 className="text-xl font-semibold text-white">My tasks</h3>
        </div>
        <Button variant="ghost" size="icon" className="text-gray-400 hover:text-white hover:bg-white/10">
          <MoreHorizontal className="h-5 w-5" />
          <span className="sr-only">More options</span>
        </Button>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="bg-transparent w-full justify-start h-auto p-0 mb-4 border-b border-gray-800">
            <TabsTrigger
              value="upcoming"
              className="text-gray-400 data-[state=active]:border-b-2 data-[state=active]:border-white data-[state=active]:text-white rounded-none px-4 py-2 -mb-px"
            >
              Upcoming
            </TabsTrigger>
            <TabsTrigger
              value="overdue"
              className="text-gray-400 data-[state=active]:border-b-2 data-[state=active]:border-white data-[state=active]:text-white rounded-none px-4 py-2 -mb-px"
            >
              Overdue ({overdueTasks.length})
            </TabsTrigger>
            <TabsTrigger
              value="completed"
              className="text-gray-400 data-[state=active]:border-b-2 data-[state=active]:border-white data-[state=active]:text-white rounded-none px-4 py-2 -mb-px"
            >
              Completed
            </TabsTrigger>
          </TabsList>

          <TabsContent value="upcoming" className="mt-0 space-y-2">
            {upcomingTasks.length > 0 ? (
              upcomingTasks.map((task) => (
                <div
                  key={task.id}
                  className="flex items-center justify-between p-3 hover:bg-white/5 rounded-lg cursor-pointer group transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="h-5 w-5 rounded-full border-2 border-gray-500 group-hover:border-white transition-colors flex items-center justify-center cursor-pointer"
                      onClick={() => toggleTaskCompletion(task.id)}
                    />
                    <span className="text-white">{task.title}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`px-2 py-1 rounded ${task.projectColor} text-xs`}>{task.project}</span>
                    <span className="text-gray-400 text-sm">{task.dueDate}</span>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-4 text-gray-400">No upcoming tasks.</div>
            )}
          </TabsContent>

          <TabsContent value="overdue" className="mt-0 space-y-2">
            {overdueTasks.length > 0 ? (
              overdueTasks.map((task) => (
                <div
                  key={task.id}
                  className="flex items-center justify-between p-3 hover:bg-white/5 rounded-lg cursor-pointer group transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="h-5 w-5 rounded-full border-2 border-red-500 group-hover:border-red-400 transition-colors flex items-center justify-center cursor-pointer"
                      onClick={() => toggleTaskCompletion(task.id)}
                    />
                    <span className="text-white">{task.title}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`px-2 py-1 rounded ${task.projectColor} text-xs`}>{task.project}</span>
                    <span className="text-red-400 text-sm">{task.dueDate}</span>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-4 text-gray-400">No overdue tasks.</div>
            )}
          </TabsContent>

          <TabsContent value="completed" className="mt-0 space-y-2">
            {completedTasks.length > 0 ? (
              completedTasks.map((task) => (
                <div
                  key={task.id}
                  className="flex items-center justify-between p-3 hover:bg-white/5 rounded-lg cursor-pointer group transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="h-5 w-5 rounded-full border-2 border-green-500 bg-green-500/20 transition-colors flex items-center justify-center cursor-pointer"
                      onClick={() => toggleTaskCompletion(task.id)}
                    >
                      <Check className="h-3 w-3 text-green-500" />
                    </div>
                    <span className="text-gray-400 line-through">{task.title}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`px-2 py-1 rounded bg-gray-700 text-gray-400 text-xs`}>{task.project}</span>
                    <span className="text-gray-500 text-sm">{task.dueDate}</span>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-4 text-gray-400">No completed tasks yet.</div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}

