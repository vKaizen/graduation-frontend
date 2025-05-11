"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import {
  Goal,
  CreateGoalDto,
  UpdateGoalDto,
  User,
  Project,
  Task,
} from "@/types";
import {
  createGoal,
  updateGoal,
  fetchUsers,
  fetchProjects,
  fetchTasksByWorkspace,
} from "@/api-service";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Switch } from "@/components/ui/switch";
import { CalendarIcon, Paperclip, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { Checkbox } from "@/components/ui/checkbox";

const CURRENT_YEAR = new Date().getFullYear();
const YEARS = Array.from({ length: 5 }, (_, i) => CURRENT_YEAR + i);

interface GoalFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (goal: Goal) => void;
  currentUserId: string;
  workspaceId?: string;
  existingGoal?: Goal;
  parentGoal?: Goal;
}

export const GoalForm = ({
  isOpen,
  onClose,
  onSuccess,
  currentUserId,
  workspaceId,
  existingGoal,
  parentGoal,
}: GoalFormProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [selectedLinkedTasks, setSelectedLinkedTasks] = useState<string[]>([]);
  const [selectedProjects, setSelectedProjects] = useState<string[]>([]);
  const [customTimeframe, setCustomTimeframe] = useState(false);

  const form = useForm<CreateGoalDto | UpdateGoalDto>({
    defaultValues: {
      title: existingGoal?.title || "",
      description: existingGoal?.description || "",
      ownerId: existingGoal?.ownerId || currentUserId,
      status: existingGoal?.status || "no-status",
      progress: existingGoal?.progress || 0,
      isPrivate: existingGoal?.isPrivate || false,
      timeframe: existingGoal?.timeframe || "Q1",
      timeframeYear: existingGoal?.timeframeYear || CURRENT_YEAR,
      parentGoalId: parentGoal?._id || existingGoal?.parentGoalId,
      workspaceId: workspaceId || existingGoal?.workspaceId,
    },
  });

  // Load users and projects
  useEffect(() => {
    const loadData = async () => {
      try {
        const [usersData, projectsData] = await Promise.all([
          fetchUsers(),
          fetchProjects(),
        ]);

        setUsers(usersData);
        setProjects(projectsData);

        // If we have a workspace, load tasks for that workspace
        if (workspaceId) {
          const tasksData = await fetchTasksByWorkspace(workspaceId);
          setTasks(tasksData);
        }

        // Set initial values for linked tasks and projects
        if (existingGoal) {
          if (existingGoal.linkedTasks) {
            setSelectedLinkedTasks(existingGoal.linkedTasks);
          }

          if (existingGoal.projects) {
            setSelectedProjects(existingGoal.projects);
          }

          // Check if using custom timeframe
          setCustomTimeframe(existingGoal.timeframe === "custom");
        }
      } catch (error) {
        console.error("Error loading form data:", error);
      }
    };

    if (isOpen) {
      loadData();
    }
  }, [isOpen, workspaceId, existingGoal]);

  // Handle custom date range visibility
  useEffect(() => {
    const timeframe = form.watch("timeframe");
    setCustomTimeframe(timeframe === "custom");
  }, [form.watch("timeframe")]);

  const onSubmit = async (data: CreateGoalDto | UpdateGoalDto) => {
    try {
      setIsLoading(true);

      // Add linked tasks and projects to the data
      data.linkedTasks = selectedLinkedTasks;
      data.projects = selectedProjects;

      let goal: Goal;

      if (existingGoal) {
        // Update existing goal
        goal = await updateGoal(existingGoal._id, data as UpdateGoalDto);
      } else {
        // Create new goal
        goal = await createGoal(data as CreateGoalDto);
      }

      onSuccess(goal);
      onClose();
    } catch (error) {
      console.error("Error saving goal:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle task selection
  const toggleTask = (taskId: string) => {
    setSelectedLinkedTasks((prev) =>
      prev.includes(taskId)
        ? prev.filter((id) => id !== taskId)
        : [...prev, taskId]
    );
  };

  // Handle project selection
  const toggleProject = (projectId: string) => {
    setSelectedProjects((prev) =>
      prev.includes(projectId)
        ? prev.filter((id) => id !== projectId)
        : [...prev, projectId]
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[600px] bg-[#1a1a1a] text-white">
        <DialogHeader>
          <DialogTitle>
            {existingGoal ? "Edit Goal" : "Create New Goal"}
          </DialogTitle>
          <DialogDescription className="text-gray-400">
            {existingGoal
              ? "Update your goal details"
              : "Define a new goal to track progress"}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              rules={{ required: "Title is required" }}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g., Increase customer satisfaction"
                      className="bg-[#252525] border-[#353535]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="What is this goal about?"
                      className="bg-[#252525] border-[#353535] min-h-[100px]"
                      {...field}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="ownerId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Owner</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger className="bg-[#252525] border-[#353535]">
                          <SelectValue placeholder="Select owner" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="bg-[#252525] border-[#353535]">
                        {users.map((user) => (
                          <SelectItem key={user._id} value={user._id}>
                            {user.fullName || user.email}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger className="bg-[#252525] border-[#353535]">
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="bg-[#252525] border-[#353535]">
                        <SelectItem value="no-status">No status</SelectItem>
                        <SelectItem value="on-track">On track</SelectItem>
                        <SelectItem value="at-risk">At risk</SelectItem>
                        <SelectItem value="off-track">Off track</SelectItem>
                        <SelectItem value="achieved">Achieved</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="timeframe"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Time period</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger className="bg-[#252525] border-[#353535]">
                          <SelectValue placeholder="Select time period" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="bg-[#252525] border-[#353535]">
                        <SelectItem value="Q1">Q1</SelectItem>
                        <SelectItem value="Q2">Q2</SelectItem>
                        <SelectItem value="Q3">Q3</SelectItem>
                        <SelectItem value="Q4">Q4</SelectItem>
                        <SelectItem value="H1">H1</SelectItem>
                        <SelectItem value="H2">H2</SelectItem>
                        <SelectItem value="FY">FY</SelectItem>
                        <SelectItem value="custom">Custom</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormItem>
                )}
              />

              {!customTimeframe && (
                <FormField
                  control={form.control}
                  name="timeframeYear"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Year</FormLabel>
                      <Select
                        onValueChange={(value) => field.onChange(Number(value))}
                        defaultValue={field.value?.toString()}
                      >
                        <FormControl>
                          <SelectTrigger className="bg-[#252525] border-[#353535]">
                            <SelectValue placeholder="Select year" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="bg-[#252525] border-[#353535]">
                          {YEARS.map((year) => (
                            <SelectItem key={year} value={year.toString()}>
                              {year}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormItem>
                  )}
                />
              )}
            </div>

            {customTimeframe && (
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="startDate"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Start Date</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant="outline"
                              className="bg-[#252525] border-[#353535] pl-3 text-left font-normal flex justify-between"
                            >
                              {field.value ? (
                                format(new Date(field.value), "PP")
                              ) : (
                                <span className="text-gray-400">
                                  Pick a date
                                </span>
                              )}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0 bg-[#252525] border-[#353535]">
                          <Calendar
                            mode="single"
                            selected={
                              field.value ? new Date(field.value) : undefined
                            }
                            onSelect={(date) =>
                              field.onChange(date?.toISOString())
                            }
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="dueDate"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Due Date</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant="outline"
                              className="bg-[#252525] border-[#353535] pl-3 text-left font-normal flex justify-between"
                            >
                              {field.value ? (
                                format(new Date(field.value), "PP")
                              ) : (
                                <span className="text-gray-400">
                                  Pick a date
                                </span>
                              )}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0 bg-[#252525] border-[#353535]">
                          <Calendar
                            mode="single"
                            selected={
                              field.value ? new Date(field.value) : undefined
                            }
                            onSelect={(date) =>
                              field.onChange(date?.toISOString())
                            }
                            initialFocus
                            disabled={(date) => {
                              const startDate = form.watch("startDate");
                              return startDate
                                ? date < new Date(startDate)
                                : false;
                            }}
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}

            <FormField
              control={form.control}
              name="progress"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Progress ({field.value}%)</FormLabel>
                  <FormControl>
                    <Input
                      type="range"
                      min="0"
                      max="100"
                      step="5"
                      className="bg-[#252525] border-[#353535]"
                      {...field}
                      onChange={(e) => field.onChange(Number(e.target.value))}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="isPrivate"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between p-3 border border-[#353535] rounded-md">
                  <div className="space-y-0">
                    <FormLabel>Private Goal</FormLabel>
                    <FormDescription className="text-gray-400">
                      Only you and workspace admins can see this goal
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            {/* Projects Selection */}
            <div>
              <h3 className="mb-2 text-sm font-medium">Related Projects</h3>
              <div className="border border-[#353535] rounded-md p-3 max-h-[200px] overflow-y-auto">
                {projects.length === 0 ? (
                  <p className="text-gray-400 text-sm">No projects available</p>
                ) : (
                  <div className="space-y-2">
                    {projects.map((project) => (
                      <div
                        key={project._id}
                        className="flex items-center space-x-2"
                      >
                        <Checkbox
                          id={`project-${project._id}`}
                          checked={selectedProjects.includes(project._id)}
                          onCheckedChange={() => toggleProject(project._id)}
                        />
                        <label
                          htmlFor={`project-${project._id}`}
                          className="text-sm cursor-pointer"
                        >
                          {project.name}
                        </label>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Tasks Selection */}
            <div>
              <h3 className="mb-2 text-sm font-medium">Linked Tasks</h3>
              <div className="border border-[#353535] rounded-md p-3 max-h-[200px] overflow-y-auto">
                {tasks.length === 0 ? (
                  <p className="text-gray-400 text-sm">No tasks available</p>
                ) : (
                  <div className="space-y-2">
                    {tasks.map((task) => (
                      <div
                        key={task._id}
                        className="flex items-center space-x-2"
                      >
                        <Checkbox
                          id={`task-${task._id}`}
                          checked={selectedLinkedTasks.includes(task._id)}
                          onCheckedChange={() => toggleTask(task._id)}
                        />
                        <label
                          htmlFor={`task-${task._id}`}
                          className="text-sm cursor-pointer flex-1 truncate"
                        >
                          {task.title}
                        </label>
                        {selectedLinkedTasks.includes(task._id) && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 rounded-full"
                            onClick={() => toggleTask(task._id)}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                className="bg-[#252525] border-[#353535] hover:bg-[#353535]"
                onClick={onClose}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="bg-[#4573D2] hover:bg-[#3761B6]"
                disabled={isLoading}
              >
                {isLoading
                  ? "Saving..."
                  : existingGoal
                  ? "Update Goal"
                  : "Create Goal"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
