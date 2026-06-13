"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
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

type PrivilegeAuditEntry = {
  id: string;
  type: "organization_member_privilege_updated" | "organization_member_role_updated";
  title: string;
  body: string | null;
  createdAt: string;
  targetUserId: string | null;
  targetUserName: string | null;
  targetUserEmail: string | null;
};

type AuditTypeFilter = "ALL" | "PERMISSIONS" | "ROLES";

type LocalToast = {
  id: string;
  message: string;
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

type PrivilegeScope = "view" | "do";

const APP_PRIVILEGE_SCOPES: Record<AppPrivilegeAction, PrivilegeScope> = {
  editOrganization: "do",
  inviteMembers: "do",
  createOperation: "do",
  editOperation: "do",
  assignRoles: "do",
  inviteOrganizations: "do",
  viewPrivateOperations: "view",
  postAfterActionReports: "do",
  manageChannels: "do",
};

const PRIVILEGE_PRESETS = {
  READ_ONLY: "Read Only",
  TEAM_LEAD: "Team Lead",
  FULL_CONTROL: "Full Control",
} as const;

type PrivilegePreset = keyof typeof PRIVILEGE_PRESETS;

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
  const [auditEntries, setAuditEntries] = useState<PrivilegeAuditEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [channelsLoading, setChannelsLoading] = useState(true);
  const [auditLoading, setAuditLoading] = useState(true);
  const [updatingMemberId, setUpdatingMemberId] = useState<string | null>(null);
  const [updatingChannelId, setUpdatingChannelId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [toasts, setToasts] = useState<LocalToast[]>([]);
  const [showDetails, setShowDetails] = useState<string | null>(null);
  const [selectedMemberId, setSelectedMemberId] = useState<string>("");
  const [categoryMemberSelections, setCategoryMemberSelections] = useState<Partial<Record<string, string>>>({});
  const [newChannelTitle, setNewChannelTitle] = useState("");
  const [newChannelDescription, setNewChannelDescription] = useState("");
  const [newChannelVisibility, setNewChannelVisibility] = useState<"PUBLIC" | "PRIVATE">("PUBLIC");
  const [auditTypeFilter, setAuditTypeFilter] = useState<AuditTypeFilter>("ALL");
  const [auditMemberFilter, setAuditMemberFilter] = useState<string>("ALL");

  const canManage = userRole === "OWNER" || userRole === "OFFICER" || userRole === "COMMANDER";
  const selfMember = members.find((member) => member.userId === userId) || null;
  const canManageChannels = userRole === "OWNER" || selfMember?.appPrivileges?.manageChannels === true;

  const basePath = `/api/organizations/${organizationId}/members/privileges`;
  const auditPath = `/api/organizations/${organizationId}/members/privileges/audit`;
  const channelsPath = `/api/organizations/${organizationId}/social-channels`;

  const pushToast = useCallback((message: string) => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    setToasts((prev) => [...prev, { id, message }]);

    setTimeout(() => {
      setToasts((prev) => prev.filter((toast) => toast.id !== id));
    }, 3500);
  }, []);

  useEffect(() => {
    if (!members.length) {
      setCategoryMemberSelections({});
      return;
    }

    setCategoryMemberSelections((prev) => {
      const nextSelections: Partial<Record<string, string>> = { ...prev };

      for (const category of Object.keys(PRIVILEGE_CATEGORIES)) {
        const selectedId = prev[category];
        const stillExists = selectedId ? members.some((member) => member.memberId === selectedId) : false;

        if (!stillExists) {
          nextSelections[category] = members[0].memberId;
        }
      }

      return nextSelections;
    });
  }, [members]);

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

  const loadAudit = useCallback(async () => {
    try {
      setAuditLoading(true);
      const response = await fetch(`${auditPath}?take=12`, { cache: "no-store" });
      if (!response.ok) {
        setAuditEntries([]);
        return;
      }

      const data = (await response.json()) as PrivilegeAuditEntry[];
      setAuditEntries(data);
    } finally {
      setAuditLoading(false);
    }
  }, [auditPath]);

  const applyPresetToPrivilege = (preset: PrivilegePreset, privilege: AppPrivilegeAction) => {
    if (preset === "FULL_CONTROL") {
      return true;
    }

    if (preset === "READ_ONLY") {
      return APP_PRIVILEGE_SCOPES[privilege] === "view";
    }

    if (APP_PRIVILEGE_SCOPES[privilege] === "view") {
      return true;
    }

    return privilege === "createOperation" || privilege === "editOperation" || privilege === "postAfterActionReports";
  };

  const auditMemberOptions = useMemo(() => {
    const options = new Map<string, string>();

    for (const member of members) {
      options.set(member.userId, member.userName);
    }

    for (const entry of auditEntries) {
      if (!entry.targetUserId) continue;
      if (options.has(entry.targetUserId)) continue;
      options.set(entry.targetUserId, entry.targetUserName || entry.targetUserEmail || "Unknown member");
    }

    return Array.from(options.entries()).map(([value, label]) => ({ value, label }));
  }, [auditEntries, members]);

  const filteredAuditEntries = useMemo(() => {
    return auditEntries.filter((entry) => {
      if (auditTypeFilter === "PERMISSIONS" && entry.type !== "organization_member_privilege_updated") {
        return false;
      }
      if (auditTypeFilter === "ROLES" && entry.type !== "organization_member_role_updated") {
        return false;
      }
      if (auditMemberFilter !== "ALL" && entry.targetUserId !== auditMemberFilter) {
        return false;
      }
      return true;
    });
  }, [auditEntries, auditMemberFilter, auditTypeFilter]);

  const handleExportAuditCsv = () => {
    if (!filteredAuditEntries.length) {
      pushToast("No audit entries to export with the current filters.");
      return;
    }

    const escapeCsv = (value: string) => `"${value.replace(/"/g, '""')}"`;
    const rows = [
      ["timestamp", "changeType", "targetMember", "title", "details"],
      ...filteredAuditEntries.map((entry) => [
        new Date(entry.createdAt).toISOString(),
        entry.type === "organization_member_privilege_updated" ? "permission" : "role",
        entry.targetUserName || entry.targetUserEmail || "Unknown",
        entry.title,
        entry.body || "",
      ]),
    ];

    const csv = `${rows.map((row) => row.map((cell) => escapeCsv(String(cell))).join(",")).join("\n")}\n`;
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.setAttribute("download", `privilege-audit-${organizationId}-${Date.now()}.csv`);
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    URL.revokeObjectURL(url);
    pushToast(`Exported ${filteredAuditEntries.length} audit entries to CSV.`);
  };

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
      void loadAudit();
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
    const member = members.find((m) => m.memberId === memberId);
    if (!member) return;

    if (member.appPrivileges?.[privilege] === nextValue) {
      return;
    }

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

      pushToast(
        `${member.userName}: ${APP_PRIVILEGE_LABELS[privilege]} set to ${nextValue ? "allowed" : "denied"}.`
      );
      void loadAudit();

      setSuccess((payload as { success: boolean; message: string }).message);
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update member privilege");
    } finally {
      setUpdatingMemberId(null);
    }
  };

  const handleCategoryPreset = async (
    category: string,
    privileges: AppPrivilegeAction[],
    preset: PrivilegePreset
  ) => {
    const selectedId = categoryMemberSelections[category] || members[0]?.memberId;
    const selectedCategoryMember = members.find((member) => member.memberId === selectedId) || null;
    if (!selectedCategoryMember) return;

    const appPrivileges = Object.fromEntries(
      privileges.map((privilege) => [privilege, applyPresetToPrivilege(preset, privilege)])
    ) as Partial<Record<AppPrivilegeAction, boolean>>;

    const changed = privileges.filter(
      (privilege) => selectedCategoryMember.appPrivileges?.[privilege] !== appPrivileges[privilege]
    );

    if (!changed.length) {
      pushToast(`${selectedCategoryMember.userName}: ${PRIVILEGE_PRESETS[preset]} already applied for ${category}.`);
      return;
    }

    try {
      setUpdatingMemberId(selectedCategoryMember.memberId);
      setError(null);
      setSuccess(null);

      const response = await fetch(basePath, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          memberId: selectedCategoryMember.memberId,
          appPrivileges,
        }),
      });

      const payload = (await response.json()) as { success: boolean; message: string } | ApiErrorPayload;
      if (!response.ok) {
        throw new Error(getApiErrorMessage(payload as ApiErrorPayload, "Failed to apply privilege preset"));
      }

      setMembers((prev) =>
        prev.map((member) =>
          member.memberId === selectedCategoryMember.memberId
            ? {
                ...member,
                appPrivileges: {
                  ...member.appPrivileges,
                  ...appPrivileges,
                },
              }
            : member
        )
      );

      for (const privilege of changed) {
        const value = appPrivileges[privilege] === true;
        pushToast(
          `${selectedCategoryMember.userName}: ${APP_PRIVILEGE_LABELS[privilege]} set to ${value ? "allowed" : "denied"}.`
        );
      }
      void loadAudit();

      setSuccess((payload as { success: boolean; message: string }).message);
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to apply privilege preset");
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
      void loadAudit();
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
      void loadAudit();
    }, 0);

    return () => clearTimeout(timer);
  }, [canManage, loadAudit, loadChannels, loadMembers]);

  const selectedMember = members.find((member) => member.memberId === selectedMemberId) || members[0] || null;
  const selectedMemberIdValue = selectedMember?.memberId || "";

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
      {toasts.length ? (
        <div className="fixed right-4 top-4 z-50 flex w-[340px] flex-col gap-2">
          {toasts.map((toast) => (
            <div key={toast.id} className="rounded-md border border-cyan-500/30 bg-slate-950/95 px-3 py-2 text-xs text-cyan-100 shadow-lg">
              {toast.message}
            </div>
          ))}
        </div>
      ) : null}

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
              {/* Privilege Categories */}
              <div className="space-y-4">
                {Object.entries(PRIVILEGE_CATEGORIES).map(([category, privileges]) => (
                  <div key={category} className="rounded-lg border border-cyan-500/20 bg-slate-800/30 p-4">
                    <div className="mb-3 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                      <h3 className="text-sm font-semibold text-cyan-100">{category}</h3>
                      <div className="w-full space-y-2 md:w-[460px]">
                        <div>
                          <label className="mb-1 block text-[11px] uppercase tracking-wide text-cyan-200">Select member</label>
                          <select
                            value={categoryMemberSelections[category] || ""}
                            onChange={(event) =>
                              setCategoryMemberSelections((prev) => ({
                                ...prev,
                                [category]: event.target.value,
                              }))
                            }
                            className="w-full rounded-md border border-cyan-500/30 bg-slate-950 px-3 py-2 text-sm text-cyan-100"
                          >
                            {members.map((member) => (
                              <option key={`${category}-${member.memberId}`} value={member.memberId}>
                                {member.userName} - {getMilitaryRankLabel(member.currentRole)}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {Object.entries(PRIVILEGE_PRESETS).map(([presetKey, label]) => (
                            <Button
                              key={`${category}-${presetKey}`}
                              variant="outline"
                              size="sm"
                              onClick={() =>
                                void handleCategoryPreset(category, privileges, presetKey as PrivilegePreset)
                              }
                              disabled={
                                updatingMemberId ===
                                (categoryMemberSelections[category] || members[0]?.memberId || "")
                              }
                              className="h-7 text-[11px]"
                            >
                              {label}
                            </Button>
                          ))}
                        </div>
                      </div>
                    </div>

                    {(() => {
                      const selectedId = categoryMemberSelections[category] || members[0]?.memberId;
                      const selectedCategoryMember = members.find((member) => member.memberId === selectedId) || null;

                      if (!selectedCategoryMember) {
                        return <p className="text-xs text-slate-400">Select a member to edit category privileges.</p>;
                      }

                      return (
                        <div className="space-y-2">
                          {privileges.map((privilege) => {
                            const isChecked = selectedCategoryMember.appPrivileges?.[privilege] === true;
                            const scope = APP_PRIVILEGE_SCOPES[privilege];

                            return (
                              <div
                                key={`${category}-${selectedCategoryMember.memberId}-${privilege}`}
                                className="flex items-center justify-between rounded-md border border-slate-700/60 bg-slate-900/60 px-3 py-2"
                              >
                                <div className="pr-3">
                                  <p className="text-xs font-medium text-slate-200">{APP_PRIVILEGE_LABELS[privilege]}</p>
                                  <p className="text-[11px] text-slate-400">
                                    {scope === "view" ? "Can view" : "Can do/manage"}
                                  </p>
                                </div>
                                <div className="flex items-center gap-3">
                                  <Badge
                                    className={`border px-1 py-0 text-[10px] ${
                                      scope === "view"
                                        ? "border-blue-500/30 bg-blue-500/10 text-blue-200"
                                        : "border-emerald-500/30 bg-emerald-500/10 text-emerald-200"
                                    }`}
                                  >
                                    {scope === "view" ? "View" : "Do"}
                                  </Badge>
                                  <Checkbox
                                    id={`${category}-${selectedCategoryMember.memberId}-${privilege}`}
                                    checked={isChecked}
                                    onCheckedChange={(checked) =>
                                      void handlePrivilegeToggle(
                                        selectedCategoryMember.memberId,
                                        privilege,
                                        checked === true
                                      )
                                    }
                                    disabled={updatingMemberId === selectedCategoryMember.memberId}
                                    className="h-4 w-4"
                                  />
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      );
                    })()}
                  </div>
                ))}
              </div>

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

      <Card className="border-indigo-500/20 bg-slate-900/50">
        <CardHeader>
          <CardTitle className="text-indigo-100">Recent Privilege Changes</CardTitle>
          <p className="mt-1 text-xs text-slate-400">Latest role and permission updates across this organization.</p>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid gap-2 md:grid-cols-3">
            <div>
              <label className="mb-1 block text-[11px] uppercase tracking-wide text-indigo-200">Change type</label>
              <select
                value={auditTypeFilter}
                onChange={(event) => setAuditTypeFilter(event.target.value as AuditTypeFilter)}
                className="w-full rounded-md border border-indigo-500/30 bg-slate-950 px-3 py-2 text-xs text-indigo-100"
              >
                <option value="ALL">All changes</option>
                <option value="PERMISSIONS">Permissions only</option>
                <option value="ROLES">Role changes only</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-[11px] uppercase tracking-wide text-indigo-200">Member</label>
              <select
                value={auditMemberFilter}
                onChange={(event) => setAuditMemberFilter(event.target.value)}
                className="w-full rounded-md border border-indigo-500/30 bg-slate-950 px-3 py-2 text-xs text-indigo-100"
              >
                <option value="ALL">All members</option>
                {auditMemberOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-end gap-2">
              <Button variant="outline" size="sm" onClick={() => void loadAudit()} disabled={auditLoading} className="text-xs">
                Refresh Audit
              </Button>
              <Button variant="outline" size="sm" onClick={handleExportAuditCsv} className="text-xs">
                Export CSV
              </Button>
            </div>
          </div>

          {auditLoading ? (
            <p className="text-xs text-slate-400">Loading recent changes...</p>
          ) : !filteredAuditEntries.length ? (
            <p className="text-xs text-slate-500">No privilege changes match the selected filters.</p>
          ) : (
            filteredAuditEntries.map((entry) => (
              <div key={entry.id} className="rounded-md border border-indigo-500/20 bg-slate-950/60 p-3">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-medium text-indigo-100">{entry.title}</p>
                  <Badge className="border border-indigo-500/30 bg-indigo-500/10 text-[10px] text-indigo-200">
                    {entry.type === "organization_member_privilege_updated" ? "Permission" : "Role"}
                  </Badge>
                </div>
                {entry.body ? <p className="mt-1 text-xs text-slate-300">{entry.body}</p> : null}
                <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px] text-slate-500">
                  <span>{new Date(entry.createdAt).toLocaleString()}</span>
                  {entry.targetUserName || entry.targetUserEmail ? (
                    <span>
                      Target: {entry.targetUserName || entry.targetUserEmail}
                    </span>
                  ) : null}
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
