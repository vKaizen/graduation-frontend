"use client"

import { useState } from "react"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import {
  Calendar,
  Link,
  Paperclip,
  ThumbsUp,
  X,
  Plus,
  Check,
  ExternalLink,
  MoreHorizontal,
  Bell,
  ChevronRight,
} from "lucide-react"
import { cn } from "@/lib/utils"
import type { TaskDetails as TaskDetailsType } from "@/types"

interface TaskActivity {
  type: "commented" | "created" | "completed"
  user: string
  timestamp: string
  content?: string
}

interface TaskDetailsProps {
  task: TaskDetailsType | null
  onClose: () => void
  onUpdate: (taskId: string, updates: Partial<TaskDetailsType>) => void
}

export function TaskDetails({ task, onClose, onUpdate }: TaskDetailsProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editedTitle, setEditedTitle] = useState(task?.title || "")
  const [newComment, setNewComment] = useState("")
  const [activeTab, setActiveTab] = useState<"comments" | "activity">("comments")
  const [newSubtask, setNewSubtask] = useState("")
  const [isAddingSubtask, setIsAddingSubtask] = useState(false)

  if (!task) return null

  const handleTitleSave = () => {
    if (editedTitle.trim() === "") return // Don't save empty titles
    onUpdate(task.id, {
      ...task, // Preserve all existing task data
      title: editedTitle.trim(),
    })
    setIsEditing(false)
  }

  const handleAddComment = () => {
    if (!newComment.trim()) return

    const newActivity: TaskActivity = {
      type: "commented",
      user: "Ka",
      timestamp: "Just now",
      content: newComment,
    }

    onUpdate(task.id, {
      activities: [...task.activities, newActivity],
    })
    setNewComment("")
  }

  const handleAddSubtask = () => {
    if (!newSubtask.trim()) return

    const newSubtaskItem = {
      id: `subtask-${Date.now()}`,
      title: newSubtask,
      completed: false,
    }

    onUpdate(task.id, {
      subtasks: [...task.subtasks, newSubtaskItem],
    })
    setNewSubtask("")
    setIsAddingSubtask(false)
  }

  return (
    <Sheet open={!!task} onOpenChange={() => onClose()}>
      <SheetContent
        side="right"
        style={{ width: "800px", maxWidth: "90vw" }}
        className="bg-[#1a1a1a] border-l border-[#222] p-0 overflow-hidden"
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <SheetHeader className="py-2 px-4 flex items-center justify-between border-b border-[#222]">
            <div className="sr-only">
              <SheetTitle>{task.title}</SheetTitle>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="text-neutral-200 border-neutral-700 hover:bg-neutral-800 hover:text-neutral-100 h-8"
              onClick={() => {
                onUpdate(task.id, {
                  ...task,
                  completed: !task.completed,
                })
              }}
            >
              <Check className="h-4 w-4 mr-2" />
              {task.completed ? "Mark incomplete" : "Mark complete"}
            </Button>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="text-neutral-400 hover:text-neutral-300 hover:bg-neutral-800 h-8 w-8"
              >
                <ThumbsUp className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="text-neutral-400 hover:text-neutral-300 hover:bg-neutral-800 h-8 w-8"
              >
                <Paperclip className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="text-neutral-400 hover:text-neutral-300 hover:bg-neutral-800 h-8 w-8"
              >
                <Link className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="text-neutral-400 hover:text-neutral-300 hover:bg-neutral-800 h-8 w-8"
              >
                <ExternalLink className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="text-neutral-400 hover:text-neutral-300 hover:bg-neutral-800 h-8 w-8"
              >
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </div>
          </SheetHeader>

          <div className="flex-1 overflow-y-auto bg-[#1a1a1a]">
            {/* Task Title */}
            <div className="px-6 pt-6 pb-2">
              {isEditing ? (
                <div className="flex items-center gap-2">
                  <Input
                    value={editedTitle}
                    onChange={(e) => setEditedTitle(e.target.value)}
                    className="bg-[#222] border-0 text-2xl font-semibold text-white focus-visible:ring-1 focus-visible:ring-neutral-500"
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault()
                        handleTitleSave()
                      }
                      if (e.key === "Escape") {
                        e.preventDefault()
                        setEditedTitle(task.title)
                        setIsEditing(false)
                      }
                    }}
                  />
                  <Button size="sm" onClick={handleTitleSave}>
                    Save
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setEditedTitle(task.title)
                      setIsEditing(false)
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              ) : (
                <div
                  className="group cursor-pointer inline-block"
                  onClick={() => {
                    setEditedTitle(task.title) // Set current title when starting to edit
                    setIsEditing(true)
                  }}
                >
                  <h2 className="text-2xl font-semibold text-white group-hover:text-neutral-300 transition-colors">
                    {task.title}
                  </h2>
                </div>
              )}
            </div>

            <div className="px-6 space-y-6">
              {/* Assignee */}
              <div className="space-y-2">
                <label className="text-sm text-neutral-400">Assignee</label>
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-2">
                    <Avatar className="h-6 w-6 bg-amber-500">
                      <AvatarFallback className="text-xs">{task.assignee?.substring(0, 2) || "Ka"}</AvatarFallback>
                    </Avatar>
                    <span className="text-neutral-200">{task.assignee || "Kaizen"}</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-neutral-400 hover:text-neutral-300 hover:bg-neutral-800 ml-2 h-6 w-6 p-0"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-neutral-400 hover:text-neutral-300 hover:bg-neutral-800 ml-auto"
                  >
                    Recently assigned
                  </Button>
                </div>
              </div>

              {/* Due Date */}
              <div className="space-y-2">
                <label className="text-sm text-neutral-400">Due date</label>
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-2">
                    <Avatar className="h-6 w-6 bg-neutral-700">
                      <AvatarFallback className="text-neutral-300">
                        <Calendar className="h-4 w-4" />
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-neutral-200">{task.dueDate || "Today - Mar 18"}</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-neutral-400 hover:text-neutral-300 hover:bg-neutral-800 ml-2 h-6 w-6 p-0"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Project */}
              <div className="space-y-2">
                <label className="text-sm text-neutral-400">Projects</label>
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-2 bg-[#222] px-2 py-1 rounded hover:bg-[#2a2a2a]">
                    <span className="w-2 h-2 rounded-full bg-cyan-500" />
                    <span className="text-sm text-neutral-200">{task.project?.name || "Task management project"}</span>
                    <Badge variant="secondary" className="bg-[#2a2a2a] text-neutral-200">
                      {task.project?.status || "Doing"}
                    </Badge>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-neutral-400 hover:text-neutral-300 hover:bg-neutral-800 ml-2 h-6 w-6 p-0"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-neutral-400 hover:text-neutral-300 hover:bg-neutral-800"
                >
                  Add to projects
                </Button>
              </div>

              {/* Dependencies */}
              <div className="space-y-2 bg-[#222] rounded-lg p-3">
                <div className="flex items-center justify-between">
                  <label className="text-sm text-neutral-400">Dependencies</label>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-neutral-400 hover:text-neutral-300 hover:bg-neutral-800 h-7 px-2"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add dependency
                  </Button>
                </div>
                <div className="text-sm text-neutral-500 italic">No dependencies added yet</div>
              </div>

              {/* Fields */}
              <div className="space-y-2">
                <label className="text-sm text-neutral-400">Fields</label>
                <div className="space-y-2 bg-[#222] rounded-lg overflow-hidden">
                  <div className="flex items-center justify-between px-3 py-2 hover:bg-[#2a2a2a]">
                    <div className="flex items-center gap-2">
                      <ChevronRight className="h-4 w-4 text-neutral-500" />
                      <span className="text-sm text-neutral-400">Priority</span>
                    </div>
                    <Badge
                      className={cn(
                        task.priority === "High"
                          ? "bg-red-500/20 text-red-300 hover:bg-red-500/30"
                          : task.priority === "Medium"
                            ? "bg-amber-500/20 text-amber-300 hover:bg-amber-500/30"
                            : "bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30",
                      )}
                    >
                      {task.priority || "Low"}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between px-3 py-2 hover:bg-[#2a2a2a]">
                    <div className="flex items-center gap-2">
                      <ChevronRight className="h-4 w-4 text-neutral-500" />
                      <span className="text-sm text-neutral-400">Status</span>
                    </div>
                    <Badge className="bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30">
                      {task.project?.status || "On track"}
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Description */}
              <div className="space-y-2">
                <label className="text-sm text-neutral-400">Description</label>
                <Textarea
                  placeholder="What is this task about?"
                  className="bg-[#353535] border-0 resize-none min-h-[120px] text-neutral-200 text-base"
                  value={task.description || ""}
                  onChange={(e) => onUpdate(task.id, { description: e.target.value })}
                />
              </div>

              {/* Subtasks */}
              <div className="space-y-2">
                <label className="text-sm text-neutral-400">Subtasks</label>
                <div className="space-y-2">
                  {task.subtasks.map((subtask) => (
                    <div key={subtask.id} className="flex items-center gap-2 group">
                      <div className="flex items-center gap-2 flex-1">
                        <input
                          type="checkbox"
                          checked={subtask.completed}
                          onChange={() =>
                            onUpdate(task.id, {
                              subtasks: task.subtasks.map((st) =>
                                st.id === subtask.id ? { ...st, completed: !st.completed } : st,
                              ),
                            })
                          }
                          className="rounded border-neutral-700"
                        />
                        <span
                          className={cn(
                            "text-sm",
                            subtask.completed ? "text-neutral-500 line-through" : "text-neutral-200",
                          )}
                        >
                          {subtask.title}
                        </span>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="opacity-0 group-hover:opacity-100 h-6 w-6 p-0 hover:bg-neutral-800"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}

                  {isAddingSubtask ? (
                    <div className="flex items-center gap-2">
                      <Input
                        autoFocus
                        value={newSubtask}
                        onChange={(e) => setNewSubtask(e.target.value)}
                        placeholder="Add a subtask"
                        className="bg-[#353535] border-0 text-white"
                        onKeyDown={(e) => {
                          if (e.key === "Enter") handleAddSubtask()
                          if (e.key === "Escape") setIsAddingSubtask(false)
                        }}
                      />
                      <Button size="sm" onClick={handleAddSubtask}>
                        Add
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setIsAddingSubtask(false)}
                        className="hover:bg-neutral-800"
                      >
                        Cancel
                      </Button>
                    </div>
                  ) : (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-neutral-400 hover:text-neutral-300 hover:bg-neutral-800"
                      onClick={() => setIsAddingSubtask(true)}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add subtask
                    </Button>
                  )}
                </div>
              </div>
            </div>

            {/* Comments/Activity Section */}
            <div className="border-t border-[#353535] mt-4">
              <div className="flex border-b border-[#353535]">
                <Button
                  variant="ghost"
                  className={cn(
                    "flex-1 rounded-none text-sm font-medium",
                    activeTab === "comments"
                      ? "text-white border-b-2 border-white"
                      : "text-neutral-400 hover:text-neutral-300 hover:bg-neutral-800",
                  )}
                  onClick={() => setActiveTab("comments")}
                >
                  Comments
                </Button>
                <Button
                  variant="ghost"
                  className={cn(
                    "flex-1 rounded-none text-sm font-medium",
                    activeTab === "activity"
                      ? "text-white border-b-2 border-white"
                      : "text-neutral-400 hover:text-neutral-300 hover:bg-neutral-800",
                  )}
                  onClick={() => setActiveTab("activity")}
                >
                  All activity
                </Button>
              </div>

              <div className="p-4 space-y-4">
                {task.activities
                  .filter((activity) => activeTab === "activity" || activity.type === "commented")
                  .map((activity, index) => (
                    <div key={index} className="flex items-start gap-3 group">
                      <Avatar className="h-6 w-6 bg-amber-500">
                        <AvatarFallback className="text-xs">Ka</AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-neutral-200">Kaizen</span>
                          <span className="text-xs text-neutral-500">
                            {activity.type === "commented"
                              ? "commented"
                              : activity.type === "created"
                                ? "created this task"
                                : "completed this task"}
                          </span>
                          <span className="text-xs text-neutral-500">{activity.timestamp}</span>
                        </div>
                        {activity.content && <p className="mt-1 text-sm text-neutral-300">{activity.content}</p>}
                      </div>
                      {activity.type === "commented" && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="opacity-0 group-hover:opacity-100 h-6 w-6 p-0 hover:bg-neutral-800"
                        >
                          <ThumbsUp className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  ))}

                <div className="flex items-start gap-3 pt-2">
                  <Avatar className="h-8 w-8 bg-amber-500">
                    <AvatarFallback className="text-sm">Ka</AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <Textarea
                      placeholder="Add a comment..."
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      className="bg-[#222] border-0 resize-none min-h-[100px] text-white rounded-lg placeholder:text-neutral-500"
                    />
                    {newComment && (
                      <div className="mt-2 flex justify-end">
                        <Button size="sm" onClick={handleAddComment}>
                          Comment
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-[#222] flex items-center justify-between bg-[#1a1a1a]">
            <div className="flex items-center gap-3">
              <span className="text-sm text-neutral-400">Collaborators</span>
              <div className="flex -space-x-2">
                <Avatar className="h-6 w-6 border-2 border-[#1a1a1a] bg-amber-500">
                  <AvatarFallback className="text-xs">Ka</AvatarFallback>
                </Avatar>
                <Avatar className="h-6 w-6 border-2 border-[#1a1a1a] bg-neutral-700">
                  <AvatarFallback className="text-xs">
                    <Plus className="h-3 w-3" />
                  </AvatarFallback>
                </Avatar>
              </div>
            </div>
            <Button variant="ghost" className="text-neutral-400 hover:text-neutral-300 hover:bg-neutral-800">
              <Bell className="h-4 w-4 mr-2" />
              Leave task
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}

