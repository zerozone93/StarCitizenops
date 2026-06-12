"use client";

import { useCallback, useEffect, useState } from "react";
import type { OrganizationMemberRole } from "@prisma/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { getMilitaryRankLabel } from "@/lib/org-ranks";
import type { AppPrivilegeAction } from "@/lib/permissions";
import { Checkbox } from "@/components/ui/checkbox";

type Member = {
  memberId: string;
  userId: string;
  userName: string;
  userEmail: string | null;
  userImage: string | null;
  starCitizenHandle: string | null;
  currentRole: OrganizationMemberRole;
  joinedAt: string;
  appPrivileges: Record<AppPrivilegeAction, boolean | null>;
};

const APP_PRIVILEGE_LABELS: Record<AppPrivilegeAction, string> = {
  editOrganization: "Edit organization settings",
  inviteMembers: "Invite members",
  createOperation: "Create operations/events",
  editOperation: "Edit operations/events",
  assignRoles: "Manage member privileges",
  inviteOrganizations: "Invite external organizations",
  viewPrivateOperations: "View private operations",
  postAfterActionReports: "Post bulletins/reports",
  manageChannels: "Manage organization chat channels",
};

// Organize privileges by category for better UX
const PRIVILEGE_CATEGORIES: Record<string, AppPrivilegeAction[]> = {
  "Chat & Communication": ["manageChannels", "viewPrivateOperations"],
  "Operations & Events": ["createOperation", "editOperation", "postAfterActionReports"],
  "Organization Management": ["editOrganization", "inviteMembers", "inviteOrganizations"],
  "Member Management": ["assignRoles"],
};

type Channel = {
  id: string;
  title: string;
  description: string | null;
  visibility: "PUBLIC" | "PRIVATE";
  createdAt: string;
  updatedAt: string;
};

type ApiErrorPayload = {
  error?: { message?: string } | string;
};

function getApiErrorMessage(payload: ApiErrorPayload | null, fallback: string) {
  if (!payload) return fallback;
  if (typeof payload.error === "string") return payload.error;
  return payload.error?.message || fallback;
}

interface MemberPrivilegeManagerProps {
  organizationId: string;
  userRole: OrganizationMemberRole | null;
  userId: string;
}

const ROLE_OPTIONS: OrganizationMemberRole[] = [
  "OWNER",
  "OFFICER",
  "COMMANDER",
  "TEAM_LEADER",
  "MEMBER",
  "GUEST",
];

const ROLE_COLORS: Record<OrganizationMemberRole, string> = {
  OWNER: "bg-red-500/20 text-red-300 border-red-500/30",
  OFFICER: "bg-orange-500/20 text-orange-300 border-orange-500/30",
  COMMANDER: "bg-blue-500/20 text-blue-300 border-blue-500/30",
  TEAM_LEADER: "bg-cyan-500/20 text-cyan-300 border-cyan-500/30",
  MEMBER: "bg-slate-500/20 text-slate-300 border-slate-500/30",
  GUEST: "bg-gray-500/20 text-gray-300 border-gray-500/30",
};

function getRolePermissionDetails(role: OrganizationMemberRole): {
  role: string;
  permissions: string[];
  description: string;
} {
  const roleDetails: Record<OrganizationMemberRole, { permissions: string[]; description: string }> = {
    OWNER: {
      permissions: [
        "Edit organization settings",
        "Invite members",
        "Create operations",
        "Edit operations",
        "Assign member roles",
        "Set channel visibility",
        "Remove members",
      ],
      description: "Full organizational control. Used for founder/leader of the organization.",
    },
    OFFICER: {
      permissions: [
        "Invite members",
        "Create operations",
        "Edit operations",
        "Assign member roles",
        "Manage organization operations",
      ],
      description: "Leadership role with broad operational authority.",
    },
    COMMANDER: {
      permissions: [
        "Create operations",
        "Edit operations",
        "Assign roles within operations",
        "Manage subordinates",
      ],
      description: "Tactical leader focused on operation execution and team management.",
    },
    TEAM_LEADER: {
      permissions: ["Create operations", "Assign team members to operations", "View private operations"],
      description: "Team-level leadership with limited cross-organizational scope.",
    },
    MEMBER: {
      permissions: ["View private operations", "Participate in missions"],
      description: "Standard member with participation rights.",
    },
    GUEST: {
      permissions: ["View public operations"],
      description: "Limited access. Can view public content only.",
    },
  };

  const details = roleDetails[role];
  return {
    role: getMilitaryRankLabel(role),
    permissions: details.permissions,
    description: details.description,
  };
}

export function MemberPrivilegeManager({ organizationId, userRole, userId }: MemberPrivilegeManagerProps) {
  const [members, setMembers] = useState<Member[]>([]);
  const [channels, setChannels] = useState<Channel[]>([]);
  const [loading, setLoading] = useState(true);
  const [channelsLoading, setChannelsLoading] = useState(true);
  const [updatingMemberId, setUpdatingMemberId] = useState<string | null>(null);
  const [updatingChannelId, setUpdatingChannelId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showDetails, setShowDetails] = useState<string | null>(null);
  const [selectedMemberId, setSelectedMemberId] = useState<string>("");
  const [newChannelTitle, setNewChannelTitle] = useState("");
  const [newChannelDescription, setNewChannelDescription] = useState("");
  const [newChannelVisibility, setNewChannelVisibility] = useState<"PUBLIC" | "PRIVATE">("PUBLIC");

  const canManage = userRole === "OWNER" || userRole === "OFFICER" || userRole === "COMMANDER";
  const selfMember = members.find((member) => member.userId === userId) || null;
  const canManageChannels = userRole === "OWNER" || selfMember?.appPrivileges?.manageChannels === true;

  const basePath = `/api/organizations/${organizationId}/members/privileges`;
  const channelsPath = `/api/organizations/${organizationId}/social-channels`;

  const [filterRole, setFilterRole] = useState<OrganizationMemberRole | "ALL">("ALL");
  const [searchTerm, setSearchTerm] = useState("");

  const loadMembers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(basePath, { cache: "no-store" });
      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as ApiErrorPayload | null;
        throw new Error(getApiErrorMessage(payload, "Failed to load members."));
      }
      const data = (await response.json()) as Member[];
      setMembers(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load members.");
    } finally {
      setLoading(false);
    }
  }, [basePath]);

  const loadChannels = useCallback(async () => {
    try {
      setChannelsLoading(true);
      const response = await fetch(channelsPath, { cache: "no-store" });
      if (!response.ok) {
        setChannels([]);
        return;
      }
      const data = (await response.json()) as Channel[];
      setChannels(data);
    } finally {
      setChannelsLoading(false);
    }
  }, [channelsPath]);

  const handleRoleChange = async (memberId: string, newRole: string) => {
    try {
      setUpdatingMemberId(memberId);
      setError(null);
      setSuccess(null);

      const response = await fetch(basePath, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ memberId, newRole }),
      });
      const payload = (await response.json()) as { success: boolean; message: string } | ApiErrorPayload;

      if (!response.ok) {
        throw new Error(getApiErrorMessage(payload as ApiErrorPayload, "Failed to update member role"));
      }

      const result = payload as { success: boolean; message: string };
      setSuccess(result.message);
      setMembers((prev) =>
        prev.map((m) => (m.memberId === memberId ? { ...m, currentRole: newRole as OrganizationMemberRole } : m))
      );
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update member role");
    } finally {
      setUpdatingMemberId(null);
    }
  };

  const handlePrivilegeToggle = async (
    memberId: string,
    privilege: AppPrivilegeAction,
    nextValue: boolean
  ) => {
    try {
      setUpdatingMemberId(memberId);
      setError(null);
      setSuccess(null);

      const response = await fetch(basePath, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          memberId,
          appPrivileges: {
            [privilege]: nextValue,
          },
        }),
      });

      const payload = (await response.json()) as { success: boolean; message: string } | ApiErrorPayload;
      if (!response.ok) {
        throw new Error(getApiErrorMessage(payload as ApiErrorPayload, "Failed to update member privilege"));
      }

      setMembers((prev) =>
        prev.map((member) =>
          member.memberId === memberId
            ? {
                ...member,
                appPrivileges: {
                  ...member.appPrivileges,
                  [privilege]: nextValue,
                },
              }
            : member
        )
      );

      setSuccess((payload as { success: boolean; message: string }).message);
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update member privilege");
    } finally {
      setUpdatingMemberId(null);
    }
  };

  const handleRemoveMember = async (memberId: string, memberName: string) => {
    if (!confirm(`Are you sure you want to remove ${memberName} from the organization?`)) {
      return;
    }

    try {
      setUpdatingMemberId(memberId);
      setError(null);
      setSuccess(null);

      const response = await fetch(basePath, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ memberId }),
      });
      const payload = (await response.json()) as { success: boolean; message: string } | ApiErrorPayload;

      if (!response.ok) {
        throw new Error(getApiErrorMessage(payload as ApiErrorPayload, "Failed to remove member"));
      }

      const result = payload as { success: boolean; message: string };
      setSuccess(result.message);
      setMembers((prev) => prev.filter((m) => m.memberId !== memberId));
      if (selectedMemberId === memberId) {
        setSelectedMemberId("");
        setShowDetails(null);
      }
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to remove member");
    } finally {
      setUpdatingMemberId(null);
    }
  };

  const handleChannelVisibilityChange = async (conversationId: string, visibility: "PUBLIC" | "PRIVATE") => {
    try {
      setUpdatingChannelId(conversationId);
      setError(null);
      const response = await fetch(channelsPath, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ conversationId, visibility }),
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as ApiErrorPayload | null;
        throw new Error(getApiErrorMessage(payload, "Failed to update channel visibility"));
      }

      setChannels((prev) => prev.map((ch) => (ch.id === conversationId ? { ...ch, visibility } : ch)));
      setSuccess("Channel visibility updated.");
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update channel visibility");
    } finally {
      setUpdatingChannelId(null);
    }
  };

  const handleCreateChannel = async () => {
    if (!newChannelTitle.trim()) return;

    try {
      setError(null);
      const response = await fetch(channelsPath, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: newChannelTitle,
          description: newChannelDescription,
          visibility: newChannelVisibility,
        }),
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as ApiErrorPayload | null;
        throw new Error(getApiErrorMessage(payload, "Failed to create channel"));
      }

      await loadChannels();
      setNewChannelTitle("");
      setNewChannelDescription("");
      setNewChannelVisibility("PUBLIC");
      setSuccess("Channel created successfully.");
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create channel");
    }
  };

  useEffect(() => {
    if (!canManage) {
      return;
    }

    const timer = setTimeout(() => {
      void loadMembers();
      void loadChannels();
    }, 0);

    return () => clearTimeout(timer);
  }, [canManage, loadChannels, loadMembers]);

  const selectedMember = members.find((member) => member.memberId === selectedMemberId) || members[0] || null;
  const selectedMemberIdValue = selectedMember?.memberId || "";

  // Filter members based on role and search term
  const filteredMembers = members.filter((member) => {
    if (filterRole !== "ALL" && member.currentRole !== filterRole) return false;
    if (searchTerm && !member.userName.toLowerCase().includes(searchTerm.toLowerCase()) && 
        !member.userEmail?.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    return true;
  });

  if (!canManage) {
    return (
      <Card className="border-cyan-500/20 bg-slate-900/50">
        <CardContent className="p-6">
          <p className="text-sm text-slate-400">
            Only Commanders, Captains, and Fleet Admirals can manage member privileges. Your current role: <strong>{userRole ? getMilitaryRankLabel(userRole) : "None"}</strong>
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {error ? (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-3">
          <p className="text-sm text-red-300">{error}</p>
        </div>
      ) : null}

      {success ? (
        <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3">
          <p className="text-sm text-emerald-300">{success}</p>
        </div>
      ) : null}

      {/* Grant Privileges Section */}
      <Card className="border-cyan-500/20 bg-slate-900/50">
        <CardHeader>
          <CardTitle className="text-cyan-100">Grant Member Privileges</CardTitle>
          <p className="mt-1 text-xs text-slate-400">
            Check boxes to grant specific access permissions to members. These override their role-based permissions.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {loading ? (
            <p className="text-sm text-slate-400">Loading members...</p>
          ) : !members.length ? (
            <p className="text-sm text-slate-400">No members found in organization.</p>
          ) : (
            <>
              {/* Filters */}
              <div className="flex flex-col gap-3 md:flex-row md:items-center">
                <input
                  type="text"
                  placeholder="Search members..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="flex-1 rounded-md border border-cyan-500/30 bg-slate-950 px-3 py-2 text-sm text-cyan-100 placeholder-slate-500"
                />
                <select
                  value={filterRole}
                  onChange={(e) => setFilterRole(e.target.value as OrganizationMemberRole | "ALL")}
                  className="rounded-md border border-cyan-500/30 bg-slate-950 px-3 py-2 text-sm text-cyan-100"
                >
                  <option value="ALL">All Roles</option>
                  {ROLE_OPTIONS.map((role) => (
                    <option key={role} value={role}>
                      {getMilitaryRankLabel(role)}
                    </option>
                  ))}
                </select>
              </div>

              {/* Privilege Categories */}
              <div className="space-y-4">
                {Object.entries(PRIVILEGE_CATEGORIES).map(([category, privileges]) => (
                  <div key={category} className="rounded-lg border border-cyan-500/20 bg-slate-800/30 p-4">
                    <h3 className="mb-3 text-sm font-semibold text-cyan-100">{category}</h3>
                    <div className="space-y-3">
                      {privileges.map((privilege) => (
                        <div key={privilege} className="space-y-2">
                          <p className="text-xs font-medium text-slate-300">{APP_PRIVILEGE_LABELS[privilege]}</p>
                          <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-3">
                            {filteredMembers.map((member) => {
                              const isChecked = member.appPrivileges?.[privilege] === true;
                              return (
                                <div key={`${member.memberId}-${privilege}`} className="flex items-center gap-2">
                                  <Checkbox
                                    id={`${member.memberId}-${privilege}`}
                                    checked={isChecked}
                                    onCheckedChange={(checked) =>
                                      void handlePrivilegeToggle(member.memberId, privilege, checked === true)
                                    }
                                    disabled={updatingMemberId === member.memberId}
                                    className="h-4 w-4"
                                  />
                                  <label
                                    htmlFor={`${member.memberId}-${privilege}`}
                                    className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer"
                                  >
                                    <span>{member.userName}</span>
                                    <Badge className={`border text-[10px] py-0 px-1 ${ROLE_COLORS[member.currentRole]}`}>
                                      {getMilitaryRankLabel(member.currentRole)}
                                    </Badge>
                                  </label>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {!filteredMembers.length && (searchTerm || filterRole !== "ALL") ? (
                <p className="text-sm text-slate-400">No members match your filters.</p>
              ) : null}

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => void loadMembers()}
                  disabled={loading}
                  className="text-xs"
                >
                  Refresh
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Traditional Member Management Section */}
      <Card className="border-cyan-500/20 bg-slate-900/50">
        <CardHeader>
          <CardTitle className="text-cyan-100">Member Roles & Details</CardTitle>
          <p className="mt-1 text-sm text-slate-400">Manage member roles and view detailed information.</p>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-3">
            {!loading && members.length ? (
              <div className="space-y-3">
                <div className="rounded-md border border-cyan-500/20 bg-slate-900/50 p-3">
                  <label htmlFor="member-privilege-dropdown" className="mb-2 block text-xs uppercase tracking-wide text-cyan-200">
                    Select member
                  </label>
                  <select
                    id="member-privilege-dropdown"
                    value={selectedMemberIdValue}
                    onChange={(event) => {
                      setSelectedMemberId(event.target.value);
                      setShowDetails(null);
                    }}
                    className="w-full rounded-md border border-cyan-500/30 bg-slate-950 px-3 py-2 text-sm text-cyan-100"
                  >
                    {members.map((member) => (
                      <option key={member.memberId} value={member.memberId}>
                        {member.userName} - {getMilitaryRankLabel(member.currentRole)}
                      </option>
                    ))}
                  </select>
                </div>

                {selectedMember ? (
                  <div className="rounded-lg border border-cyan-500/20 bg-slate-800/50 p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 space-y-1">
                        <p className="font-medium text-cyan-100">
                          {selectedMember.userName}
                          {selectedMember.userId === userId ? (
                            <Badge variant="outline" className="ml-2 bg-cyan-500/20">
                              You
                            </Badge>
                          ) : null}
                        </p>
                        <p className="text-xs text-slate-400">{selectedMember.userEmail}</p>
                        {selectedMember.starCitizenHandle ? <p className="text-xs text-slate-500">Handle: {selectedMember.starCitizenHandle}</p> : null}
                        <p className="text-xs text-slate-500">Joined {new Date(selectedMember.joinedAt).toLocaleDateString()}</p>
                      </div>

                      <div className="flex items-center gap-2">
                        <Badge className={`border ${ROLE_COLORS[selectedMember.currentRole]}`}>{getMilitaryRankLabel(selectedMember.currentRole)}</Badge>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setShowDetails(showDetails === selectedMember.memberId ? null : selectedMember.memberId)}
                          className="text-xs text-slate-400 hover:text-slate-300"
                        >
                          {showDetails === selectedMember.memberId ? "Hide" : "Info"}
                        </Button>
                      </div>
                    </div>

                    {showDetails === selectedMember.memberId ? (
                      <div className="mt-3 border-t border-slate-700 pt-3">
                        <p className="mb-2 text-xs font-semibold text-slate-300">Current Role Permissions:</p>
                        <ul className="space-y-1 text-xs text-slate-400">
                          {getRolePermissionDetails(selectedMember.currentRole).permissions.map((perm) => (
                            <li key={perm} className="flex items-start gap-2">
                              <span>•</span>
                              <span>{perm}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ) : null}

                    <div className="mt-3 flex gap-2">
                      <Select
                        value={selectedMember.currentRole}
                        onValueChange={(newRole) => {
                          if (!newRole) return;
                          void handleRoleChange(selectedMember.memberId, newRole);
                        }}
                        disabled={updatingMemberId === selectedMember.memberId}
                      >
                        <SelectTrigger className="h-8 flex-1 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {ROLE_OPTIONS.map((role) => (
                            <SelectItem key={role} value={role}>
                              {getMilitaryRankLabel(role)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>

                      {selectedMember.userId !== userId ? (
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => void handleRemoveMember(selectedMember.memberId, selectedMember.userName)}
                          disabled={updatingMemberId === selectedMember.memberId}
                          className="h-8 text-xs"
                        >
                          Remove
                        </Button>
                      ) : null}
                    </div>
                  </div>
                ) : null}
              </div>
            ) : null}
          </div>
        </CardContent>
      </Card>

      {/* Chat Channels Section */}
      <Card className="border-orange-500/20 bg-slate-900/50">
        <CardHeader>
          <CardTitle className="text-orange-100">Organization Chat Channels</CardTitle>
          <p className="mt-1 text-xs text-slate-400">
            Create and manage chat channels. Owners can control channel visibility (PUBLIC or PRIVATE).
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            {channelsLoading ? (
              <p className="text-xs text-slate-400">Loading channels...</p>
            ) : !channels.length ? (
              <p className="text-xs text-slate-500">No channels found.</p>
            ) : (
              channels.map((channel) => (
                <div key={channel.id} className="rounded-md border border-orange-500/20 bg-slate-900/60 p-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <p className="text-sm font-medium text-slate-100">{channel.title}</p>
                      {channel.description ? <p className="mt-1 text-xs text-slate-400">{channel.description}</p> : null}
                    </div>

                    {canManageChannels ? (
                      <Select
                        value={channel.visibility}
                        onValueChange={(next) =>
                          void handleChannelVisibilityChange(channel.id, next as "PUBLIC" | "PRIVATE")
                        }
                        disabled={updatingChannelId === channel.id}
                      >
                        <SelectTrigger className="h-8 w-[140px] text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="PUBLIC">PUBLIC</SelectItem>
                          <SelectItem value="PRIVATE">PRIVATE</SelectItem>
                        </SelectContent>
                      </Select>
                    ) : (
                      <Badge className="border border-slate-600 bg-slate-800 text-slate-200">{channel.visibility}</Badge>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>

          {canManageChannels ? (
            <div className="mt-4 grid gap-2 rounded-md border border-orange-500/20 bg-slate-950/60 p-3 md:grid-cols-4">
              <input
                value={newChannelTitle}
                onChange={(event) => setNewChannelTitle(event.target.value)}
                placeholder="New channel title"
                maxLength={80}
                className="rounded-md border border-orange-500/30 bg-slate-900 px-3 py-2 text-sm text-slate-100 md:col-span-2"
              />
              <input
                value={newChannelDescription}
                onChange={(event) => setNewChannelDescription(event.target.value)}
                placeholder="Description (optional)"
                maxLength={280}
                className="rounded-md border border-orange-500/30 bg-slate-900 px-3 py-2 text-sm text-slate-100"
              />
              <Select
                value={newChannelVisibility}
                onValueChange={(next) => setNewChannelVisibility(next as "PUBLIC" | "PRIVATE")}
              >
                <SelectTrigger className="h-10 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PUBLIC">PUBLIC</SelectItem>
                  <SelectItem value="PRIVATE">PRIVATE</SelectItem>
                </SelectContent>
              </Select>
              <Button type="button" onClick={() => void handleCreateChannel()} className="md:col-span-4 md:justify-self-start">
                Create Channel
              </Button>
            </div>
          ) : (
            <p className="mt-3 text-xs text-slate-500">Only organization owners can change channel visibility.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
