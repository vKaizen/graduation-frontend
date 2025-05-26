"use client";

import { useEffect, useState } from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Settings, Star } from "lucide-react";
import type { Project, User } from "@/types";
import { fetchProjectMembers } from "@/api-service";

export function ProjectHeader({ project }: { project: Project | null }) {
  const [members, setMembers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch project members when project changes
  useEffect(() => {
    const getMembers = async () => {
      if (!project) return;

      try {
        setLoading(true);
        const fetchedMembers = await fetchProjectMembers(project._id);
        setMembers(fetchedMembers);
      } catch (error) {
        console.error("Error fetching project members:", error);
      } finally {
        setLoading(false);
      }
    };

    getMembers();
  }, [project]);

  // Function to get initials from user's full name
  const getUserInitials = (user: User): string => {
    if (!user.fullName) return user.email.substring(0, 2).toUpperCase();

    return user.fullName
      .split(" ")
      .map((name) => name.charAt(0))
      .join("")
      .toUpperCase()
      .substring(0, 2);
  };

  if (!project) {
    return (
      <div className="border-b border-[#353535] bg-[#1a1a1a]">
        <div className="container mx-auto px-4 py-3 flex items-center">
          <span className="text-gray-400">Loading project...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="border-b border-[#353535] bg-[#1a1a1a]">
      <div className="container mx-auto px-5 py-4 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div
            className="w-7 h-7 rounded flex items-center justify-center text-white text-sm"
            style={{ backgroundColor: project.color || "#4573D2" }}
          >
            {project.name.charAt(0).toUpperCase()}
          </div>
          <h1 className="text-lg font-medium text-white">{project.name}</h1>
          <button className="text-gray-400 hover:text-white">
            <Star className="h-4 w-4" />
          </button>
        </div>
        <div className="flex items-center space-x-3">
          <div className="flex -space-x-2 mr-1">
            {loading ? (
              // Skeleton loading state
              <>
                <div className="border-2 border-[#1a1a1a] h-6 w-6 rounded-full bg-[#252525] animate-pulse"></div>
                <div className="border-2 border-[#1a1a1a] h-6 w-6 rounded-full bg-[#252525] animate-pulse"></div>
              </>
            ) : members.length > 0 ? (
              // Real user avatars
              members.slice(0, 5).map((member) => (
                <Avatar
                  key={member._id}
                  className="border-2 border-[#1a1a1a] h-6 w-6"
                  title={member.fullName || member.email}
                >
                  <AvatarFallback className="text-xs bg-[#4573D2] text-white">
                    {getUserInitials(member)}
                  </AvatarFallback>
                </Avatar>
              ))
            ) : (
              // No members found
              <div className="text-xs text-gray-400">No members</div>
            )}

            {members.length > 5 && (
              <div className="border-2 border-[#1a1a1a] h-6 w-6 rounded-full bg-[#353535] flex items-center justify-center text-xs text-white">
                +{members.length - 5}
              </div>
            )}
          </div>

          
        </div>
      </div>
    </div>
  );
}
