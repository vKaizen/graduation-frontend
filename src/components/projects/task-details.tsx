"use client";

import { useState, useEffect } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
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
  User2,
  Sparkles,
  Pencil,
  ArrowRight,
  GripVertical,
  ChevronLeft,
  Trash2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { TaskDetails as TaskDetailsType, Subtask } from "@/types";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { formatUsername, getInitials } from "@/lib/user-utils";
import { fetchUserById, fetchProjectMembers } from "@/api-service";
import { format } from "date-fns";

interface TaskActivity {
  type: "commented" | "created" | "completed";
  user: string;
  timestamp: string;
  content?: string;
}

interface TaskDetailsProps {
  task: TaskDetailsType | null;
  onClose: () => void;
  onUpdate:
    | ((taskId: string, updates: Partial<TaskDetailsType>) => void)
    | ((
        sectionId: string,
        taskId: string,
        updates: Partial<TaskDetailsType>
      ) => void);
  onDelete: () => void;
}

export function TaskDetails({
  task,
  onClose,
  onUpdate: originalOnUpdate,
  onDelete,
}: TaskDetailsProps) {
  // Create an adapter function to handle both interface patterns
  const onUpdate = (taskId: string, updates: Partial<TaskDetailsType>) => {
    try {
      // Check if the function expects 2 or 3 parameters
      if (originalOnUpdate.length === 3) {
        // If it expects 3, it's using the (sectionId, taskId, updates) pattern
        // For this case, we'll use task.project.id as the sectionId
        (
          originalOnUpdate as (
            sectionId: string,
            taskId: string,
            updates: Partial<TaskDetailsType>
          ) => void
        )(task?.project?.id || "", taskId, updates);
      } else {
        // Otherwise, it's using the (taskId, updates) pattern
        (
          originalOnUpdate as (
            taskId: string,
            updates: Partial<TaskDetailsType>
          ) => void
        )(taskId, updates);
      }
    } catch (error) {
      console.error("Error in onUpdate adapter:", error);
      // Fallback to the 2-parameter version
      (
        originalOnUpdate as (
          taskId: string,
          updates: Partial<TaskDetailsType>
        ) => void
      )(taskId, updates);
    }
  };

  const [isEditing, setIsEditing] = useState(false);
  const [editedTitle, setEditedTitle] = useState(task?.title || "");
  const [newComment, setNewComment] = useState("");
  const [activeTab, setActiveTab] = useState<"comments" | "activity">(
    "comments"
  );
  const [newSubtask, setNewSubtask] = useState("");
  const [isAddingSubtask, setIsAddingSubtask] = useState(false);
  const [editingSubtaskId, setEditingSubtaskId] = useState<string | null>(null);
  const [editedSubtaskTitle, setEditedSubtaskTitle] = useState("");
  const [selectedSubtask, setSelectedSubtask] = useState<Subtask | null>(null);
  const [subtaskDescription, setSubtaskDescription] = useState("");

  // Add state for user data
  const [userMap, setUserMap] = useState<
    Record<string, { fullName: string; email: string }>
  >({});
  const [isLoadingUserData, setIsLoadingUserData] = useState(true);
  const [projectMembers, setProjectMembers] = useState<any[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(false);

  // Update the subtask creation and editing interfaces to include assignee and due date fields
  const [newSubtaskAssignee, setNewSubtaskAssignee] = useState<string | null>(
    null
  );
  const [newSubtaskDueDate, setNewSubtaskDueDate] = useState<string>("");
  const [editedSubtaskAssignee, setEditedSubtaskAssignee] = useState<
    string | null
  >(null);
  const [editedSubtaskDueDate, setEditedSubtaskDueDate] = useState<string>("");

  // Function to load project members
  useEffect(() => {
    if (task?.project?.id) {
      const loadProjectMembers = async () => {
        setLoadingMembers(true);
        try {
          // If the task has a project ID, fetch project members
          const members = await fetchProjectMembers(task.project.id);
          if (members) {
            setProjectMembers(members);

            // Also update userMap with project members
            const newUserMap: Record<
              string,
              { fullName: string; email: string }
            > = {};
            members.forEach((member) => {
              newUserMap[member._id] = {
                email: member.email || "Unknown",
                fullName: member.fullName || formatUsername(member.email),
              };
            });

            setUserMap((prev) => ({ ...prev, ...newUserMap }));
          }
        } catch (error) {
          console.error("Error loading project members:", error);
        } finally {
          setLoadingMembers(false);
        }
      };

      loadProjectMembers();
    }
  }, [task?.project?.id]);

  // Function to load user data
  useEffect(() => {
    if (task) {
      const loadUserData = async () => {
        setIsLoadingUserData(true);
        const newUserMap: Record<string, { fullName: string; email: string }> =
          {};

        // Collect all user IDs that need to be fetched
        const userIds = new Set<string>();

        // Add task assignee if it exists and looks like a user ID
        if (task.assignee && !task.assignee.includes("@")) {
          userIds.add(task.assignee);
        }

        // Add subtask assignees
        task.subtasks.forEach((subtask) => {
          if (subtask.assignee && !subtask.assignee.includes("@")) {
            userIds.add(subtask.assignee);
          }
        });

        // Add activity users
        task.activities.forEach((activity) => {
          if (
            typeof activity.user === "string" &&
            !activity.user.includes("@")
          ) {
            userIds.add(activity.user);
          } else if (
            typeof activity.user === "object" &&
            activity.user.userId
          ) {
            userIds.add(activity.user.userId);
          }
        });

        // First check if we already have the user in projectMembers
        for (const userId of userIds) {
          // Skip if we already have this user in the map
          if (userMap[userId]) continue;

          // Check if the user is in projectMembers
          const memberMatch = projectMembers.find(
            (member) => member._id === userId
          );
          if (memberMatch) {
            newUserMap[userId] = {
              email: memberMatch.email || "Unknown",
              fullName:
                memberMatch.fullName || formatUsername(memberMatch.email),
            };
            continue;
          }

          // If not in projectMembers, fetch individually
          try {
            const userData = await fetchUserById(userId);
            if (userData) {
              newUserMap[userId] = {
                email: userData.email || "Unknown",
                fullName:
                  userData.fullName ||
                  userData.name ||
                  formatUsername(userData.email),
              };
            }
          } catch (error) {
            console.error(`Failed to fetch user ${userId}:`, error);
          }
        }

        setUserMap((prev) => ({ ...prev, ...newUserMap }));
        setIsLoadingUserData(false);
      };

      loadUserData();
    }
  }, [task, projectMembers]);

  // Function to format the assignee display name
  const formatAssigneeName = (assignee: string | null): string => {
    if (!assignee) return "Unassigned";

    // If we have the user data in our map, always prefer the full name
    if (userMap[assignee]?.fullName) {
      return userMap[assignee].fullName;
    }

    // If it's an email address, format it nicely
    if (assignee.includes("@")) {
      return formatUsername(assignee);
    }

    // Fallback for when we have a user ID but no user data
    return `User ${assignee.substring(0, 6)}`;
  };

  // Function to get initials for the avatar
  const getAssigneeInitials = (assignee: string | null): string => {
    if (!assignee) return "?";
    const displayName = formatAssigneeName(assignee);
    return getInitials(displayName);
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    if (!dateString) return "";

    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return dateString;

      // Check if it's today
      const today = new Date();
      const isToday =
        date.getDate() === today.getDate() &&
        date.getMonth() === today.getMonth() &&
        date.getFullYear() === today.getFullYear();

      if (isToday) {
        return `Today - ${format(date, "MMM d")}`;
      }

      // Check if it's tomorrow
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      const isTomorrow =
        date.getDate() === tomorrow.getDate() &&
        date.getMonth() === tomorrow.getMonth() &&
        date.getFullYear() === tomorrow.getFullYear();

      if (isTomorrow) {
        return `Tomorrow - ${format(date, "MMM d")}`;
      }

      // For other dates, show a more complete format
      return format(date, "MMM d, yyyy");
    } catch (e) {
      return dateString;
    }
  };

  // Replace the getProjectColor function with this more robust version
  const getProjectColor = (colorClass?: string) => {
    if (!colorClass) return "#22d3ee"; // Default cyan color

    // Handle custom hex colors in the format bg-[#fd3939]
    if (colorClass.includes("[#") && colorClass.includes("]")) {
      const hexMatch = colorClass.match(/\[#([A-Fa-f0-9]{3,8})\]/);
      if (hexMatch && hexMatch[1]) {
        return `#${hexMatch[1]}`;
      }
    }

    // For standard Tailwind classes like bg-purple-500,
    // we'll apply the class directly to a small element
    return colorClass;
  };

  if (!task) return null;

  const handleTitleSave = () => {
    if (editedTitle.trim() === "") return; // Don't save empty titles
    onUpdate(task._id, {
      title: editedTitle.trim(),
    });
    setIsEditing(false);
  };

  const handleAddComment = () => {
    if (!newComment.trim()) return;

    // Get user ID from task.createdBy or use a generic identifier
    const userId = task.createdBy || "current-user";

    const newActivity: TaskActivity = {
      type: "commented",
      user: userId,
      timestamp: "Just now",
      content: newComment,
    };

    onUpdate(task._id, {
      activities: [...task.activities, newActivity],
    });
    setNewComment("");
  };

  // Update the handleAddSubtask function to include assignee and due date
  const handleAddSubtask = () => {
    if (!newSubtask.trim()) return;

    const newSubtaskItem = {
      id: `subtask-${Date.now()}`,
      title: newSubtask,
      completed: false,
      assignee: newSubtaskAssignee,
      dueDate: newSubtaskDueDate,
      description: "",
    };

    // Update the task with the new subtask while preserving all existing task data
    onUpdate(task._id, {
      subtasks: [...task.subtasks, newSubtaskItem],
    });
    setNewSubtask("");
    setNewSubtaskAssignee(null);
    setNewSubtaskDueDate("");
    setIsAddingSubtask(false);
  };

  // Update the handleEditSubtask function to set the assignee and due date
  const handleEditSubtask = (subtaskId: string) => {
    const subtask = task.subtasks.find((st) => st.id === subtaskId);
    if (subtask) {
      setEditingSubtaskId(subtaskId);
      setEditedSubtaskTitle(subtask.title);
      setEditedSubtaskAssignee(subtask.assignee || null);
      setEditedSubtaskDueDate(subtask.dueDate || "");
    }
  };

  // Update the handleSaveSubtaskEdit function to include assignee and due date
  const handleSaveSubtaskEdit = () => {
    if (!editingSubtaskId || !editedSubtaskTitle.trim()) {
      setEditingSubtaskId(null);
      return;
    }

    onUpdate(task._id, {
      subtasks: task.subtasks.map((st) =>
        st.id === editingSubtaskId
          ? {
              ...st,
              title: editedSubtaskTitle.trim(),
              assignee: editedSubtaskAssignee,
              dueDate: editedSubtaskDueDate,
            }
          : st
      ),
    });
    setEditingSubtaskId(null);
  };

  const handleDeleteSubtask = (subtaskId: string) => {
    onUpdate(task._id, {
      subtasks: task.subtasks.filter((st) => st.id !== subtaskId),
    });
  };

  const handleToggleSubtask = (subtaskId: string) => {
    onUpdate(task._id, {
      subtasks: task.subtasks.map((st) =>
        st.id === subtaskId ? { ...st, completed: !st.completed } : st
      ),
    });
  };

  // Handle drag end for subtasks reordering
  const handleSubtaskDragEnd = (result: any) => {
    const { destination, source } = result;

    // If dropped outside the list or at the same position
    if (!destination || destination.index === source.index) {
      return;
    }

    // Reorder the subtasks array
    const newSubtasks = Array.from(task.subtasks);
    const [removed] = newSubtasks.splice(source.index, 1);
    newSubtasks.splice(destination.index, 0, removed);

    // Update the task with the new subtasks order
    onUpdate(task._id, {
      subtasks: newSubtasks,
    });
  };

  // Open subtask details
  const handleOpenSubtaskDetails = (subtask: Subtask) => {
    setSelectedSubtask(subtask);
    setSubtaskDescription(subtask.description || "");
  };

  // Update subtask details
  const handleUpdateSubtaskDetails = () => {
    if (!selectedSubtask) return;

    onUpdate(task._id, {
      subtasks: task.subtasks.map((st) =>
        st.id === selectedSubtask.id
          ? {
              ...st,
              description: subtaskDescription,
            }
          : st
      ),
    });
  };

  // Custom styles for the date input with more direct styling
  const dateInputStyle = {
    colorScheme: "dark",
    backgroundColor: "#353535",
    color: "white",
    border: "2px solid #4b5563",
    borderRadius: "4px",
    padding: "4px 8px",
    cursor: "pointer",
    outline: "none",
    width: "100%",
    height: "100%",
  };

  // Add this CSS class for the date picker wrapper
  const datePickerWrapperClass =
    "relative inline-block h-7 w-7 rounded overflow-hidden hover:bg-[#454545] transition-colors";

  // Add this CSS class for the date input itself
  const dateInputClass =
    "absolute inset-0 opacity-0 cursor-pointer z-10 focus:opacity-100 focus:z-20 focus:bg-[#353535] focus:border-2 focus:border-blue-500";

  return (
    <>
      <Sheet open={!!task} onOpenChange={() => onClose()}>
        <SheetContent
          side="right"
          style={{ width: "800px", maxWidth: "90vw" }}
          className="bg-[#1a1a1a] border-l border-[#353535] p-0 overflow-hidden"
        >
          <div className="flex flex-col h-full">
            {/* Header */}
            <SheetHeader className="py-2 px-4 flex items-center justify-between border-b border-[#353535]">
              <div className="sr-only">
                <SheetTitle>{task.title}</SheetTitle>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="text-neutral-200 border-neutral-700 hover:bg-neutral-800 hover:text-neutral-100 h-8"
                  onClick={() => {
                    if (!task) return;

                    // Get current timestamp
                    const now = new Date();
                    const newStatus = !task.completed
                      ? "completed"
                      : "not started";

                    // Determine user ID for the update - use a valid existing ID from the task
                    const userId = task.createdBy || task.assignee;

                    try {
                      // Create a clean and complete update object with all necessary fields
                      const updates: Partial<TaskDetailsType> = {
                        completed: !task.completed,
                        status: newStatus,
                        completedAt: !task.completed
                          ? now.toISOString()
                          : undefined,
                        // Include IDs to ensure proper handling
                        _id: task._id,
                        id: task.id,
                        // Make sure to use a valid user ID for updatedBy
                        updatedBy: userId || "current-user",
                        // Add a name for the updater
                        updatedByName: userId
                          ? formatAssigneeName(userId)
                          : "User",
                      };

                      console.log("Sending task update with payload:", updates);

                      // Use our adapter function to handle the update
                      onUpdate(task._id, updates);
                    } catch (error) {
                      console.error("Error updating task status:", error);
                    }
                  }}
                >
                  <Check className="h-4 w-4 mr-2" />
                  {task.completed ? "Mark incomplete" : "Mark complete"}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-red-400 hover:text-red-300 hover:bg-red-500/10 h-8"
                  onClick={() => {
                    if (confirm("Are you sure you want to delete this task?")) {
                      onDelete();
                      onClose();
                    }
                  }}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </Button>
              </div>
            </SheetHeader>

            <div className="flex-1 overflow-y-auto bg-[#121212]">
              {/* Task Title */}
              <div className="px-6 pt-6 pb-2">
                {isEditing ? (
                  <div className="flex items-center gap-2">
                    <Input
                      value={editedTitle}
                      onChange={(e) => setEditedTitle(e.target.value)}
                      className="bg-[#353535] border-0 text-2xl font-semibold text-white focus-visible:ring-1 focus-visible:ring-neutral-500"
                      autoFocus
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          handleTitleSave();
                        }
                        if (e.key === "Escape") {
                          e.preventDefault();
                          setEditedTitle(task.title);
                          setIsEditing(false);
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
                        setEditedTitle(task.title);
                        setIsEditing(false);
                      }}
                    >
                      Cancel
                    </Button>
                  </div>
                ) : (
                  <div
                    className="group cursor-pointer inline-block"
                    onClick={() => {
                      setEditedTitle(task.title); // Set current title when starting to edit
                      setIsEditing(true);
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
                      <Avatar className="h-6 w-6 bg-blue-600 text-white">
                        <AvatarFallback className="text-xs">
                          {getAssigneeInitials(task.assignee)}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-neutral-200">
                        {formatAssigneeName(task.assignee)}
                      </span>
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
                      <span className="text-neutral-200">
                        {task.dueDate
                          ? formatDate(task.dueDate)
                          : "No due date"}
                      </span>
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
                  <div className="flex items-center gap-2 bg-[#1a1a1a] px-2 py-1 rounded hover:bg-[#1a1a1a]">
                    {task.project?.color ? (
                      task.project.color.includes("[#") ? (
                        // For custom hex colors like bg-[#fd3939]
                        <span
                          className="w-2 h-2 rounded-full"
                          style={{
                            backgroundColor: getProjectColor(
                              task.project.color
                            ),
                          }}
                        />
                      ) : (
                        // For standard Tailwind classes like bg-purple-500
                        <span
                          className={`w-2 h-2 rounded-full ${task.project.color}`}
                        />
                      )
                    ) : (
                      // Default fallback
                      <span className="w-2 h-2 rounded-full bg-cyan-500" />
                    )}
                    <span className="text-sm text-neutral-200">
                      {task.project?.name || "Task management project"}
                    </span>
                    <Badge
                      variant="secondary"
                      className="bg-[#2a2a2a] text-neutral-200"
                    >
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
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-neutral-400 hover:text-neutral-300 hover:bg-neutral-800"
                  >
                    Add to projects
                  </Button>
                </div>

                {/* Fields */}
                <div className="space-y-2">
                  <label className="text-sm text-neutral-400">Fields</label>
                  <div className="space-y-2 bg-[#1a1a1a] rounded-lg overflow-hidden">
                    <div className="flex items-center justify-between px-3 py-2 hover:bg-[#1a1a1a]">
                      <div className="flex items-center gap-2">
                        <ChevronRight className="h-4 w-4 text-neutral-500" />
                        <span className="text-sm text-neutral-400">
                          Priority
                        </span>
                      </div>
                      <Badge
                        className={cn(
                          task.priority === "High"
                            ? "bg-red-500/20 text-red-300 hover:bg-red-500/30"
                            : task.priority === "Medium"
                            ? "bg-amber-500/20 text-amber-300 hover:bg-amber-500/30"
                            : "bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30"
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
                      <Badge
                        className={cn(
                          task.status === "completed"
                            ? "bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30"
                            : task.status === "in progress"
                            ? "bg-blue-500/20 text-blue-300 hover:bg-blue-500/30"
                            : "bg-gray-500/20 text-gray-300 hover:bg-gray-500/30"
                        )}
                      >
                        {task.status || "Not started"}
                      </Badge>
                    </div>
                  </div>
                </div>

                {/* Description */}
                <div className="space-y-2">
                  <label className="text-sm text-neutral-400">
                    Description
                  </label>
                  <Textarea
                    placeholder="What is this task about?"
                    className="bg-[#1a1a1a] border-0 resize-none min-h-[120px] text-neutral-200 text-base"
                    value={task.description || ""}
                    onChange={(e) =>
                      onUpdate(task._id, {
                        ...task,
                        description: e.target.value,
                      })
                    }
                  />
                </div>

                {/* Subtasks - New Design with DnD */}
                <div className="space-y-2">
                  <label className="text-sm text-neutral-400">Subtasks</label>
                  <div className="rounded-md overflow-hidden bg-[#1a1a1a] border border-[#333]">
                    {/* Subtasks List with DnD */}
                    <DragDropContext onDragEnd={handleSubtaskDragEnd}>
                      <Droppable droppableId="subtasks">
                        {(provided) => (
                          <div
                            {...provided.droppableProps}
                            ref={provided.innerRef}
                            className="subtasks-list"
                          >
                            {task.subtasks.map((subtask, index) => (
                              <Draggable
                                key={subtask.id}
                                draggableId={subtask.id}
                                index={index}
                                isDragDisabled={editingSubtaskId === subtask.id}
                              >
                                {(provided, snapshot) => (
                                  <div
                                    ref={provided.innerRef}
                                    {...provided.draggableProps}
                                    className={cn(
                                      "flex items-center justify-between py-2 px-3 border-b border-[#333] group",
                                      editingSubtaskId === subtask.id &&
                                        "bg-[#111827]",
                                      snapshot.isDragging &&
                                        "bg-[#2a2a2a] opacity-90"
                                    )}
                                  >
                                    {editingSubtaskId === subtask.id ? (
                                      <div className="flex-1 flex items-center gap-2">
                                        <Input
                                          autoFocus
                                          value={editedSubtaskTitle}
                                          onChange={(e) =>
                                            setEditedSubtaskTitle(
                                              e.target.value
                                            )
                                          }
                                          className="bg-transparent border-0 text-white h-8 focus-visible:ring-0 p-0"
                                          onKeyDown={(e) => {
                                            if (e.key === "Enter") {
                                              e.preventDefault();
                                              handleSaveSubtaskEdit();
                                            }
                                            if (e.key === "Escape") {
                                              e.preventDefault();
                                              setEditingSubtaskId(null);
                                            }
                                          }}
                                        />
                                        <div className="flex items-center gap-1">
                                          <Select
                                            value={
                                              editedSubtaskAssignee ||
                                              "UNASSIGNED"
                                            }
                                            onValueChange={(value) =>
                                              setEditedSubtaskAssignee(
                                                value === "UNASSIGNED"
                                                  ? null
                                                  : value
                                              )
                                            }
                                          >
                                            <SelectTrigger className="h-7 w-7 px-0 border-0 bg-transparent hover:bg-[#353535] hover:text-neutral-300">
                                              <User2
                                                className={cn(
                                                  "h-4 w-4",
                                                  editedSubtaskAssignee
                                                    ? "text-violet-500"
                                                    : "text-neutral-400"
                                                )}
                                              />
                                            </SelectTrigger>
                                            <SelectContent className="bg-[#353535] border-[#1a1a1a] text-white">
                                              {loadingMembers ? (
                                                <SelectItem
                                                  value="loading"
                                                  disabled
                                                >
                                                  Loading members...
                                                </SelectItem>
                                              ) : (
                                                <>
                                                  {projectMembers.map(
                                                    (member) => (
                                                      <SelectItem
                                                        key={member._id}
                                                        value={member._id}
                                                      >
                                                        {member.fullName ||
                                                          formatUsername(
                                                            member.email
                                                          )}
                                                      </SelectItem>
                                                    )
                                                  )}
                                                  <SelectItem value="UNASSIGNED">
                                                    Unassigned
                                                  </SelectItem>
                                                </>
                                              )}
                                            </SelectContent>
                                          </Select>

                                          {/* Updated date input styling */}
                                          <div
                                            className={datePickerWrapperClass}
                                          >
                                            <div className="flex items-center justify-center h-full w-full text-sm text-white">
                                              <Calendar className="h-4 w-4 text-neutral-400" />
                                            </div>
                                            <input
                                              type="date"
                                              value={editedSubtaskDueDate}
                                              onChange={(e) =>
                                                setEditedSubtaskDueDate(
                                                  e.target.value
                                                )
                                              }
                                              className={dateInputClass}
                                              style={dateInputStyle}
                                            />
                                          </div>

                                          <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-7 w-7 text-neutral-400 hover:text-neutral-300"
                                            onClick={() =>
                                              handleSaveSubtaskEdit()
                                            }
                                          >
                                            <Check className="h-3.5 w-3.5" />
                                          </Button>
                                          <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-7 w-7 text-neutral-400 hover:text-neutral-300"
                                            onClick={() =>
                                              setEditingSubtaskId(null)
                                            }
                                          >
                                            <X className="h-3.5 w-3.5" />
                                          </Button>
                                        </div>
                                      </div>
                                    ) : (
                                      <>
                                        <div className="flex items-center gap-2 flex-1">
                                          <div
                                            {...provided.dragHandleProps}
                                            className="cursor-grab active:cursor-grabbing"
                                          >
                                            <GripVertical className="h-4 w-4 text-neutral-500 hover:text-neutral-400" />
                                          </div>
                                          <button
                                            className="flex items-center justify-center w-5 h-5 rounded-full border border-neutral-600 text-neutral-400 hover:border-neutral-400 hover:text-neutral-300"
                                            onClick={() =>
                                              handleToggleSubtask(subtask.id)
                                            }
                                          >
                                            {subtask.completed && (
                                              <Check className="h-3 w-3" />
                                            )}
                                          </button>
                                          <span
                                            className={cn(
                                              "text-sm",
                                              subtask.completed
                                                ? "text-neutral-500 line-through"
                                                : "text-neutral-200"
                                            )}
                                          >
                                            {subtask.title}
                                          </span>
                                          {subtask.assignee && (
                                            <div className="h-5 w-5 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs">
                                              {getInitials(
                                                formatAssigneeName(
                                                  subtask.assignee
                                                )
                                              )}
                                            </div>
                                          )}
                                          {subtask.dueDate && (
                                            <span className="text-xs text-neutral-400">
                                              {formatDate(subtask.dueDate)}
                                            </span>
                                          )}
                                        </div>
                                        <div className="flex items-center">
                                          <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-7 w-7 opacity-0 group-hover:opacity-100 text-neutral-400 hover:text-neutral-300"
                                            onClick={() =>
                                              handleOpenSubtaskDetails(subtask)
                                            }
                                          >
                                            <ArrowRight className="h-3.5 w-3.5" />
                                          </Button>
                                          <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-7 w-7 opacity-0 group-hover:opacity-100 text-neutral-400 hover:text-neutral-300"
                                            onClick={() =>
                                              handleEditSubtask(subtask.id)
                                            }
                                          >
                                            <Pencil className="h-3.5 w-3.5" />
                                          </Button>
                                          <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-7 w-7 opacity-0 group-hover:opacity-100 text-neutral-400 hover:text-neutral-300"
                                            onClick={() =>
                                              handleDeleteSubtask(subtask.id)
                                            }
                                          >
                                            <X className="h-3.5 w-3.5" />
                                          </Button>
                                        </div>
                                      </>
                                    )}
                                  </div>
                                )}
                              </Draggable>
                            ))}
                            {provided.placeholder}
                          </div>
                        )}
                      </Droppable>
                    </DragDropContext>

                    {/* Add Subtask Input (Inline) */}
                    {isAddingSubtask && (
                      <div className="flex items-center justify-between py-2 px-3 bg-[#111827]">
                        <div className="flex-1 flex items-center gap-2">
                          <div className="w-4 opacity-0">
                            <GripVertical className="h-4 w-4" />
                          </div>
                          <button className="flex items-center justify-center w-5 h-5 rounded-full border border-neutral-600 text-neutral-400"></button>
                          <Input
                            autoFocus
                            value={newSubtask}
                            onChange={(e) => setNewSubtask(e.target.value)}
                            placeholder="Add a subtask"
                            className="bg-transparent border-0 text-white h-8 focus-visible:ring-0 p-0"
                            onKeyDown={(e) => {
                              if (e.key === "Enter") handleAddSubtask();
                              if (e.key === "Escape") setIsAddingSubtask(false);
                            }}
                          />
                        </div>
                        <div className="flex items-center gap-1">
                          <Select
                            value={newSubtaskAssignee || "UNASSIGNED"}
                            onValueChange={(value) =>
                              setNewSubtaskAssignee(
                                value === "UNASSIGNED" ? null : value
                              )
                            }
                          >
                            <SelectTrigger className="h-7 w-7 px-0 border-0 bg-transparent hover:bg-[#2d3748] hover:text-neutral-300">
                              <User2
                                className={cn(
                                  "h-4 w-4",
                                  newSubtaskAssignee
                                    ? "text-violet-500"
                                    : "text-neutral-400"
                                )}
                              />
                            </SelectTrigger>
                            <SelectContent className="bg-[#353535] border-[#1a1a1a] text-white">
                              {loadingMembers ? (
                                <SelectItem value="loading" disabled>
                                  Loading members...
                                </SelectItem>
                              ) : (
                                <>
                                  {projectMembers.map((member) => (
                                    <SelectItem
                                      key={member._id}
                                      value={member._id}
                                    >
                                      {member.fullName ||
                                        formatUsername(member.email)}
                                    </SelectItem>
                                  ))}
                                  <SelectItem value="UNASSIGNED">
                                    Unassigned
                                  </SelectItem>
                                </>
                              )}
                            </SelectContent>
                          </Select>

                          {/* Updated date input styling */}
                          <div className={datePickerWrapperClass}>
                            <div className="flex items-center justify-center h-full w-full text-sm text-white">
                              <Calendar className="h-4 w-4 text-neutral-400" />
                            </div>
                            <input
                              type="date"
                              value={newSubtaskDueDate}
                              onChange={(e) =>
                                setNewSubtaskDueDate(e.target.value)
                              }
                              className={dateInputClass}
                              style={dateInputStyle}
                            />
                          </div>

                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-neutral-400 hover:text-neutral-300"
                            onClick={() => handleAddSubtask()}
                          >
                            <Check className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-neutral-400 hover:text-neutral-300"
                            onClick={() => setIsAddingSubtask(false)}
                          >
                            <X className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                    )}

                    {/* Empty State */}
                    {task.subtasks.length === 0 && !isAddingSubtask && (
                      <div className="py-3 px-4 text-sm text-neutral-500 italic">
                        No subtasks added yet
                      </div>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-neutral-400 hover:text-neutral-300 border-neutral-700 hover:bg-neutral-800"
                      onClick={() => setIsAddingSubtask(true)}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add subtask
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-neutral-400 hover:text-neutral-300 border-neutral-700 hover:bg-neutral-800"
                    >
                      <Sparkles className="h-4 w-4 mr-2" />
                      Draft subtasks
                    </Button>
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
                        ? "text-white border-b-2 border-[#353535] hover:bg-[#353535] hover:text-white"
                        : "text-neutral-400 hover:text-neutral-300 hover:bg-neutral-800"
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
                        ? "text-white border-b-2 border-[#353535] hover:bg-[#353535] hover:text-white"
                        : "text-neutral-400 hover:text-neutral-300 hover:bg-neutral-800"
                    )}
                    onClick={() => setActiveTab("activity")}
                  >
                    All activity
                  </Button>
                </div>

                <div className="p-4 space-y-4">
                  {task.activities
                    .filter(
                      (activity) =>
                        activeTab === "activity" ||
                        activity.type === "commented"
                    )
                    .map((activity, index) => (
                      <div key={index} className="flex items-start gap-3 group">
                        <Avatar className="h-6 w-6 bg-blue-600">
                          <AvatarFallback className="text-xs">
                            {typeof activity.user === "string"
                              ? getAssigneeInitials(activity.user)
                              : getInitials(
                                  activity.user.name ||
                                    activity.user.userId ||
                                    "?"
                                )}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-neutral-200">
                              {typeof activity.user === "string"
                                ? formatAssigneeName(activity.user)
                                : activity.user.name
                                ? activity.user.name.includes("@")
                                  ? formatUsername(activity.user.name)
                                  : activity.user.name
                                : formatAssigneeName(activity.user.userId)}
                            </span>
                            <span className="text-xs text-neutral-500">
                              {activity.type === "commented"
                                ? "commented"
                                : activity.type === "created"
                                ? "created this task"
                                : activity.type === "completed"
                                ? "completed this task"
                                : "updated this task"}
                            </span>
                            <span className="text-xs text-neutral-500">
                              {activity.timestamp}
                            </span>
                          </div>
                          {activity.content && (
                            <p className="mt-1 text-sm text-neutral-300">
                              {activity.content}
                            </p>
                          )}
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
                    <Avatar className="h-8 w-8 bg-blue-600">
                      <AvatarFallback className="text-sm">
                        {getInitials(formatUsername(task.createdBy || "User"))}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <Textarea
                        placeholder="Add a comment..."
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        className="bg-[#353535] border-0 resize-none min-h-[100px] text-white rounded-lg placeholder:text-neutral-500"
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
            <div className="p-4 border-t border-[#353535] flex items-center justify-between bg-[#121212]">
              <div className="flex items-center gap-3">
                <span className="text-sm text-neutral-400">Collaborators</span>
                <div className="flex -space-x-2">
                  <Avatar className="h-6 w-6 border-2 border-[#1E201E] bg-blue-600">
                    <AvatarFallback className="text-xs">Ka</AvatarFallback>
                  </Avatar>
                  <Avatar className="h-6 w-6 border-2 border-[#1E201E] bg-neutral-700">
                    <AvatarFallback className="text-xs">
                      <Plus className="h-3 w-3" />
                    </AvatarFallback>
                  </Avatar>
                </div>
              </div>
              <Button
                variant="ghost"
                className="text-neutral-400 hover:text-neutral-300 hover:bg-neutral-800"
              >
                <Bell className="h-4 w-4 mr-2" />
                Leave task
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* Subtask Details Sheet */}
      <Sheet
        open={!!selectedSubtask}
        onOpenChange={() => setSelectedSubtask(null)}
      >
        <SheetContent
          side="right"
          style={{ width: "800px", maxWidth: "90vw" }}
          className="bg-[#1a1a1a] border-l border-[#353535] p-0 overflow-hidden"
        >
          {selectedSubtask && (
            <div className="flex flex-col h-full">
              {/* Header */}
              <SheetHeader className="py-2 px-4 flex items-center justify-between border-b border-[#353535]">
                <div className="flex items-center">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-neutral-400 hover:text-neutral-300 hover:bg-neutral-800 mr-2"
                    onClick={() => setSelectedSubtask(null)}
                  >
                    <ChevronLeft className="h-4 w-4 mr-2" />
                    Back
                  </Button>
                  <SheetTitle className="sr-only">
                    {selectedSubtask.title}
                  </SheetTitle>
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-neutral-200 border-neutral-700 hover:bg-neutral-800 hover:text-neutral-100 h-8"
                    onClick={() => {
                      // Update the selected subtask's completed status
                      const updatedSubtasks = task.subtasks.map((st) =>
                        st.id === selectedSubtask.id
                          ? { ...st, completed: !selectedSubtask.completed }
                          : st
                      );

                      // Check if all subtasks would be completed after this update
                      const allSubtasksCompleted = updatedSubtasks.every(
                        (st) => st.completed
                      );

                      // Get current timestamp for completedAt if all subtasks are completed
                      const now = new Date();

                      // Update the task with the new subtasks array and possibly update the task status
                      onUpdate(task._id, {
                        ...task,
                        subtasks: updatedSubtasks,
                        // If all subtasks are completed, mark the parent task as completed too
                        status: allSubtasksCompleted
                          ? "completed"
                          : task.status,
                        // If all subtasks are completed, set completedAt to now
                        completedAt: allSubtasksCompleted
                          ? now.toISOString()
                          : task.completedAt,
                      });

                      setSelectedSubtask({
                        ...selectedSubtask,
                        completed: !selectedSubtask.completed,
                      });
                    }}
                  >
                    <Check className="h-4 w-4 mr-2" />
                    {selectedSubtask.completed
                      ? "Mark incomplete"
                      : "Mark complete"}
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
                {/* Breadcrumb */}
                <div className="px-6 pt-4 pb-2">
                  <div className="flex items-center text-sm text-neutral-400">
                    <span>
                      {task.project?.name || "Task management project"}
                    </span>
                    <ChevronRight className="h-4 w-4 mx-1" />
                    <span className="text-neutral-300">{task.title}</span>
                  </div>
                </div>

                {/* Subtask Title */}
                <div className="px-6 pt-2 pb-4">
                  <h2 className="text-2xl font-semibold text-white">
                    {selectedSubtask.title}
                  </h2>
                </div>

                <div className="px-6 space-y-6">
                  {/* Assignee */}
                  <div className="space-y-2">
                    <label className="text-sm text-neutral-400">Assignee</label>
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-2">
                        <Avatar className="h-6 w-6 bg-blue-600">
                          <AvatarFallback className="text-xs">
                            {getAssigneeInitials(selectedSubtask.assignee)}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-neutral-200">
                          {formatAssigneeName(selectedSubtask.assignee)}
                        </span>
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
                        <span className="text-neutral-200">
                          {selectedSubtask.dueDate
                            ? formatDate(selectedSubtask.dueDate)
                            : "Mar 6"}
                        </span>
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

                  {/* Dependencies */}
                  <div className="space-y-2">
                    <label className="text-sm text-neutral-400">
                      Dependencies
                    </label>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-neutral-400 hover:text-neutral-300 hover:bg-neutral-800"
                    >
                      Add dependencies
                    </Button>
                  </div>

                  <div className="space-y-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-blue-400 hover:text-blue-300 hover:bg-neutral-800 px-0"
                    >
                      Show inherited fields
                    </Button>
                  </div>

                  {/* Description */}
                  <div className="space-y-2">
                    <label className="text-sm text-neutral-400">
                      Description
                    </label>
                    <Textarea
                      placeholder="What is this task about?"
                      className="bg-[#353535] border-0 resize-none min-h-[120px] text-neutral-200 text-base"
                      value={subtaskDescription}
                      onChange={(e) => {
                        setSubtaskDescription(e.target.value);
                        // Auto-save after a short delay
                        setTimeout(() => {
                          handleUpdateSubtaskDetails();
                        }, 500);
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="p-4 border-t border-[#353535] flex items-center justify-between bg-[#121212]">
                <div className="flex items-center gap-3">
                  <span className="text-sm text-neutral-400">
                    Collaborators
                  </span>
                  <div className="flex -space-x-2">
                    <Avatar className="h-6 w-6 border-2 border-[#121212] bg-blue-600">
                      <AvatarFallback className="text-xs">
                        {task.createdBy
                          ? getAssigneeInitials(task.createdBy)
                          : getInitials("User")}
                      </AvatarFallback>
                    </Avatar>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 rounded-full bg-neutral-700 border-2 border-[#121212] text-white"
                    >
                      <Plus className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  className="text-neutral-400 hover:text-neutral-300 hover:bg-neutral-800"
                >
                  <Bell className="h-4 w-4 mr-2" />
                  Leave task
                </Button>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </>
  );
}
