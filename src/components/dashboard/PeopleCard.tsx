"use client";

import { useState, useEffect } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Plus, AlertCircle, UserPlus } from "lucide-react";
import { BaseCard } from "./BaseCard";
import { useWorkspace } from "@/contexts/workspace-context";
import { fetchWorkspaceMembers } from "@/api-service";
import { Skeleton } from "@/components/ui/skeleton";
import { User } from "@/types";
import { useRouter } from "next/navigation";
import { MemberInviteModal } from "@/components/workspace/MemberInviteModal";

interface PeopleCardProps {
  onRemove?: () => void;
  cardId?: string;
  isFullWidth?: boolean;
  onSizeChange?: (isFullWidth: boolean) => void;
}

export function PeopleCard({
  onRemove,
  cardId = "people-card",
  isFullWidth = false,
  onSizeChange,
}: PeopleCardProps) {
  const [members, setMembers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { currentWorkspace } = useWorkspace();
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    async function fetchMembers() {
      if (!currentWorkspace?._id) {
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const fetchedMembers = await fetchWorkspaceMembers(
          currentWorkspace._id
        );
        console.log("Fetched workspace members:", fetchedMembers);
        setMembers(fetchedMembers || []);
      } catch (err) {
        console.error("Error fetching workspace members:", err);
        setError("Failed to load members");
      } finally {
        setIsLoading(false);
      }
    }

    fetchMembers();
  }, [currentWorkspace]);

  // Navigate to member profile
  const handleMemberClick = (userId: string) => {
    router.push(`/profile/${userId}`);
  };

  // Get member initials for avatar fallback
  const getMemberInitials = (user: User): string => {
    if (user.fullName) {
      return user.fullName
        .split(" ")
        .map((name) => name[0])
        .join("")
        .toUpperCase()
        .substring(0, 2);
    }
    return user.email.substring(0, 2).toUpperCase();
  };

  // Get random color for avatar background
  const getAvatarColor = (userId: string): string => {
    const colors = [
      "bg-blue-500",
      "bg-green-500",
      "bg-pink-500",
      "bg-purple-500",
      "bg-yellow-500",
      "bg-indigo-500",
      "bg-red-500",
    ];
    // Use userId to deterministically select a color
    const colorIndex =
      userId.split("").reduce((sum, char) => sum + char.charCodeAt(0), 0) %
      colors.length;
    return colors[colorIndex];
  };

  // Loading state
  if (isLoading) {
    return (
      <BaseCard
        title="People"
        onRemove={onRemove}
        cardId={cardId}
        isFullWidth={isFullWidth}
        onSizeChange={onSizeChange}
      >
        <div className="space-y-4">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      </BaseCard>
    );
  }

  // Error state
  if (error) {
    return (
      <BaseCard
        title="People"
        onRemove={onRemove}
        cardId={cardId}
        isFullWidth={isFullWidth}
        onSizeChange={onSizeChange}
      >
        <div className="flex flex-col items-center justify-center h-full text-center">
          <AlertCircle className="h-10 w-10 text-red-500 mb-2" />
          <p className="text-gray-400">{error}</p>
          <Button
            variant="outline"
            className="mt-4 text-white"
            onClick={() => {
              setIsLoading(true);
              setError(null);
              fetchWorkspaceMembers(currentWorkspace?._id || "")
                .then((members) => {
                  setMembers(members || []);
                  setIsLoading(false);
                })
                .catch((err) => {
                  console.error("Error retrying members fetch:", err);
                  setError("Failed to load members");
                  setIsLoading(false);
                });
            }}
          >
            Retry
          </Button>
        </div>
      </BaseCard>
    );
  }

  return (
    <BaseCard
      title="People"
      onRemove={onRemove}
      cardId={cardId}
      isFullWidth={isFullWidth}
      onSizeChange={onSizeChange}
    >
      <div className="h-full flex flex-col">
        <div className="space-y-2 flex-1 overflow-y-auto scrollbar-hide">
          {members.length > 0 ? (
            members.map((member) => (
              <div
                key={member._id}
                className="flex items-center gap-3 p-2 hover:bg-white/5 rounded-lg cursor-pointer transition-colors"
                onClick={() => handleMemberClick(member._id)}
              >
                <Avatar className="h-10 w-10">
                  {member.profilePicture ? (
                    <AvatarImage
                      src={member.profilePicture}
                      alt={member.fullName || member.email}
                    />
                  ) : null}
                  <AvatarFallback className={getAvatarColor(member._id)}>
                    {getMemberInitials(member)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="text-white truncate">
                    {member.fullName || member.email}
                  </div>
                  {member.fullName && (
                    <div className="text-xs text-gray-400 truncate">
                      {member.email}
                    </div>
                  )}
                </div>
                <div className="text-xs bg-[#353535] rounded-full px-2 py-0.5 text-gray-300">
                  {member.role || "Member"}
                </div>
              </div>
            ))
          ) : (
            <div className="p-4 text-gray-400 text-center">
              No members in this workspace yet.
            </div>
          )}
        </div>
      </div>

      {/* Invite modal */}
      {isInviteModalOpen && currentWorkspace && (
        <MemberInviteModal
          workspaceId={currentWorkspace._id}
          projects={[]} // We don't need projects for this simple version
          onInviteSent={() => {
            // Reload members after invitation
            setIsInviteModalOpen(false);
            setIsLoading(true);
            fetchWorkspaceMembers(currentWorkspace._id)
              .then((members) => {
                setMembers(members || []);
                setIsLoading(false);
              })
              .catch((error) => {
                console.error("Error reloading members:", error);
                setIsLoading(false);
              });
          }}
          onClose={() => setIsInviteModalOpen(false)}
        />
      )}
    </BaseCard>
  );
}
