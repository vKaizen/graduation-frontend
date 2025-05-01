"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { acceptInvite, getInvites, Invite } from "@/api-service";
import { formatDistanceToNow, isPast } from "date-fns";
import { Check, Clock, AlertTriangle, RefreshCw, Users } from "lucide-react";
import { Button } from "../ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/card";

export default function InvitationsList() {
  const { authState } = useAuth();
  const [invites, setInvites] = useState<Invite[]>([]);
  const [loading, setLoading] = useState(false);
  const [acceptingId, setAcceptingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Load received invitations
  const loadInvites = async () => {
    if (!authState.accessToken) return;

    setLoading(true);
    setError(null);

    try {
      const invitesData = await getInvites(authState.accessToken, "received");
      setInvites(invitesData);
    } catch (err) {
      console.error("Failed to load invitations:", err);
      setError("Failed to load your invitations. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInvites();
  }, [authState.accessToken]);

  // Handle accepting an invitation
  const handleAcceptInvite = async (invite: Invite) => {
    if (!authState.accessToken) return;

    setAcceptingId(invite.id);
    setError(null);

    try {
      await acceptInvite(authState.accessToken, invite.inviteToken);

      // Remove from invites list
      setInvites((prev) => prev.filter((i) => i.id !== invite.id));

      // Reload to update the list (in case there are any status changes)
      loadInvites();

      // Refresh the page to update workspace list
      window.location.reload();
    } catch (err) {
      console.error("Failed to accept invitation:", err);
      setError(`Failed to accept invitation: ${(err as Error).message}`);
    } finally {
      setAcceptingId(null);
    }
  };

  // Filter for pending invites
  const pendingInvites = invites.filter(
    (invite) =>
      invite.status === "pending" && !isPast(new Date(invite.expirationTime))
  );

  if (loading && invites.length === 0) {
    return (
      <Card className="my-6 bg-[#252525] border-[#353535]">
        <CardContent className="p-0">
          <div className="text-center py-8">
            <RefreshCw className="h-10 w-10 text-[#666666] mx-auto mb-4 animate-spin" />
            <p className="text-sm text-[#a1a1a1]">Loading your invitations...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (pendingInvites.length === 0 && !loading) {
    return (
      <Card className="my-6 bg-[#252525] border-[#353535]">
        <CardHeader className="border-b border-[#353535]">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-white">Workspace Invitations</CardTitle>
              <CardDescription className="text-[#a1a1a1]">
                You have no pending invitations
              </CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={loadInvites}
              disabled={loading}
              className="bg-[#353535] border-[#454545] text-white hover:bg-[#454545]"
            >
              <RefreshCw
                size={14}
                className={loading ? "mr-2 animate-spin" : "mr-2"}
              />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="text-center py-8">
            <Users className="h-10 w-10 text-[#666666] mx-auto mb-4" />
            <h3 className="font-medium text-white mb-1">
              No pending invitations
            </h3>
            <p className="text-sm text-[#a1a1a1]">
              When you receive an invitation to join a workspace, it will
              appear here
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="my-6 bg-[#252525] border-[#353535]">
      <CardHeader className="border-b border-[#353535]">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-white">Workspace Invitations</CardTitle>
            <CardDescription className="text-[#a1a1a1]">
              You have {pendingInvites.length} pending workspace{" "}
              {pendingInvites.length === 1 ? "invitation" : "invitations"}
            </CardDescription>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={loadInvites}
            disabled={loading}
            className="bg-[#353535] border-[#454545] text-white hover:bg-[#454545]"
          >
            <RefreshCw
              size={14}
              className={loading ? "mr-2 animate-spin" : "mr-2"}
            />
            Refresh
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {error && (
          <div className="px-4 py-3 bg-red-500/10 text-red-400 rounded-md text-sm border border-red-500/20">
            {error}
          </div>
        )}

        <div className="divide-y divide-[#353535]">
          {pendingInvites.map((invite) => (
            <div key={invite.id} className="p-4">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-full bg-[#4573D2]/20 text-[#4573D2]">
                  <Users size={16} />
                </div>
                <div className="flex-1">
                  <h4 className="font-medium text-white">
                    {invite.workspaceName}
                  </h4>
                  <p className="text-sm text-[#a1a1a1] mt-1">
                    Invited by{" "}
                    <span className="font-medium text-white">
                      {invite.inviterName}
                    </span>
                  </p>
                  <div className="flex items-center gap-2 mt-2 text-xs text-[#666666]">
                    <Clock size={12} />
                    <span>
                      Expires{" "}
                      {formatDistanceToNow(new Date(invite.expirationTime), {
                        addSuffix: true,
                      })}
                    </span>
                  </div>
                  <div className="mt-3 flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => handleAcceptInvite(invite)}
                      disabled={acceptingId === invite.id}
                      className="bg-[#4573D2] hover:bg-[#3a62b3] text-white"
                    >
                      {acceptingId === invite.id ? (
                        <>
                          <RefreshCw size={14} className="mr-2 animate-spin" />
                          Accepting...
                        </>
                      ) : (
                        <>
                          <Check size={14} className="mr-2" />
                          Accept
                        </>
                      )}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setInvites((prev) =>
                          prev.filter((i) => i.id !== invite.id)
                        )
                      }
                      className="bg-[#353535] border-[#454545] text-white hover:bg-[#454545]"
                    >
                      Dismiss
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
