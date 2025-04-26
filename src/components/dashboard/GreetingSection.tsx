"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Users, CalendarDays } from "lucide-react";
import { getAuthCookie } from "@/lib/cookies";
import { jwtDecode } from "jwt-decode";
import { fetchUserById, fetchUsers } from "@/api-service";
import { Skeleton } from "@/components/ui/skeleton";

export function GreetingSection() {
  const [userData, setUserData] = useState<{
    name: string;
    tasksCompleted: number;
    collaborators: number;
  }>({
    name: "",
    tasksCompleted: 0,
    collaborators: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  // Get user data from token or API
  useEffect(() => {
    async function getUserData() {
      setIsLoading(true);
      try {
        // Get token and decode it
        const token = getAuthCookie();

        if (!token) {
          setUserData({
            ...userData,
            name: "User",
          });
          setIsLoading(false);
          return;
        }

        // Decode the token to get the user ID
        const decoded: {
          sub?: string;
          username?: string;
          name?: string;
          fullName?: string;
          email?: string;
        } = jwtDecode(token);

        // Create a userMap like in overview.tsx to handle user data better
        const newUserMap: Record<string, { email: string; fullName: string }> =
          {};

        // First try to get all users - this might fail if user doesn't have permission
        try {
          const users = await fetchUsers();

          if (users && users.length > 0) {
            users.forEach((user) => {
              if (user && user._id) {
                newUserMap[user._id] = {
                  email: user.email || "Unknown Email",
                  fullName: user.fullName || user.email || "Unknown User",
                };
              }
            });
          }
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
        } catch (_) {
          // Continue with alternative approach if this fails
        }

        const userId = decoded.sub;

        // Function to find a user by email (similar to overview.tsx)
        const findUserByEmail = (email: string) => {
          const foundUser = Object.values(newUserMap).find(
            (u) => u.email === email
          );
          return foundUser?.fullName || null;
        };

        // Try to determine name from multiple sources - follows overview.tsx pattern
        let displayName = "User";

        // Case 1: If username is an email, try to find it in our user map
        if (decoded.username && decoded.username.includes("@")) {
          const nameFromEmail = findUserByEmail(decoded.username);
          if (nameFromEmail) {
            displayName = nameFromEmail;
            setUserData({
              ...userData,
              name: displayName,
            });
            setIsLoading(false);
            return;
          }
        }

        // Case 2: Use fullName from token if available
        if (decoded.fullName) {
          displayName = decoded.fullName;
          setUserData({
            ...userData,
            name: displayName,
          });
          setIsLoading(false);
          return;
        }

        // Case 3: If we have a userId, try to get user details
        if (userId) {
          try {
            const user = await fetchUserById(userId);

            if (user && user.fullName) {
              displayName = user.fullName;

              setUserData({
                name: displayName,
                tasksCompleted: 0,
                collaborators: 0,
              });
              setIsLoading(false);
              return;
            }
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
          } catch (_) {
            // Fall through to next approach
          }
        }

        // Case 4: Fall back to other token fields
        if (decoded.name) {
          displayName = decoded.name;
        }

        // Use whatever name we determined
        setUserData({
          ...userData,
          name: displayName,
        });
      } catch (_) {
        // Ultimate fallback if everything fails
        setUserData({
          ...userData,
          name: "User",
        });
      } finally {
        setIsLoading(false);
      }
    }

    getUserData();
  }, []);

  const dateString = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  // Function to determine greeting based on time of day
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  };

  if (isLoading) {
    return (
      <div className="text-center mb-8">
        <div className="text-gray-400 mb-2">{dateString}</div>
        <Skeleton className="h-12 w-64 mx-auto mb-6" />
        <div className="flex items-center justify-center gap-4">
          <Skeleton className="h-10 w-24" />
          <Skeleton className="h-10 w-32" />
          <Skeleton className="h-10 w-32" />
        </div>
      </div>
    );
  }

  return (
    <div className="text-center mb-8">
      <div className="text-gray-400 mb-2">{dateString}</div>
      <h1 className="text-4xl font-semibold text-white mb-6">
        {getGreeting()}, {userData.name}
      </h1>

      <div className="flex items-center justify-center gap-4">
        <Button
          variant="ghost"
          className="bg-white/10 text-white hover:bg-white/20 rounded-full p-2 flex items-center justify-center"
        >
          <CalendarDays className="h-4 w-4 mr-2" />
          <span>My week</span>
        </Button>
        <div className="bg-white/10 text-white px-4 py-2 rounded-full flex items-center gap-2">
          <svg
            className="h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 13l4 4L19 7"
            />
          </svg>
          {userData.tasksCompleted} task
          {userData.tasksCompleted !== 1 ? "s" : ""} completed
        </div>
        <div className="bg-white/10 text-white px-4 py-2 rounded-full flex items-center gap-2">
          <Users className="h-4 w-4" />
          {userData.collaborators} collaborator
          {userData.collaborators !== 1 ? "s" : ""}
        </div>
      </div>
    </div>
  );
}
