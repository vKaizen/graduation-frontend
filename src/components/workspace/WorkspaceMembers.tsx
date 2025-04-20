"use client";

import React, { useState, useEffect } from "react";
import { useWorkspace } from "@/contexts/workspace-context";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { User } from "@/types";
import {
  fetchUsers,
  addWorkspaceMember,
  updateWorkspaceMemberRole,
  removeWorkspaceMember,
} from "@/api-service";
import { toast } from "sonner";
import RequireWorkspacePermission from "./RequireWorkspacePermission";
import {
  MoreHorizontal,
  UserPlus,
  ShieldAlert,
  Shield,
  User as UserIcon,
} from "lucide-react";

export default function WorkspaceMembers() {
  const { currentWorkspace, currentRole, refreshWorkspaces } = useWorkspace();
  const [users, setUsers] = useState<User[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedUserId, setSelectedUserId] = useState("");
  const [selectedRole, setSelectedRole] = useState<"admin" | "member">(
    "member"
  );
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const loadUsers = async () => {
      try {
        const fetchedUsers = await fetchUsers();
        setUsers(fetchedUsers);
      } catch (error) {
        console.error("Error loading users:", error);
        toast.error("Failed to load users");
      }
    };

    loadUsers();
  }, []);

  const handleAddMember = async () => {
    if (!currentWorkspace || !selectedUserId) return;

    setIsLoading(true);
    try {
      await addWorkspaceMember(currentWorkspace._id, {
        userId: selectedUserId,
        role: selectedRole,
      });
      toast.success("Member added successfully");
      refreshWorkspaces();
      setSelectedUserId("");
    } catch (error) {
      console.error("Error adding member:", error);
      toast.error("Failed to add member");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRoleChange = async (
    memberId: string,
    newRole: "admin" | "member"
  ) => {
    if (!currentWorkspace) return;

    try {
      await updateWorkspaceMemberRole(currentWorkspace._id, memberId, {
        role: newRole,
      });
      toast.success("Member role updated");
      refreshWorkspaces();
    } catch (error) {
      console.error("Error updating role:", error);
      toast.error("Failed to update member role");
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    if (!currentWorkspace) return;

    try {
      await removeWorkspaceMember(currentWorkspace._id, memberId);
      toast.success("Member removed");
      refreshWorkspaces();
    } catch (error) {
      console.error("Error removing member:", error);
      toast.error("Failed to remove member");
    }
  };

  const getUserById = (userId: string): User | undefined => {
    return users.find((user) => user._id === userId);
  };

  const filteredUsers = users.filter((user) => {
    // Don't show users already in the workspace
    const alreadyMember =
      currentWorkspace?.members.some((member) => member.userId === user._id) ||
      currentWorkspace?.owner === user._id;
    if (alreadyMember) return false;

    // Filter by search query
    if (!searchQuery) return true;
    return (
      user.fullName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case "owner":
        return <ShieldAlert className="h-4 w-4 text-yellow-500" />;
      case "admin":
        return <Shield className="h-4 w-4 text-blue-500" />;
      default:
        return <UserIcon className="h-4 w-4 text-gray-500" />;
    }
  };

  // Handle old or new member structure format consistently
  const normalizeMembers = () => {
    if (!currentWorkspace) return [];

    const members = currentWorkspace.members;

    // If members is an array of strings (old format), convert to objects with userId and role
    if (Array.isArray(members) && members.length > 0) {
      if (typeof members[0] !== "object") {
        return members.map((memberId: any) => ({
          userId: memberId,
          role: "member" as const,
        }));
      }
    }

    return members;
  };

  const normalizedMembers = normalizeMembers();

  if (!currentWorkspace) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Workspace Members</CardTitle>
        <CardDescription>
          Manage members and their roles in this workspace
        </CardDescription>
      </CardHeader>
      <CardContent>
        <RequireWorkspacePermission requiredRoles={["owner", "admin"]}>
          <div className="space-y-4 mb-6">
            <div className="flex items-end gap-2">
              <div className="flex-1">
                <Input
                  placeholder="Search users..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="mb-2"
                />
                <Select
                  value={selectedUserId}
                  onValueChange={setSelectedUserId}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a user" />
                  </SelectTrigger>
                  <SelectContent>
                    {filteredUsers.map((user) => (
                      <SelectItem key={user._id} value={user._id}>
                        {user.fullName || user.email}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Select
                  value={selectedRole}
                  onValueChange={(value) =>
                    setSelectedRole(value as "admin" | "member")
                  }
                  disabled={currentRole !== "owner"}
                >
                  <SelectTrigger className="w-[110px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="member">Member</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button
                onClick={handleAddMember}
                disabled={!selectedUserId || isLoading}
              >
                <UserPlus className="h-4 w-4 mr-2" />
                Add
              </Button>
            </div>
          </div>
        </RequireWorkspacePermission>

        <div className="space-y-4">
          {/* Owner */}
          <div className="flex items-center justify-between p-2 rounded-md bg-gray-50 dark:bg-gray-900">
            <div className="flex items-center gap-3">
              <Avatar>
                <AvatarFallback>
                  {getUserById(currentWorkspace.owner)?.fullName
                    ? getInitials(
                        getUserById(currentWorkspace.owner)?.fullName || ""
                      )
                    : "U"}
                </AvatarFallback>
              </Avatar>
              <div>
                <div className="font-medium flex items-center gap-1">
                  {getUserById(currentWorkspace.owner)?.fullName ||
                    getUserById(currentWorkspace.owner)?.email ||
                    "Unknown"}
                  <ShieldAlert className="h-4 w-4 text-yellow-500 ml-1" />
                </div>
                <div className="text-sm text-gray-500">Owner</div>
              </div>
            </div>
          </div>

          {/* Members with roles */}
          {normalizedMembers.map((member) => {
            const user = getUserById(member.userId);
            return (
              <div
                key={member.userId}
                className="flex items-center justify-between p-2 rounded-md hover:bg-gray-50 dark:hover:bg-gray-900"
              >
                <div className="flex items-center gap-3">
                  <Avatar>
                    <AvatarFallback>
                      {user?.fullName ? getInitials(user.fullName) : "U"}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="font-medium flex items-center gap-1">
                      {user?.fullName || user?.email || "Unknown"}
                      {getRoleIcon(member.role)}
                    </div>
                    <div className="text-sm text-gray-500 capitalize">
                      {member.role}
                    </div>
                  </div>
                </div>

                <RequireWorkspacePermission requiredRoles={["owner", "admin"]}>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreHorizontal className="h-4 w-4" />
                        <span className="sr-only">Open menu</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Actions</DropdownMenuLabel>
                      <DropdownMenuSeparator />

                      {/* Only owners can change role to admin */}
                      {currentRole === "owner" && (
                        <>
                          <DropdownMenuItem
                            onClick={() =>
                              handleRoleChange(member.userId, "admin")
                            }
                            disabled={member.role === "admin"}
                          >
                            Make Admin
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() =>
                              handleRoleChange(member.userId, "member")
                            }
                            disabled={member.role === "member"}
                          >
                            Make Member
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                        </>
                      )}

                      {/* Only owners can remove admins, but admins can remove members */}
                      {(currentRole === "owner" ||
                        (currentRole === "admin" &&
                          member.role === "member")) && (
                        <DropdownMenuItem
                          onClick={() => handleRemoveMember(member.userId)}
                          className="text-red-600"
                        >
                          Remove from Workspace
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </RequireWorkspacePermission>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
