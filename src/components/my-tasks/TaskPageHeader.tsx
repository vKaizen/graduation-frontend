"use client";

import React from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Share, Settings2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

export function TaskPageHeader() {
  const { authState } = useAuth();

  // Get initials from username
  const getInitials = (username: string | null) => {
    if (!username) return "U";
    return username
      .split(" ")
      .map((word) => word[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const userInitials = getInitials(authState.username);

  return (
    <div className="flex items-center justify-between px-4 py-2 border-b border-[#262626] bg-black">
      <div className="flex items-center gap-2">
        <Avatar className="h-8 w-8 bg-purple-500">
          <AvatarFallback>{userInitials}</AvatarFallback>
        </Avatar>
        <h1 className="text-lg font-medium text-white">My tasks</h1>
      </div>
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          className="text-gray-400 hover:bg-[#262626]"
        >
          <Share className="h-4 w-4 mr-2" />
          Share
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="text-gray-400 hover:bg-[#262626]"
        >
          <Settings2 className="h-4 w-4 mr-2" />
          Customize
        </Button>
      </div>
    </div>
  );
}
