"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Users, CalendarDays } from "lucide-react";
import { getAuthCookie } from "@/lib/cookies";
import { jwtDecode } from "jwt-decode";
import { fetchUserById } from "@/api-service";
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
          setIsLoading(false);
          return;
        }

        // Decode the token to get the user ID
        const decoded: any = jwtDecode(token);
        const userId = decoded.sub;

        if (!userId) {
          setIsLoading(false);
          return;
        }

        // Fetch user details
        const user = await fetchUserById(userId);

        setUserData({
          name: user.fullName || user.email || "User",
          tasksCompleted: 0, // This would come from an API call in a real implementation
          collaborators: 0, // This would come from an API call in a real implementation
        });
      } catch (error) {
        console.error("Error getting user data:", error);
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
