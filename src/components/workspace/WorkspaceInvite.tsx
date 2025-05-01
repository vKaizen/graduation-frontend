"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import {
  createInvite,
  getInvites,
  cancelInvite,
  type Invite,
} from "@/api-service";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../ui/dialog";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table";
import {
  Search,
  UserPlus,
  Check,
  X,
  Clock,
  RefreshCw,
  AlertTriangle,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

// Status badge component
const StatusBadge = ({ status }: { status: string }) => {
  let bgColor = "bg-gray-100 text-gray-700";
  let icon = null;

  switch (status) {
    case "pending":
      bgColor = "bg-yellow-100 text-yellow-700";
      icon = <Clock size={12} className="mr-1" />;
      break;
    case "accepted":
      bgColor = "bg-green-100 text-green-600";
      icon = <Check size={12} className="mr-1" />;
      break;
    case "expired":
      bgColor = "bg-gray-100 text-gray-600";
      icon = <AlertTriangle size={12} className="mr-1" />;
      break;
    case "revoked":
      bgColor = "bg-red-100 text-red-600";
      icon = <X size={12} className="mr-1" />;
      break;
  }

  return (
    <span
      className={`inline-flex items-center px-2 py-1 rounded-full text-xs ${bgColor}`}
    >
      {icon}
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
};

// Main Component
export default function WorkspaceInvite({
  workspaceId,
  users = [],
}: {
  workspaceId: string;
  users?: Array<{ id: string; fullName: string; email: string }>;
}) {
  const { authState } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedUserId, setSelectedUserId] = useState("");
  const [userInvites, setUserInvites] = useState<Invite[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"invite" | "pending">("invite");

  // Load pending invites
  const loadPendingInvites = async () => {
    setIsLoading(true);
    try {
      const invites = await getInvites(authState.accessToken || "", "sent");
      // Filter for invites for this workspace
      const filteredInvites = invites.filter(
        (invite) => invite.workspaceId === workspaceId
      );
      setUserInvites(filteredInvites);
    } catch (err) {
      console.error("Failed to load invites:", err);
      setError("Failed to load pending invites.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === "pending" && authState.accessToken) {
      loadPendingInvites();
    }
  }, [activeTab, authState.accessToken, workspaceId]);

  // Filter users based on search term and exclude users with pending invites
  const filteredUsers = users.filter((user) => {
    // Don't show users who already have pending invites
    const hasPendingInvite = userInvites.some(
      (invite) => invite.inviteeId === user.id && invite.status === "pending"
    );

    if (hasPendingInvite) return false;

    // Filter by search term
    if (!searchTerm) return true;

    const searchLower = searchTerm.toLowerCase();
    return (
      user.fullName.toLowerCase().includes(searchLower) ||
      user.email.toLowerCase().includes(searchLower)
    );
  });

  // Handle sending invite
  const handleSendInvite = async () => {
    if (!selectedUserId) {
      setError("Please select a user to invite.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await createInvite(
        authState.accessToken || "",
        selectedUserId,
        workspaceId
      );

      // Reset selection
      setSelectedUserId("");
      setSearchTerm("");

      // Switch to pending tab and refresh the list
      setActiveTab("pending");
      loadPendingInvites();
    } catch (err) {
      console.error("Failed to send invite:", err);
      setError((err as Error).message || "Failed to send invitation.");
    } finally {
      setLoading(false);
    }
  };

  // Handle cancelling an invite
  const handleCancelInvite = async (inviteId: string) => {
    try {
      await cancelInvite(authState.accessToken || "", inviteId);
      // Refresh the list after cancellation
      loadPendingInvites();
    } catch (err) {
      console.error("Failed to cancel invite:", err);
      setError((err as Error).message || "Failed to cancel invitation.");
    }
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1">
          <UserPlus size={14} />
          Invite
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Invite Users to Workspace</DialogTitle>
        </DialogHeader>

        <div className="flex border-b mb-4">
          <button
            className={`px-4 py-2 ${
              activeTab === "invite"
                ? "border-b-2 border-blue-500 text-blue-600"
                : "text-gray-500 hover:text-gray-700"
            }`}
            onClick={() => setActiveTab("invite")}
          >
            Invite Users
          </button>
          <button
            className={`px-4 py-2 ${
              activeTab === "pending"
                ? "border-b-2 border-blue-500 text-blue-600"
                : "text-gray-500 hover:text-gray-700"
            }`}
            onClick={() => setActiveTab("pending")}
          >
            Pending Invites
          </button>
        </div>

        {activeTab === "invite" ? (
          <div>
            <div className="mb-4">
              <div className="relative mb-4">
                <Input
                  placeholder="Search users by name or email"
                  className="pl-8"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
              </div>

              <div className="max-h-60 overflow-y-auto border rounded-md">
                {filteredUsers.length === 0 ? (
                  <div className="p-4 text-center text-gray-500">
                    No users found
                  </div>
                ) : (
                  <div className="divide-y">
                    {filteredUsers.map((user) => (
                      <div
                        key={user.id}
                        className={`p-3 flex items-center justify-between hover:bg-gray-50 cursor-pointer ${
                          selectedUserId === user.id ? "bg-blue-50" : ""
                        }`}
                        onClick={() => setSelectedUserId(user.id)}
                      >
                        <div>
                          <div className="font-medium">{user.fullName}</div>
                          <div className="text-sm text-gray-500">
                            {user.email}
                          </div>
                        </div>
                        {selectedUserId === user.id && (
                          <Check size={16} className="text-blue-500" />
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {error && (
                <div className="mt-2 text-sm text-red-500">{error}</div>
              )}

              <div className="mt-4 flex justify-end">
                <Button
                  onClick={handleSendInvite}
                  disabled={!selectedUserId || loading}
                >
                  {loading ? "Sending..." : "Send Invite"}
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <div>
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-medium">Pending Invitations</h3>
              <Button
                variant="outline"
                size="sm"
                onClick={loadPendingInvites}
                disabled={isLoading}
              >
                <RefreshCw
                  size={14}
                  className={isLoading ? "animate-spin" : ""}
                />
              </Button>
            </div>

            {error && <div className="text-sm text-red-500 mb-3">{error}</div>}

            {isLoading ? (
              <div className="p-8 text-center">
                <RefreshCw size={24} className="animate-spin mx-auto mb-2" />
                <p className="text-gray-500">Loading invites...</p>
              </div>
            ) : userInvites.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                No pending invitations found
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Sent</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {userInvites.map((invite) => (
                      <TableRow key={invite.id}>
                        <TableCell>
                          <div className="font-medium">
                            {invite.inviteeName}
                          </div>
                        </TableCell>
                        <TableCell>
                          <StatusBadge status={invite.status} />
                        </TableCell>
                        <TableCell>
                          {formatDistanceToNow(new Date(invite.inviteTime), {
                            addSuffix: true,
                          })}
                        </TableCell>
                        <TableCell>
                          {invite.status === "pending" && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleCancelInvite(invite.id)}
                            >
                              Cancel
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
