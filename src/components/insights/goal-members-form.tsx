"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Lock, Users, Check } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { User, GoalTimeframe } from "@/types";
import { GoalCreationLayout } from "./GoalCreationLayout";

interface GoalMembersFormProps {
  onBack: () => void;
  onSubmit: () => void;
  isLoading: boolean;
  error: string;
  currentUser: User | null;
  workspaceUsers: User[];
  selectedMembers: string[];
  setSelectedMembers: (members: string[]) => void;
  isPrivate: boolean;
  setIsPrivate: (isPrivate: boolean) => void;
  goalTitle: string;
  selectedTimeframe: GoalTimeframe;
  selectedTimeframeYear: number;
  progressResource?: "projects" | "tasks" | "none";
  isWorkspaceGoal?: boolean;
}

export function GoalMembersForm({
  onBack,
  onSubmit,
  isLoading,
  error,
  currentUser,
  workspaceUsers,
  selectedMembers,
  setSelectedMembers,
  isPrivate,
  setIsPrivate,
  goalTitle,
  selectedTimeframe,
  selectedTimeframeYear,
  progressResource = "none",
  isWorkspaceGoal = false,
}: GoalMembersFormProps) {
  const [searchTerm, setSearchTerm] = useState("");

  // Debug when props change
  useEffect(() => {
    console.log("GoalMembersForm updated - selectedMembers:", selectedMembers);
  }, [selectedMembers]);

  // Log the props for debugging
  console.log("GoalMembersForm props:", {
    currentUser: currentUser?._id,
    workspaceUsersCount: workspaceUsers?.length || 0,
    selectedMembers,
    isPrivate,
    progressResource,
    isWorkspaceGoal,
  });

  // Filter users based on search term and exclude current user
  const filteredUsers = workspaceUsers.filter(
    (user) =>
      // Exclude current user
      user._id !== currentUser?._id &&
      // Match search term against name or email
      (user.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  console.log("Filtered users for display:", filteredUsers.length);

  const toggleMember = (userId: string) => {
    console.log(`Toggling member ${userId}`, {
      wasSelected: selectedMembers.includes(userId),
      currentMembers: [...selectedMembers], // Make a copy for logging
    });

    // Create a copy of the current member list
    const updatedMembers = [...selectedMembers];

    // Check if the user is already in the members array
    const existingIndex = updatedMembers.indexOf(userId);

    if (existingIndex >= 0) {
      // User is already in the array, so remove them
      updatedMembers.splice(existingIndex, 1);
      console.log(`Removed member ${userId}, new list:`, updatedMembers);
    } else {
      // User is not in the array, so add them
      updatedMembers.push(userId);
      console.log(`Added member ${userId}, new list:`, updatedMembers);
    }

    // Update the parent component's state with the new array
    setSelectedMembers([...updatedMembers]);
  };

  const getInitials = (name?: string) => {
    if (!name) return "U";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();
  };

  return (
    <GoalCreationLayout
      title="Choose members"
      onBack={onBack}
      goalTitle={goalTitle}
      goalDescription=""
      selectedTimeframe={selectedTimeframe}
      selectedTimeframeYear={selectedTimeframeYear}
      selectedProjects={[]}
      projects={[]}
      currentUser={currentUser}
      isPrivate={isPrivate}
      selectedMembers={selectedMembers}
      workspaceUsers={workspaceUsers}
      progressResource={progressResource}
    >
      {/* Owner section */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-white">Owner</label>
        <div className="flex items-center space-x-2 p-2 bg-[#252525] border border-[#353535] rounded-md">
          <Avatar className="h-8 w-8 bg-[#4573D2]">
            <AvatarFallback>
              {getInitials(currentUser?.fullName)}
            </AvatarFallback>
          </Avatar>
          <span className="text-white">
            {currentUser?.fullName || currentUser?.email || "Current user"}
          </span>
        </div>
      </div>

      {/* Members section */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-white">Members</label>
        <div className="relative">
          <Input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by name or email"
            className="bg-[#252525] border-[#353535] text-white pl-10"
          />
          <Users className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
        </div>

        <div className="max-h-60 overflow-y-auto space-y-2 mt-2">
          {filteredUsers.length > 0 ? (
            filteredUsers.map((user) => (
              <div
                key={user._id}
                className={`flex items-center justify-between p-2 rounded-md cursor-pointer ${
                  selectedMembers.includes(user._id)
                    ? "bg-[#353535]"
                    : "bg-[#252525] hover:bg-[#303030]"
                }`}
                onClick={() => toggleMember(user._id)}
              >
                <div className="flex items-center space-x-2">
                  <Avatar className="h-8 w-8 bg-[#4573D2]">
                    <AvatarFallback>
                      {getInitials(user.fullName)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="text-white">{user.fullName || "User"}</div>
                    <div className="text-gray-400 text-xs">{user.email}</div>
                  </div>
                </div>
                {selectedMembers.includes(user._id) && (
                  <Check className="h-4 w-4 text-white" />
                )}
              </div>
            ))
          ) : (
            <div className="text-gray-400 text-center py-4">
              {searchTerm
                ? "No users found matching your search"
                : "No other users in this workspace"}
            </div>
          )}
        </div>
      </div>

      {/* Privacy section */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-white">Privacy</label>
        {isWorkspaceGoal ? (
          <div className="p-2 bg-[#252525] border border-[#353535] rounded-md text-white flex items-center">
            <Users className="h-4 w-4 mr-2" />
            <span>Workspace Goal (visible to all members)</span>
          </div>
        ) : (
          <>
            <Select
              value={isPrivate ? "private" : "workspace"}
              onValueChange={(value) => setIsPrivate(value === "private")}
            >
              <SelectTrigger className="w-full bg-[#252525] border-[#353535] text-white">
                <SelectValue placeholder="Choose privacy setting" />
              </SelectTrigger>
              <SelectContent className="bg-[#252525] border-[#353535] text-white">
                <SelectItem value="private" className="hover:bg-[#353535]">
                  <div className="flex items-center">
                    <Lock className="h-4 w-4 mr-2" />
                    <span>Private to members</span>
                  </div>
                </SelectItem>
                <SelectItem value="workspace" className="hover:bg-[#353535]">
                  <div className="flex items-center">
                    <Users className="h-4 w-4 mr-2" />
                    <span>Workspace</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
            <div className="text-xs text-gray-400">
              {isPrivate
                ? "Only you and selected members can see this goal"
                : "All workspace members can see this goal"}
            </div>
          </>
        )}
      </div>

      {/* Error message */}
      {error && <div className="text-red-500 text-sm">{error}</div>}

      {/* Action buttons */}
      <div className="flex space-x-4">
        <Button
          onClick={onBack}
          variant="outline"
          className="flex-1 bg-transparent border-[#353535] text-white hover:bg-[#252525]"
        >
          Back
        </Button>
        <Button
          onClick={() => {
            console.log("Submit button clicked with members:", selectedMembers);
            onSubmit();
          }}
          className="flex-1 bg-[#4573D2] hover:bg-[#3A62B3]"
          disabled={isLoading}
        >
          {isLoading ? "Creating..." : "Create goal"}
        </Button>
      </div>
    </GoalCreationLayout>
  );
}
