"use client";

import React, { useState, useEffect } from "react";
import { Project, TaskActivity } from "@/types";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { format } from "date-fns";
import {
  CalendarClock,
  CheckCircle,
  AlertCircle,
  AlertTriangle,
  Info,
  Clock,
  User,
  Pencil,
} from "lucide-react";
import {
  fetchProjectActivities,
  updateProjectStatus as apiUpdateProjectStatus,
  updateProjectDescription,
  fetchUserById,
  fetchUsers,
} from "@/api-service";

interface OverviewProps {
  project: Project;
  updateProjectStatus: (status?: string) => void;
}

export function Overview({ project, updateProjectStatus }: OverviewProps) {
  const [projectStatus, setProjectStatus] = useState<string>(
    project.status || "on-track"
  );
  const [activities, setActivities] = useState<TaskActivity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [description, setDescription] = useState(project.description || "");
  const [userMap, setUserMap] = useState<
    Record<string, { email: string; fullName: string }>
  >({});

  // Get initials from a name
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((part) => (part ? part[0] : ""))
      .join("")
      .toUpperCase();
  };

  // Fetch user data for all project members
  useEffect(() => {
    const loadUsers = async () => {
      try {
        // Initial user map
        const newUserMap: Record<string, { email: string; fullName: string }> =
          {};

        // Try to get all users from the API - if this fails, we'll fall back to individual fetches
        try {
          console.log("Attempting to fetch all users...");
          const users = await fetchUsers();
          console.log("Fetched users for userMap:", users);

          if (users && users.length > 0) {
            // Create a map of user IDs to user data
            users.forEach((user) => {
              if (user && user._id) {
                newUserMap[user._id] = {
                  email: user.email || "Unknown Email",
                  fullName: user.fullName || user.email || "Unknown User",
                };
              }
            });
            console.log(
              "Created userMap from all users:",
              Object.keys(newUserMap).length
            );
          }
        } catch (error) {
          console.log(
            "Could not fetch all users, falling back to individual fetches:",
            error
          );
        }

        // If all users fetch failed or returned empty, fetch project members individually
        if (Object.keys(newUserMap).length === 0 && project && project.roles) {
          console.log("Fetching individual users for project roles...");

          // Get unique user IDs from project roles
          const userIds = new Set(
            project.roles.map((role) =>
              typeof role.userId === "string"
                ? role.userId
                : role.userId.toString()
            )
          );

          // Fetch each user individually
          for (const userId of userIds) {
            try {
              const user = await fetchUserById(userId);
              if (user) {
                newUserMap[userId] = {
                  email: user.email || "Unknown Email",
                  fullName: user.fullName || user.email || "Unknown User",
                };
              }
            } catch (userError) {
              console.error(`Error fetching user ${userId}:`, userError);
            }
          }

          console.log(
            "Created userMap from individual fetches:",
            Object.keys(newUserMap).length
          );
        }

        // Set the user map with whatever data we were able to gather
        setUserMap(newUserMap);
      } catch (error) {
        console.error("Error in loadUsers:", error);
      }
    };

    loadUsers();
  }, [project]);

  // Fetch project activities from the database
  useEffect(() => {
    const fetchActivities = async () => {
      if (!project._id) return;

      setIsLoading(true);
      try {
        // Try to fetch real data from API
        const fetchedActivities = await fetchProjectActivities(project._id);

        if (fetchedActivities && fetchedActivities.length > 0) {
          setActivities(fetchedActivities);
        } else {
          // Use fallback data if API returns empty array
          setActivities(getFallbackActivities());
        }
      } catch (error) {
        console.error("Error fetching project activities:", error);
        // Fallback to mock data if API fails
        setActivities(getFallbackActivities());
      } finally {
        setIsLoading(false);
      }
    };

    // Helper function to get fallback activities
    const getFallbackActivities = (): TaskActivity[] => {
      return [
        {
          type: "created",
          user: "John Doe",
          timestamp: new Date(
            Date.now() - 3 * 24 * 60 * 60 * 1000
          ).toISOString(),
          content: "created the project",
        },
        {
          type: "updated",
          user: "Jane Smith",
          timestamp: new Date(
            Date.now() - 2 * 24 * 60 * 60 * 1000
          ).toISOString(),
          content: "updated the project description",
        },
        {
          type: "commented",
          user: "Michael Brown",
          timestamp: new Date(
            Date.now() - 1 * 24 * 60 * 60 * 1000
          ).toISOString(),
          content:
            "added a comment: 'Let's focus on the UI improvements first'",
        },
        {
          type: "updated",
          user: "Sarah Johnson",
          timestamp: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
          content: "changed the project status to 'At Risk'",
        },
      ];
    };

    fetchActivities();
  }, [project._id]);

  // Update project description state when project changes
  useEffect(() => {
    setDescription(project.description || "");
  }, [project.description]);

  // Add a useEffect to update projectStatus when the project.status changes
  useEffect(() => {
    if (project.status) {
      setProjectStatus(project.status);
    }
  }, [project.status]);

  // Function to refresh activities without showing full loading state
  const refreshActivityLogs = async () => {
    if (!project._id) return;

    // Create a temporary loading state for just the activity area
    const activityAreaElement = document.querySelector("[data-activity-area]");
    if (activityAreaElement) {
      activityAreaElement.classList.add("opacity-50");
    }

    try {
      const freshActivities = await fetchProjectActivities(project._id);
      if (freshActivities && freshActivities.length > 0) {
        setActivities(freshActivities);
      }
    } catch (error) {
      console.error("Error refreshing activities:", error);
    } finally {
      // Remove the loading state
      if (activityAreaElement) {
        activityAreaElement.classList.remove("opacity-50");
      }
    }
  };

  const handleStatusChange = async (status: string) => {
    if (!project._id) return;

    // Update local state first
    setProjectStatus(status);

    try {
      // Update project status in the database
      await apiUpdateProjectStatus(project._id, { status: status });

      // Update activity logs
      await refreshActivityLogs();

      // Call the parent's update function without parameters to avoid project refresh
      updateProjectStatus();
    } catch (error) {
      console.error("Error updating project status:", error);
      // Revert the status if the API call fails
      setProjectStatus(projectStatus);
    }
  };

  const handleDescriptionSave = async () => {
    if (!project._id) return;

    try {
      // Show loading indicator
      setIsLoading(true);

      // Update project description in the database
      const updatedProject = await updateProjectDescription(
        project._id,
        description
      );

      // Exit edit mode
      setIsEditing(false);

      // Update activity logs
      await refreshActivityLogs();

      // Update the local project state with the returned project data
      if (updatedProject) {
        // Call the parent's function without parameters to avoid project refresh
        updateProjectStatus();
      }
    } catch (error) {
      console.error("Error updating project description:", error);
      // Revert to original description on failure
      setDescription(project.description || "");
    } finally {
      setIsLoading(false);
    }
  };

  // Get username from activity user object or string
  const getUserName = (
    user: string | { userId: string; name: string; _id?: string }
  ): string => {
    // Helper function to find a user by email
    const findUserByEmail = (email: string) => {
      const foundUser = Object.values(userMap).find((u) => u.email === email);
      return foundUser?.fullName || email;
    };

    // If the user is a string, it could be a user ID or email
    if (typeof user === "string") {
      // If it's an email, look for a matching user by email
      if (user.includes("@")) {
        return findUserByEmail(user);
      }

      // If it's a user ID, look it up in the userMap
      return userMap[user]?.fullName || userMap[user]?.email || user;
    }

    // Handle the activity log user object from backend
    if (user && typeof user === "object") {
      // If name is provided in the object and it's an email, try to find the full name
      if (user.name && user.name.includes("@")) {
        return findUserByEmail(user.name);
      }

      // If name is provided (and not an email), use it
      if (user.name) {
        return user.name;
      }

      // If userId is provided, look it up in the userMap
      if (user.userId && userMap[user.userId]) {
        return userMap[user.userId].fullName || userMap[user.userId].email;
      }
    }

    // Fallback for any other case
    return "Unknown User";
  };

  return (
    <div className="h-full flex flex-col bg-black text-white">
      {/* Custom scrollbar styles */}
      <style jsx global>{`
        ::-webkit-scrollbar {
          width: 8px;
          height: 8px;
        }
        ::-webkit-scrollbar-track {
          background: #111111;
          border-radius: 4px;
        }
        ::-webkit-scrollbar-thumb {
          background: #353535;
          border-radius: 4px;
        }
        ::-webkit-scrollbar-thumb:hover {
          background: #454545;
        }

        /* Add smooth transitions */
        [data-activity-area] {
          transition: opacity 0.2s ease;
        }

        .status-btn {
          transition: all 0.2s ease;
        }
      `}</style>

      {/* Main container with fixed right sidebar layout */}
      <div className="flex h-full flex-col lg:flex-row overflow-hidden">
        {/* Left content area - 70% width - fixed vertically */}
        <div className="w-full lg:w-[70%] h-full p-6 overflow-hidden">
          {/* Project Title */}
          <div className="mb-8">
            <h1 className="text-2xl font-bold">{project.name}</h1>
          </div>

          {/* Project Description */}
          <div className="bg-[#111111] rounded-lg p-6 mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Project description</h2>
              {isEditing ? (
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-sm text-neutral-400 hover:text-white"
                    onClick={() => {
                      setIsEditing(false);
                      setDescription(project.description || "");
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="default"
                    size="sm"
                    className="text-sm"
                    onClick={handleDescriptionSave}
                  >
                    Save
                  </Button>
                </div>
              ) : (
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-sm text-neutral-400 hover:text-white"
                  onClick={() => setIsEditing(true)}
                >
                  <Pencil className="h-4 w-4 mr-2" />
                  Edit
                </Button>
              )}
            </div>
            {isEditing ? (
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full h-32 bg-[#222222] text-white border border-[#353535] rounded-md p-3 focus:outline-none focus:ring-1 focus:ring-[#454545]"
                placeholder="What's this project about?"
              />
            ) : (
              <p className="text-neutral-400">
                {project.description || "What's this project about?"}
              </p>
            )}
          </div>

          {/* Project Members/Roles */}
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold">Project roles</h2>
              <Button
                variant="outline"
                size="sm"
                className="border-dashed border-[#454545] text-neutral-400 hover:text-white"
              >
                <User className="h-4 w-4 mr-2" />
                Add member
              </Button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {project.roles.map((role, index) => (
                <div
                  key={index}
                  className="flex items-center gap-3 bg-[#111111] rounded-lg p-4 hover:bg-[#1a1a1a] transition-colors"
                >
                  <Avatar className="h-10 w-10 bg-[#252525]">
                    <AvatarFallback className="bg-violet-700 text-white">
                      {getInitials(getUserName(role.userId))}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm text-white">
                      {getUserName(role.userId)}
                    </p>
                    <p className="text-xs text-neutral-400">{role.role}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right sidebar - 30% width - scrollable */}
        <div className="w-full lg:w-[30%] h-full lg:border-l border-[#222222] flex-shrink-0 overflow-y-auto p-6">
          {/* Project Status */}
          <div className="bg-[#111111] rounded-lg p-5 mb-8">
            <h2 className="text-lg font-semibold mb-4">Project status</h2>
            <div className="flex flex-col gap-2">
              <Button
                variant="outline"
                className={`justify-start status-btn ${
                  projectStatus === "on-track"
                    ? "bg-[#1e2e1e] border-green-600 text-white"
                    : "border-[#353535] text-neutral-400 hover:text-white"
                }`}
                onClick={() => handleStatusChange("on-track")}
              >
                <span className="flex items-center">
                  <span className="h-2 w-2 rounded-full bg-green-500 mr-2"></span>
                  On track
                </span>
              </Button>

              <Button
                variant="outline"
                className={`justify-start status-btn ${
                  projectStatus === "at-risk"
                    ? "bg-[#2e2a1e] border-yellow-600 text-white"
                    : "border-[#353535] text-neutral-400 hover:text-white"
                }`}
                onClick={() => handleStatusChange("at-risk")}
              >
                <span className="flex items-center">
                  <span className="h-2 w-2 rounded-full bg-yellow-500 mr-2"></span>
                  At risk
                </span>
              </Button>

              <Button
                variant="outline"
                className={`justify-start status-btn ${
                  projectStatus === "off-track"
                    ? "bg-[#2e1e1e] border-red-600 text-white"
                    : "border-[#353535] text-neutral-400 hover:text-white"
                }`}
                onClick={() => handleStatusChange("off-track")}
              >
                <span className="flex items-center">
                  <span className="h-2 w-2 rounded-full bg-red-500 mr-2"></span>
                  Off track
                </span>
              </Button>

              <Button
                variant="outline"
                className={`justify-start status-btn ${
                  projectStatus === "completed"
                    ? "bg-[#1e2e2e] border-blue-600 text-white"
                    : "border-[#353535] text-neutral-400 hover:text-white"
                }`}
                onClick={() => handleStatusChange("completed")}
              >
                <span className="flex items-center">
                  <span className="h-2 w-2 rounded-full bg-blue-500 mr-2"></span>
                  Completed
                </span>
              </Button>
            </div>
          </div>

          {/* Activity Timeline */}
          <div data-activity-area>
            <h2 className="text-lg font-semibold mb-4">Recent activity</h2>
            {isLoading ? (
              <div className="flex items-center justify-center h-20">
                <div className="animate-spin h-5 w-5 border-2 border-neutral-500 rounded-full border-t-transparent"></div>
              </div>
            ) : activities.length === 0 ? (
              <div className="text-center text-neutral-400 py-8">
                No activity recorded yet
              </div>
            ) : (
              <div className="space-y-4">
                {activities.map((activity, index) => (
                  <div
                    key={index}
                    className="flex gap-3 bg-[#111111] rounded-lg p-3 hover:bg-[#1a1a1a] transition-colors"
                  >
                    <div className="h-8 w-8 rounded-full bg-[#252525] flex items-center justify-center flex-shrink-0">
                      {activity.type === "created" && (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      )}
                      {activity.type === "updated" && (
                        <Info className="h-4 w-4 text-blue-500" />
                      )}
                      {activity.type === "commented" && (
                        <CalendarClock className="h-4 w-4 text-yellow-500" />
                      )}
                    </div>
                    <div>
                      <div className="flex items-center text-sm font-medium text-white">
                        {activity.user &&
                        typeof activity.user === "object" &&
                        activity.user.name
                          ? activity.user.name.includes("@")
                            ? Object.values(userMap).find(
                                (u) => u.email === activity.user.name
                              )?.fullName || activity.user.name
                            : activity.user.name
                          : getUserName(activity.user)}
                      </div>
                      <p className="text-xs text-neutral-400 mb-1">
                        {activity.content}
                      </p>
                      <span className="text-xs text-neutral-500">
                        {format(new Date(activity.timestamp), "MMM d, h:mm a")}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
