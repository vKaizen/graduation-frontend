"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { createGoal, updateGoal, fetchUsers, fetchGoals } from "@/api-service";
import { Goal, CreateGoalDto, User } from "@/types";
import { useToast } from "@/components/ui/use-toast";

interface GoalFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  goal?: Goal; // If provided, we're editing; otherwise, we're creating
  defaultIsPrivate?: boolean; // Default value for isPrivate when creating new goals
}

export const GoalFormModal = ({
  isOpen,
  onClose,
  onSuccess,
  goal,
  defaultIsPrivate = true, // Default to private for backward compatibility
}: GoalFormModalProps) => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [progress, setProgress] = useState(0);
  const [parentGoalId, setParentGoalId] = useState<string | undefined>(
    undefined
  );
  const [ownerId, setOwnerId] = useState<string>("");
  const [workspaceId, setWorkspaceId] = useState<string | undefined>(undefined);
  const [isPrivate, setIsPrivate] = useState(true); // Add state for isPrivate

  const [users, setUsers] = useState<User[]>([]);
  const [parentGoals, setParentGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  // Fetch users and potential parent goals
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [usersData, goalsData] = await Promise.all([
          fetchUsers(),
          fetchGoals(),
        ]);

        setUsers(usersData);

        // Filter out the current goal (if editing) and its descendants from potential parents
        if (goal) {
          const filteredGoals = goalsData.filter(
            (g: Goal) =>
              // Exclude self and descendants
              g._id !== goal._id && !isDescendant(g, goal._id)
          );
          setParentGoals(filteredGoals);
        } else {
          setParentGoals(goalsData);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
        toast({
          title: "Error",
          description: "Failed to load users or goals",
          variant: "destructive",
        });
      }
    };

    if (isOpen) {
      fetchData();
    }
  }, [isOpen, goal, toast]);

  // Check if a goal is a descendant of the goal being edited
  const isDescendant = (potentialParent: Goal, goalId: string): boolean => {
    if (!potentialParent.children || potentialParent.children.length === 0) {
      return false;
    }

    return potentialParent.children.some(
      (child) => child._id === goalId || isDescendant(child, goalId)
    );
  };

  // Initialize form when goal changes or modal opens
  useEffect(() => {
    if (goal) {
      setTitle(goal.title || "");
      setDescription(goal.description || "");
      setProgress(goal.progress || 0);
      setParentGoalId(goal.parentGoalId);
      setOwnerId(goal.ownerId || "");
      setWorkspaceId(goal.workspaceId);
      setIsPrivate(goal.isPrivate !== undefined ? goal.isPrivate : true);
    } else {
      // Default values for new goal
      setTitle("");
      setDescription("");
      setProgress(0);
      setParentGoalId(undefined);
      setOwnerId(""); // Should be set to current user ID
      setWorkspaceId(undefined);
      setIsPrivate(defaultIsPrivate); // Use the provided default or true
    }
  }, [goal, isOpen, defaultIsPrivate]);

  const handleSubmit = async () => {
    try {
      setLoading(true);

      if (!title.trim()) {
        toast({
          title: "Error",
          description: "Title is required",
          variant: "destructive",
        });
        return;
      }

      if (!ownerId) {
        toast({
          title: "Error",
          description: "Owner is required",
          variant: "destructive",
        });
        return;
      }

      if (goal) {
        // Editing existing goal
        const updateData = {
          title,
          description,
          ownerId,
          parentGoalId,
          workspaceId,
          isPrivate, // Include isPrivate in updates
        };

        await updateGoal(goal._id, updateData);
        toast({
          title: "Success",
          description: "Goal updated successfully",
        });
      } else {
        // Creating new goal
        const createData: CreateGoalDto = {
          title,
          description,
          ownerId,
          parentGoalId,
          workspaceId,
          isPrivate, // Include isPrivate when creating
        };

        await createGoal(createData);
        toast({
          title: "Success",
          description: "Goal created successfully",
        });
      }

      onSuccess();
      onClose();
    } catch (error) {
      console.error("Error submitting goal:", error);
      toast({
        title: "Error",
        description: goal
          ? "Failed to update goal. Please try again."
          : "Failed to create goal. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="bg-[#1a1a1a] border-[#353535] text-white sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-white">
            {goal ? "Edit Goal" : "Create New Goal"}
          </DialogTitle>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="bg-[#252525] border-[#353535]"
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="bg-[#252525] border-[#353535] min-h-20"
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="progress">Progress ({progress}%)</Label>
            <Slider
              id="progress"
              value={[progress]}
              min={0}
              max={100}
              step={1}
              onValueChange={(values: number[]) => setProgress(values[0])}
              className="py-4"
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="visibility">Visibility</Label>
            <Select
              value={isPrivate ? "private" : "workspace"}
              onValueChange={(value) => setIsPrivate(value === "private")}
            >
              <SelectTrigger className="bg-[#252525] border-[#353535]">
                <SelectValue placeholder="Select visibility" />
              </SelectTrigger>
              <SelectContent className="bg-[#1a1a1a] border-[#353535] text-white">
                <SelectItem value="private">Private Goal</SelectItem>
                <SelectItem value="workspace">Workspace Goal</SelectItem>
              </SelectContent>
            </Select>
            <div className="text-xs text-gray-400">
              {isPrivate
                ? "Private goals are only visible to you and selected members"
                : "Workspace goals are visible to all workspace members and will appear on the strategy map"}
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="parent">Parent Goal (Optional)</Label>
            <Select
              value={parentGoalId || "none"}
              onValueChange={(value) =>
                setParentGoalId(value === "none" ? undefined : value)
              }
            >
              <SelectTrigger className="bg-[#252525] border-[#353535]">
                <SelectValue placeholder="No parent" />
              </SelectTrigger>
              <SelectContent className="bg-[#1a1a1a] border-[#353535] text-white">
                <SelectItem value="none">No parent</SelectItem>
                {parentGoals.map((parentGoal) => (
                  <SelectItem key={parentGoal._id} value={parentGoal._id}>
                    {parentGoal.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="owner">Owner</Label>
            <Select
              value={ownerId}
              onValueChange={(value) => setOwnerId(value)}
            >
              <SelectTrigger className="bg-[#252525] border-[#353535]">
                <SelectValue placeholder="Select owner" />
              </SelectTrigger>
              <SelectContent className="bg-[#1a1a1a] border-[#353535] text-white">
                {users.map((user) => (
                  <SelectItem key={user._id} value={user._id}>
                    {user.fullName || user.email}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter className="flex justify-between">
          <Button
            variant="outline"
            onClick={onClose}
            className="bg-transparent hover:bg-[#252525] text-white"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={loading}
            className="bg-[#4573D2] text-white hover:bg-[#3A62B3]"
          >
            {loading ? "Saving..." : goal ? "Update Goal" : "Create Goal"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
