"use client";

import Link from "next/link";
import { useCallback, useDeferredValue, useEffect, useMemo, useState } from "react";
import type { JSX } from "react";
import { LiveChat, type ChatMember } from "@/components/social/live-chat";

type UsageBadge = {
  key: string;
  label: string;
  tone: "cyan" | "amber" | "emerald" | "rose";
  hint: string;
};

type Sender = {
  id: string;
  name: string | null;
  email: string | null;
  starCitizenHandle: string | null;
};

type ChatMessage = {
  id: string;
  body: string;
  createdAt: string;
  sender: Sender;
  reactionSummary: Record<string, number>;
  myReactions: string[];
};

type ConversationGroup = {
  id: string;
  name: string;
  position: number;
  organizationId: string;
};

type PollOption = {
  id: string;
  text: string;
  position: number;
  voteCount: number;
  myVote: boolean;
};

type Poll = {
  id: string;
  question: string;
  isMultiVote: boolean;
  endsAt: string | null;
  createdAt: string;
  createdBy: Sender;
  options: PollOption[];
  totalVotes: number;
  isClosed: boolean;
};

type ConversationItem = {
  id: string;
  title: string;
  description: string | null;
  visibility: "PUBLIC" | "PRIVATE";
  isChannel: boolean;
  isArchived?: boolean;
  canManage?: boolean;
  unreadCount: number;
  group: { id: string; name: string; position: number } | null;
  organization: { id: string; name: string; tag: string } | null;
  participants: Array<{ user: Sender }>;
  messages: Array<{ id: string; body: string; createdAt: string }>;
};

const EMOJI_PICKER_OPTIONS = [
  "👍","👎","❤️","🔥","🎉","😂","😮","😢","😡","🫡",
  "✅","❌","⚡","💥","👀","💬","🤝","🫶","🚀","💯",
  "🛡️","⚔️","🎯","📡","🔭","🌌","🛸","💎","🏆","⭐",
];

function EmojiPicker({ onPick, onClose }: { onPick: (emoji: string) => void; onClose: () => void }) {
  return (
    <div className="absolute bottom-8 left-0 z-30 w-56 rounded-lg border border-slate-700 bg-[#1e1f22] p-2 shadow-xl">
      <div className="grid grid-cols-6 gap-1">
        {EMOJI_PICKER_OPTIONS.map((emoji) => (
          <button
            key={emoji}
            type="button"
            onClick={() => { onPick(emoji); onClose(); }}
            className="rounded px-1 py-0.5 text-base hover:bg-slate-700"
          >
            {emoji}
          </button>
        ))}
      </div>
    </div>
  );
}

type ChannelAccessMember = {
  id: string;
  name: string | null;
  email: string | null;
  starCitizenHandle: string | null;
};

type SocialPerson = {
  id: string;
  name: string | null;
  email: string | null;
  starCitizenHandle: string | null;
  bio: string | null;
  isFollowing: boolean;
  _count: {
    followers: number;
    following: number;
  };
  badges: UsageBadge[];
};

type OnlineMember = {
  id: string;
  name: string | null;
  email: string | null;
  starCitizenHandle: string | null;
  badges: UsageBadge[];
};

type ChatWorkspaceProps = {
  currentUserId: string;
  initialConversationId: string | null;
  initialConversations: ConversationItem[];
  initialMessages: ChatMessage[];
  initialPeople: SocialPerson[];
  initialOnlineMembers: OnlineMember[];
  viewerBadges: UsageBadge[];
};

const BADGE_TONE_STYLES: Record<UsageBadge["tone"], string> = {
  cyan: "border-sky-300/35 bg-sky-400/15 text-sky-100",
  amber: "border-amber-300/35 bg-amber-400/15 text-amber-100",
  emerald: "border-emerald-300/35 bg-emerald-400/15 text-emerald-100",
  rose: "border-rose-300/35 bg-rose-400/15 text-rose-100",
};

function BadgeChip({ badge, compact = false }: { badge: UsageBadge; compact?: boolean }) {
  return (
    <span
      title={badge.hint}
      className={`inline-flex items-center rounded-full border px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] ${BADGE_TONE_STYLES[badge.tone]} ${compact ? "" : "shadow-[0_8px_24px_-16px_rgba(0,0,0,0.6)]"}`}
    >
      {badge.label}
    </span>
  );
}

function ReadStateBadge({ unreadCount, isSelected }: { unreadCount: number; isSelected: boolean }) {
  if (unreadCount > 0) {
    return (
      <span className="rounded-full border border-rose-300/35 bg-rose-400/20 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-rose-100">
        {unreadCount}
      </span>
    );
  }

  return (
    <span
      className={`h-2.5 w-2.5 rounded-full ${
        isSelected ? "bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.65)]" : "bg-slate-600"
      }`}
    />
  );
}

function getConversationLabel(conversation: ConversationItem, currentUserId: string) {
  if (conversation.isChannel) {
    return conversation.title;
  }

  const otherParticipant = conversation.participants.find(
    (participant) => participant.user.id !== currentUserId
  )?.user;

  return (
    otherParticipant?.starCitizenHandle ||
    otherParticipant?.name ||
    otherParticipant?.email ||
    conversation.title
  );
}

function getConversationMeta(conversation: ConversationItem) {
  if (conversation.isChannel && conversation.organization) {
    return `Org channel • ${conversation.organization.name} [${conversation.organization.tag}]`;
  }

  if (conversation.isChannel) {
    return `${conversation.visibility.toLowerCase()} global channel`;
  }

  return "Direct message";
}

function sortPeople(people: SocialPerson[]) {
  return [...people].sort((left, right) => {
    const leftName = left.starCitizenHandle || left.name || left.email || "";
    const rightName = right.starCitizenHandle || right.name || right.email || "";
    return leftName.localeCompare(rightName);
  });
}

function ChannelList({
  channels,
  selectedConversationId,
  unreadByConversation,
  groups,
  canManage,
  movingChannelId,
  onSelect,
  onMove,
}: {
  channels: ConversationItem[];
  selectedConversationId: string | null;
  unreadByConversation: Record<string, number>;
  groups: ConversationGroup[];
  canManage: boolean;
  movingChannelId: string | null;
  onSelect: (id: string) => void;
  onMove: (id: string, groupId: string | null) => void;
}) {
  if (!channels.length) return null;
  return (
    <div className="mt-1 space-y-0.5">
      {channels.map((conversation) => {
        const active = conversation.id === selectedConversationId;
        const moving = movingChannelId === conversation.id;
        return (
          <div key={conversation.id} className="group/ch flex items-center gap-1">
            <button
              type="button"
              onClick={() => onSelect(conversation.id)}
              className={`flex-1 rounded-md px-2 py-1.5 text-left text-sm transition ${active ? "bg-[#3f4248] text-slate-100" : "text-slate-400 hover:bg-[#313338] hover:text-slate-200"}`}
            >
              <div className="flex items-center justify-between gap-1">
                <span className="flex items-center gap-1 truncate">
                  <span className="text-slate-500">#</span>
                  <span className="truncate text-sm font-medium">{conversation.title}</span>
                </span>
                <ReadStateBadge unreadCount={unreadByConversation[conversation.id] || 0} isSelected={active} />
              </div>
            </button>
            {canManage ? (
              <select
                value={conversation.group?.id ?? ""}
                disabled={moving}
                onChange={(event) => onMove(conversation.id, event.target.value || null)}
                className="invisible w-0 overflow-hidden rounded bg-slate-700 text-[10px] text-slate-200 opacity-0 transition group-hover/ch:visible group-hover/ch:w-auto group-hover/ch:opacity-100"
                title="Move to category"
              >
                <option value="">Uncategorized</option>
                {groups.map((g) => (
                  <option key={g.id} value={g.id}>{g.name}</option>
                ))}
              </select>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}

export function ChatWorkspace({
  currentUserId,
  initialConversationId,
  initialConversations,
  initialMessages,
  initialPeople,
  initialOnlineMembers,
  viewerBadges,
}: ChatWorkspaceProps) {
  const [conversations, setConversations] = useState(initialConversations);
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(
    initialConversationId
  );
  const [messageCache, setMessageCache] = useState<Record<string, ChatMessage[]>>(
    initialConversationId ? { [initialConversationId]: initialMessages } : {}
  );
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [creatingDmFor, setCreatingDmFor] = useState<string | null>(null);
  const [channelDraftName, setChannelDraftName] = useState("");
  const [channelDraftVisibility, setChannelDraftVisibility] = useState<"PUBLIC" | "PRIVATE">("PUBLIC");
  const [channelDraftDescription, setChannelDraftDescription] = useState("");
  const [channelDraftOrgId, setChannelDraftOrgId] = useState<string>("");
  const [creatingChannel, setCreatingChannel] = useState(false);
  const [showCreateChannelForm, setShowCreateChannelForm] = useState(false);
  const [renamingChannel, setRenamingChannel] = useState(false);
  const [renameDraft, setRenameDraft] = useState("");
  const [editingChannelName, setEditingChannelName] = useState(false);
  const [archivingChannel, setArchivingChannel] = useState(false);
  const [deletingChannel, setDeletingChannel] = useState(false);
  const [showAccessEditor, setShowAccessEditor] = useState(false);
  const [accessMembers, setAccessMembers] = useState<ChannelAccessMember[]>([]);
  const [allowedUserIds, setAllowedUserIds] = useState<string[]>([]);
  const [loadingAccess, setLoadingAccess] = useState(false);
  const [savingAccess, setSavingAccess] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  // ── Group management ──────────────────────────────────────────────────────
  const [groups, setGroups] = useState<ConversationGroup[]>([]);
  const [editingGroupId, setEditingGroupId] = useState<string | null>(null);
  const [groupRenameDraft, setGroupRenameDraft] = useState("");
  const [showNewGroupForm, setShowNewGroupForm] = useState<string | null>(null); // orgId
  const [newGroupName, setNewGroupName] = useState("");
  const [savingGroup, setSavingGroup] = useState(false);
  const [movingChannelId, setMovingChannelId] = useState<string | null>(null);

  // ── Polls ─────────────────────────────────────────────────────────────────
  const [polls, setPolls] = useState<Poll[]>([]);
  const [showPolls, setShowPolls] = useState(false);
  const [showPollForm, setShowPollForm] = useState(false);
  const [pollQuestion, setPollQuestion] = useState("");
  const [pollOptions, setPollOptions] = useState(["", ""]);
  const [pollMultiVote, setPollMultiVote] = useState(false);
  const [creatingPoll, setCreatingPoll] = useState(false);
  const [conversationFilter, setConversationFilter] = useState("");
  const [onlineMembers, setOnlineMembers] = useState(initialOnlineMembers);
  const [unreadByConversation, setUnreadByConversation] = useState<Record<string, number>>(
    () =>
      Object.fromEntries(
        initialConversations.map((conversation) => [
          conversation.id,
          conversation.id === initialConversationId ? 0 : conversation.unreadCount,
        ])
      )
  );
  const deferredFilter = useDeferredValue(conversationFilter);

  const markConversationRead = useCallback((conversationId: string) => {
    setUnreadByConversation((current) => {
      if (!current[conversationId]) return current;
      return { ...current, [conversationId]: 0 };
    });
  }, []);

  const loadConversations = useCallback(async () => {
    const response = await fetch("/api/social/conversations", { cache: "no-store" });
    if (!response.ok) return;

    const payload = (await response.json()) as {
      conversations: ConversationItem[];
    };

    setUnreadByConversation(
      Object.fromEntries(
        payload.conversations.map((conversation) => [
          conversation.id,
          conversation.id === selectedConversationId ? 0 : conversation.unreadCount,
        ])
      )
    );

    setConversations(payload.conversations);
    setSelectedConversationId((current) => {
      if (current && payload.conversations.some((conversation) => conversation.id === current)) {
        return current;
      }

      return payload.conversations[0]?.id || null;
    });
  }, [selectedConversationId]);

  const loadMessages = useCallback(async (conversationId: string) => {
    setLoadingMessages(true);
    try {
      const response = await fetch(`/api/social/conversations/${conversationId}/messages`, {
        cache: "no-store",
      });
      if (!response.ok) return;

      const payload = (await response.json()) as { messages: ChatMessage[] };
      setMessageCache((current) => ({ ...current, [conversationId]: payload.messages }));
    } finally {
      setLoadingMessages(false);
    }
  }, []);

  const selectConversation = useCallback(
    (conversationId: string) => {
      setSelectedConversationId(conversationId);
      markConversationRead(conversationId);
      void loadMessages(conversationId);
    },
    [loadMessages, markConversationRead]
  );

  const loadOnlineMembers = useCallback(async () => {
    const response = await fetch("/api/social/online-members", { cache: "no-store" });
    if (!response.ok) return;

    const payload = (await response.json()) as { members: OnlineMember[] };
    setOnlineMembers(payload.members);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      void loadConversations();
      void loadOnlineMembers();
    }, 10000);

    return () => clearInterval(interval);
  }, [loadConversations, loadOnlineMembers]);

  useEffect(() => {
    if (!selectedConversationId) return;
    if (messageCache[selectedConversationId]) return;
    void loadMessages(selectedConversationId);
  }, [loadMessages, messageCache, selectedConversationId]);

  useEffect(() => {
    if (!selectedConversationId) return;
    markConversationRead(selectedConversationId);
  }, [markConversationRead, selectedConversationId]);

  useEffect(() => {
    if (!selectedConversationId) return;
    void loadConversations();
  }, [loadConversations, selectedConversationId]);

  const selectedConversation =
    conversations.find((conversation) => conversation.id === selectedConversationId) || null;

  const selectedMessages = selectedConversationId
    ? messageCache[selectedConversationId] || []
    : [];

  const selectedMembers: ChatMember[] = useMemo(() => {
    if (!selectedConversation || selectedConversation.isChannel) return [];

    return selectedConversation.participants.map((participant) => ({
      id: participant.user.id,
      name: participant.user.name,
      starCitizenHandle: participant.user.starCitizenHandle,
    }));
  }, [selectedConversation]);

  const filteredConversations = useMemo(() => {
    const query = deferredFilter.trim().toLowerCase();
    if (!query) return conversations;

    return conversations.filter((conversation) => {
      const label = getConversationLabel(conversation, currentUserId).toLowerCase();
      const description = (conversation.description || "").toLowerCase();
      const organizationName = conversation.organization
        ? `${conversation.organization.name} ${conversation.organization.tag}`.toLowerCase()
        : "";
      const latestMessage = (conversation.messages[0]?.body || "").toLowerCase();

      return [label, description, organizationName, latestMessage].some((value) =>
        value.includes(query)
      );
    });
  }, [conversations, currentUserId, deferredFilter]);

  const directMessages = filteredConversations.filter((conversation) => !conversation.isChannel);
  const organizationChannels = filteredConversations.filter(
    (conversation) => conversation.isChannel && conversation.organization
  );

  const manageableOrganizations = useMemo(() => {
    const orgs = new Map<string, { id: string; name: string; tag: string }>();
    for (const conversation of conversations) {
      if (!conversation.isChannel || !conversation.organization || !conversation.canManage) continue;
      orgs.set(conversation.organization.id, conversation.organization);
    }
    return [...orgs.values()];
  }, [conversations]);

  useEffect(() => {
    if (!manageableOrganizations.length) {
      setChannelDraftOrgId("");
      return;
    }

    setChannelDraftOrgId((current) =>
      current && manageableOrganizations.some((org) => org.id === current)
        ? current
        : manageableOrganizations[0].id
    );
  }, [manageableOrganizations]);

  const availablePeople = useMemo(() => sortPeople(initialPeople), [initialPeople]);
  const totalUnread = useMemo(
    () => Object.values(unreadByConversation).reduce((sum, value) => sum + value, 0),
    [unreadByConversation]
  );

  const startDirectMessage = useCallback(
    async (targetUserId: string) => {
      setCreatingDmFor(targetUserId);
      try {
        const response = await fetch("/api/social/conversations", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ targetUserId }),
        });

        if (!response.ok) return;

        const payload = (await response.json()) as { conversation: { id: string } };
        await loadConversations();
        setSelectedConversationId(payload.conversation.id);
        await loadMessages(payload.conversation.id);
      } finally {
        setCreatingDmFor(null);
      }
    },
    [loadConversations, loadMessages]
  );

  const createChannel = useCallback(async () => {
    if (!channelDraftOrgId || !channelDraftName.trim() || creatingChannel) return;

    setCreatingChannel(true);
    setActionError(null);
    try {
      const response = await fetch("/api/social/channels", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          organizationId: channelDraftOrgId,
          title: channelDraftName,
          description: channelDraftDescription,
          visibility: channelDraftVisibility,
        }),
      });

      const payload = (await response.json()) as { channel?: ConversationItem; error?: string };
      if (!response.ok || !payload.channel) {
        setActionError(payload.error || "Unable to create channel");
        return;
      }

      await loadConversations();
      setSelectedConversationId(payload.channel.id);
      setChannelDraftName("");
      setChannelDraftDescription("");
      setChannelDraftVisibility("PUBLIC");
      setShowCreateChannelForm(false);
      await loadMessages(payload.channel.id);
    } catch {
      setActionError("Unable to create channel");
    } finally {
      setCreatingChannel(false);
    }
  }, [channelDraftDescription, channelDraftName, channelDraftOrgId, channelDraftVisibility, creatingChannel, loadConversations, loadMessages]);

  const renameChannel = useCallback(async () => {
    if (!selectedConversation || !selectedConversation.isChannel || !selectedConversation.organization || !renameDraft.trim() || renamingChannel) {
      return;
    }

    setRenamingChannel(true);
    setActionError(null);
    try {
      const response = await fetch(`/api/social/channels/${selectedConversation.id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ title: renameDraft }),
      });

      const payload = (await response.json()) as { channel?: ConversationItem; error?: string };
      if (!response.ok) {
        setActionError(payload.error || "Unable to rename channel");
        return;
      }

      await loadConversations();
      setEditingChannelName(false);
      setRenameDraft("");
    } catch {
      setActionError("Unable to rename channel");
    } finally {
      setRenamingChannel(false);
    }
  }, [loadConversations, renameDraft, renamingChannel, selectedConversation]);

  const archiveChannel = useCallback(async () => {
    if (!selectedConversation || !selectedConversation.isChannel || !selectedConversation.organization || !selectedConversation.canManage || archivingChannel) {
      return;
    }

    setArchivingChannel(true);
    setActionError(null);
    try {
      const response = await fetch(`/api/social/channels/${selectedConversation.id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ isArchived: true }),
      });

      const payload = (await response.json()) as { error?: string };
      if (!response.ok) {
        setActionError(payload.error || "Unable to archive channel");
        return;
      }

      await loadConversations();
      setSelectedConversationId((current) => (current === selectedConversation.id ? null : current));
      setShowAccessEditor(false);
    } catch {
      setActionError("Unable to archive channel");
    } finally {
      setArchivingChannel(false);
    }
  }, [archivingChannel, loadConversations, selectedConversation]);

  const deleteChannel = useCallback(async () => {
    if (!selectedConversation || !selectedConversation.isChannel || !selectedConversation.organization || !selectedConversation.canManage || deletingChannel) {
      return;
    }

    if (!window.confirm(`Delete #${selectedConversation.title}? This cannot be undone.`)) {
      return;
    }

    setDeletingChannel(true);
    setActionError(null);
    try {
      const response = await fetch(`/api/social/channels/${selectedConversation.id}`, {
        method: "DELETE",
      });

      const payload = (await response.json()) as { error?: string };
      if (!response.ok) {
        setActionError(payload.error || "Unable to delete channel");
        return;
      }

      await loadConversations();
      setSelectedConversationId((current) => (current === selectedConversation.id ? null : current));
      setShowAccessEditor(false);
    } catch {
      setActionError("Unable to delete channel");
    } finally {
      setDeletingChannel(false);
    }
  }, [deletingChannel, loadConversations, selectedConversation]);

  const loadAccessSettings = useCallback(async () => {
    if (!selectedConversation || !selectedConversation.isChannel || !selectedConversation.organization || !selectedConversation.canManage) {
      return;
    }

    setLoadingAccess(true);
    setActionError(null);
    try {
      const response = await fetch(`/api/social/channels/${selectedConversation.id}/access`, {
        cache: "no-store",
      });

      const payload = (await response.json()) as {
        members?: ChannelAccessMember[];
        allowedUserIds?: string[];
        error?: string;
      };

      if (!response.ok) {
        setActionError(payload.error || "Unable to load channel access settings");
        return;
      }

      setAccessMembers(payload.members || []);
      setAllowedUserIds(payload.allowedUserIds || []);
    } catch {
      setActionError("Unable to load channel access settings");
    } finally {
      setLoadingAccess(false);
    }
  }, [selectedConversation]);

  const saveAccessSettings = useCallback(async () => {
    if (!selectedConversation || !selectedConversation.isChannel || !selectedConversation.organization || !selectedConversation.canManage || savingAccess) {
      return;
    }

    setSavingAccess(true);
    setActionError(null);
    try {
      const response = await fetch(`/api/social/channels/${selectedConversation.id}/access`, {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ allowedUserIds }),
      });

      const payload = (await response.json()) as { error?: string };
      if (!response.ok) {
        setActionError(payload.error || "Unable to save channel access settings");
        return;
      }

      await loadConversations();
    } catch {
      setActionError("Unable to save channel access settings");
    } finally {
      setSavingAccess(false);
    }
  }, [allowedUserIds, loadConversations, savingAccess, selectedConversation]);

  useEffect(() => {
    if (!showAccessEditor) return;
    void loadAccessSettings();
  }, [loadAccessSettings, showAccessEditor]);

  // ── Group handlers ─────────────────────────────────────────────────────────
  const loadGroups = useCallback(async (organizationId: string) => {
    const response = await fetch(`/api/social/groups?organizationId=${encodeURIComponent(organizationId)}`, { cache: "no-store" });
    if (!response.ok) return;
    const payload = (await response.json()) as { groups?: ConversationGroup[] };
    setGroups(payload.groups || []);
  }, []);

  const saveGroupRename = useCallback(async () => {
    if (!editingGroupId || !groupRenameDraft.trim() || savingGroup) return;
    setSavingGroup(true);
    try {
      const response = await fetch(`/api/social/groups/${editingGroupId}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ name: groupRenameDraft }),
      });
      if (!response.ok) { setActionError("Unable to rename group"); return; }
      setEditingGroupId(null);
      setGroupRenameDraft("");
      const orgId = groups.find((g) => g.id === editingGroupId)?.organizationId;
      if (orgId) await loadGroups(orgId);
      await loadConversations();
    } finally { setSavingGroup(false); }
  }, [editingGroupId, groupRenameDraft, groups, loadConversations, loadGroups, savingGroup]);

  const createGroup = useCallback(async (organizationId: string) => {
    if (!newGroupName.trim() || savingGroup) return;
    setSavingGroup(true);
    try {
      const response = await fetch("/api/social/groups", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ organizationId, name: newGroupName }),
      });
      const payload = (await response.json()) as { group?: ConversationGroup; error?: string };
      if (!response.ok) { setActionError(payload.error || "Unable to create group"); return; }
      setNewGroupName("");
      setShowNewGroupForm(null);
      await loadGroups(organizationId);
    } finally { setSavingGroup(false); }
  }, [loadGroups, newGroupName, savingGroup]);

  const deleteGroup = useCallback(async (groupId: string, organizationId: string) => {
    if (!window.confirm("Delete this group? Channels inside will be ungrouped.")) return;
    const response = await fetch(`/api/social/groups/${groupId}`, { method: "DELETE" });
    if (!response.ok) { setActionError("Unable to delete group"); return; }
    await loadGroups(organizationId);
    await loadConversations();
  }, [loadConversations, loadGroups]);

  const moveChannel = useCallback(async (conversationId: string, groupId: string | null) => {
    setMovingChannelId(conversationId);
    try {
      const response = await fetch(`/api/social/channels/${conversationId}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ groupId }),
      });
      if (!response.ok) { setActionError("Unable to move channel"); return; }
      await loadConversations();
    } finally { setMovingChannelId(null); }
  }, [loadConversations]);

  // ── Poll handlers ──────────────────────────────────────────────────────────
  const loadPolls = useCallback(async (conversationId: string) => {
    const response = await fetch(`/api/social/conversations/${conversationId}/polls`, { cache: "no-store" });
    if (!response.ok) return;
    const payload = (await response.json()) as { polls?: Poll[] };
    setPolls(payload.polls || []);
  }, []);

  const submitPoll = useCallback(async () => {
    if (!selectedConversationId || !pollQuestion.trim() || creatingPoll) return;
    const validOptions = pollOptions.filter((o) => o.trim());
    if (validOptions.length < 2) return;
    setCreatingPoll(true);
    try {
      const response = await fetch(`/api/social/conversations/${selectedConversationId}/polls`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ question: pollQuestion, options: validOptions, isMultiVote: pollMultiVote }),
      });
      if (!response.ok) { setActionError("Unable to create poll"); return; }
      setPollQuestion("");
      setPollOptions(["", ""]);
      setPollMultiVote(false);
      setShowPollForm(false);
      setShowPolls(true);
      await loadPolls(selectedConversationId);
    } finally { setCreatingPoll(false); }
  }, [creatingPoll, loadPolls, pollMultiVote, pollOptions, pollQuestion, selectedConversationId]);

  const voteOnOption = useCallback(async (pollOptionId: string) => {
    const response = await fetch(`/api/social/polls/${pollOptionId}`, { method: "POST" });
    if (!response.ok) return;
    if (selectedConversationId) await loadPolls(selectedConversationId);
  }, [loadPolls, selectedConversationId]);

  useEffect(() => {
    if (!showPolls || !selectedConversationId) return;
    void loadPolls(selectedConversationId);
  }, [loadPolls, selectedConversationId, showPolls]);

  // Load groups when selecting a managed org channel
  useEffect(() => {
    if (!selectedConversation?.organization || !selectedConversation.canManage) return;
    void loadGroups(selectedConversation.organization.id);
  }, [loadGroups, selectedConversation?.canManage, selectedConversation?.organization]);

  return (
    <div className="grid gap-3 xl:grid-cols-[300px_minmax(0,1fr)_280px]">
      <aside className="rounded-2xl border border-slate-700/80 bg-[#1e1f22] p-3">
        <div className="rounded-xl border border-slate-700/60 bg-[#2b2d31] p-3">
          <p className="text-[10px] uppercase tracking-[0.22em] text-slate-400">StarComms Hub</p>
          <h3 className="mt-1 text-lg font-semibold text-slate-100">Channels and DMs</h3>
          <p className="mt-1 text-xs text-slate-400">
            Tactical comms split by org channels and direct threads.
          </p>
          <div className="mt-3 flex gap-2 text-xs">
            <span className="rounded-md bg-slate-800 px-2 py-1 text-slate-200">{conversations.length} rooms</span>
            <span className="rounded-md bg-rose-500/20 px-2 py-1 text-rose-200">{totalUnread} unread</span>
          </div>
        </div>

        <div className="mt-3">
          <input
            value={conversationFilter}
            onChange={(event) => setConversationFilter(event.target.value)}
            placeholder="Search conversations"
            className="w-full rounded-md border border-slate-700 bg-[#111214] px-3 py-2 text-sm text-slate-100 outline-none transition placeholder:text-slate-500 focus:border-sky-400/60"
          />
        </div>

        <div className="mt-4 space-y-4">
          <section>
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">Direct messages</p>
            <div className="mt-2 space-y-1.5">
              {directMessages.map((conversation) => {
                const active = conversation.id === selectedConversationId;
                return (
                  <button
                    key={conversation.id}
                    type="button"
                    onClick={() => selectConversation(conversation.id)}
                    className={`w-full rounded-md px-2.5 py-2 text-left text-sm transition ${
                      active
                        ? "bg-[#3f4248] text-slate-100"
                        : "text-slate-300 hover:bg-[#313338] hover:text-slate-100"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <p className="truncate font-medium">{getConversationLabel(conversation, currentUserId)}</p>
                      <ReadStateBadge unreadCount={unreadByConversation[conversation.id] || 0} isSelected={active} />
                    </div>
                  </button>
                );
              })}
              {!directMessages.length ? <p className="text-xs text-slate-500">No direct messages yet.</p> : null}
            </div>
          </section>

          <section>
            <div className="flex items-center justify-between gap-2">
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">Org channels</p>
              {manageableOrganizations.length ? (
                <div className="flex gap-1">
                  <button
                    type="button"
                    onClick={() => { setActionError(null); setShowNewGroupForm(manageableOrganizations[0].id); }}
                    className="rounded-md bg-slate-700 px-2 py-0.5 text-[11px] font-semibold text-slate-100 hover:bg-slate-600"
                    title="Add category"
                  >
                    + Category
                  </button>
                  <button
                    type="button"
                    onClick={() => { setActionError(null); setShowCreateChannelForm((current) => !current); }}
                    className="rounded-md bg-slate-700 px-2 py-0.5 text-[11px] font-semibold text-slate-100 hover:bg-slate-600"
                  >
                    {showCreateChannelForm ? "Close" : "New"}
                  </button>
                </div>
              ) : null}
            </div>
            {/* New group form */}
            {showNewGroupForm ? (
              <div className="mt-2 flex gap-1">
                <input
                  value={newGroupName}
                  onChange={(event) => setNewGroupName(event.target.value)}
                  placeholder="Category name"
                  maxLength={60}
                  className="flex-1 rounded-md border border-slate-700 bg-[#101217] px-2 py-1.5 text-xs text-slate-200 placeholder:text-slate-500"
                />
                <button
                  type="button"
                  onClick={() => void createGroup(showNewGroupForm)}
                  disabled={savingGroup || !newGroupName.trim()}
                  className="rounded-md bg-sky-500 px-2 py-1 text-xs font-semibold text-slate-950 disabled:opacity-60"
                >
                  Add
                </button>
                <button type="button" onClick={() => { setShowNewGroupForm(null); setNewGroupName(""); }} className="rounded-md bg-slate-700 px-2 py-1 text-xs text-slate-100">✕</button>
              </div>
            ) : null}
            {showCreateChannelForm && manageableOrganizations.length ? (
              <div className="mt-2 space-y-2 rounded-md border border-slate-700 bg-[#1a1d24] p-2">
                <select
                  value={channelDraftOrgId}
                  onChange={(event) => setChannelDraftOrgId(event.target.value)}
                  className="w-full rounded-md border border-slate-700 bg-[#101217] px-2 py-1.5 text-xs text-slate-200"
                >
                  {manageableOrganizations.map((organization) => (
                    <option key={organization.id} value={organization.id}>
                      {organization.name} [{organization.tag}]
                    </option>
                  ))}
                </select>
                <input
                  value={channelDraftName}
                  onChange={(event) => setChannelDraftName(event.target.value)}
                  placeholder="Channel name"
                  maxLength={80}
                  className="w-full rounded-md border border-slate-700 bg-[#101217] px-2 py-1.5 text-xs text-slate-200 placeholder:text-slate-500"
                />
                <input
                  value={channelDraftDescription}
                  onChange={(event) => setChannelDraftDescription(event.target.value)}
                  placeholder="Description (optional)"
                  maxLength={280}
                  className="w-full rounded-md border border-slate-700 bg-[#101217] px-2 py-1.5 text-xs text-slate-200 placeholder:text-slate-500"
                />
                <select
                  value={channelDraftVisibility}
                  onChange={(event) => setChannelDraftVisibility(event.target.value as "PUBLIC" | "PRIVATE")}
                  className="w-full rounded-md border border-slate-700 bg-[#101217] px-2 py-1.5 text-xs text-slate-200"
                >
                  <option value="PUBLIC">Public</option>
                  <option value="PRIVATE">Private</option>
                </select>
                <button
                  type="button"
                  onClick={() => void createChannel()}
                  disabled={creatingChannel || !channelDraftName.trim() || !channelDraftOrgId}
                  className="w-full rounded-md bg-sky-500 px-2 py-1.5 text-xs font-semibold text-slate-950 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {creatingChannel ? "Creating..." : "Create channel"}
                </button>
              </div>
            ) : null}

            {/* Group-sorted channel list */}
            <div className="mt-2 space-y-3">
              {(() => {
                const grouped = new Map<string | null, ConversationItem[]>();
                grouped.set(null, []);
                for (const g of groups) grouped.set(g.id, []);
                for (const ch of organizationChannels) {
                  const key = ch.group?.id ?? null;
                  if (!grouped.has(key)) grouped.set(key, []);
                  grouped.get(key)!.push(ch);
                }

                const sections: JSX.Element[] = [];

                // Named groups first (sorted by position)
                const sortedGroups = [...groups].sort((a, b) => a.position - b.position);
                for (const group of sortedGroups) {
                  const chans = grouped.get(group.id) || [];
                  sections.push(
                    <div key={group.id}>
                      <div className="flex items-center gap-1 px-1">
                        {editingGroupId === group.id ? (
                          <>
                            <input
                              value={groupRenameDraft}
                              onChange={(event) => setGroupRenameDraft(event.target.value)}
                              maxLength={60}
                              className="flex-1 rounded-md border border-slate-700 bg-[#101217] px-2 py-0.5 text-[11px] text-slate-200"
                            />
                            <button type="button" onClick={() => void saveGroupRename()} disabled={savingGroup} className="text-[11px] text-sky-300 disabled:opacity-60">Save</button>
                            <button type="button" onClick={() => setEditingGroupId(null)} className="text-[11px] text-slate-400">✕</button>
                          </>
                        ) : (
                          <>
                            <p className="flex-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500">{group.name}</p>
                            {manageableOrganizations.some((o) => o.id === group.organizationId) ? (
                              <>
                                <button type="button" onClick={() => { setEditingGroupId(group.id); setGroupRenameDraft(group.name); }} className="text-[10px] text-slate-500 hover:text-slate-300">✎</button>
                                <button type="button" onClick={() => void deleteGroup(group.id, group.organizationId)} className="text-[10px] text-slate-500 hover:text-rose-300">✕</button>
                              </>
                            ) : null}
                          </>
                        )}
                      </div>
                      <ChannelList
                        channels={chans}
                        selectedConversationId={selectedConversationId}
                        unreadByConversation={unreadByConversation}
                        groups={groups}
                        canManage={chans.some((c) => c.canManage) || manageableOrganizations.some((o) => o.id === group.organizationId)}
                        movingChannelId={movingChannelId}
                        onSelect={selectConversation}
                        onMove={moveChannel}
                      />
                    </div>
                  );
                }

                // Ungrouped channels
                const ungrouped = grouped.get(null) || [];
                if (ungrouped.length > 0 || sections.length === 0) {
                  sections.push(
                    <div key="__ungrouped">
                      {sections.length > 0 ? (
                        <p className="px-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-600">Uncategorized</p>
                      ) : null}
                      <ChannelList
                        channels={ungrouped}
                        selectedConversationId={selectedConversationId}
                        unreadByConversation={unreadByConversation}
                        groups={groups}
                        canManage={ungrouped.some((c) => c.canManage)}
                        movingChannelId={movingChannelId}
                        onSelect={selectConversation}
                        onMove={moveChannel}
                      />
                    </div>
                  );
                }

                return sections;
              })()}
              {!organizationChannels.length ? <p className="px-1 text-xs text-slate-500">No org channels available.</p> : null}
            </div>
          </section>

        </div>
      </aside>

      <section className="rounded-2xl border border-slate-700/80 bg-[#313338]">
        {selectedConversation ? (
          <>
            <div className="flex items-center justify-between gap-3 border-b border-slate-700/80 px-4 py-3">
              <div className="min-w-0">
                {selectedConversation.isChannel && selectedConversation.organization && selectedConversation.canManage && editingChannelName ? (
                  <div className="flex items-center gap-2">
                    <input
                      value={renameDraft}
                      onChange={(event) => setRenameDraft(event.target.value)}
                      maxLength={80}
                      className="w-full min-w-[220px] rounded-md border border-slate-600 bg-[#1f2127] px-2 py-1 text-sm text-slate-100"
                    />
                    <button
                      type="button"
                      onClick={() => void renameChannel()}
                      disabled={renamingChannel || !renameDraft.trim()}
                      className="rounded-md bg-sky-500 px-2 py-1 text-xs font-semibold text-slate-950 disabled:opacity-60"
                    >
                      Save
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setEditingChannelName(false);
                        setRenameDraft("");
                      }}
                      className="rounded-md bg-slate-700 px-2 py-1 text-xs font-semibold text-slate-100"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <p className="truncate text-base font-semibold text-slate-100">
                    {selectedConversation.isChannel ? "# " : ""}
                    {getConversationLabel(selectedConversation, currentUserId)}
                  </p>
                )}
                <p className="truncate text-xs text-slate-400">{getConversationMeta(selectedConversation)}</p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <span className="rounded-md bg-slate-800 px-2 py-1 text-[11px] text-slate-300">
                  {selectedConversation.isChannel ? "Channel" : "Direct"}
                </span>
                {selectedConversation.organization ? (
                  <Link
                    href={`/organizations/${selectedConversation.organization.id}`}
                    className="rounded-md bg-amber-500/15 px-2 py-1 text-[11px] text-amber-100 hover:bg-amber-500/25"
                  >
                    Org
                  </Link>
                ) : null}
                {selectedConversation.isChannel && selectedConversation.organization && selectedConversation.canManage && !editingChannelName ? (
                  <button
                    type="button"
                    onClick={() => {
                      setRenameDraft(selectedConversation.title);
                      setEditingChannelName(true);
                      setShowAccessEditor(true);
                      setActionError(null);
                    }}
                    className="rounded-md bg-slate-700 px-2 py-1 text-[11px] text-slate-100 hover:bg-slate-600"
                  >
                    Edit
                  </button>
                ) : null}
                {selectedConversation.isChannel && selectedConversation.organization && selectedConversation.canManage && editingChannelName ? (
                  <button
                    type="button"
                    onClick={() => {
                      setEditingChannelName(false);
                      setShowAccessEditor(false);
                      setRenameDraft("");
                      setActionError(null);
                    }}
                    className="rounded-md bg-slate-700 px-2 py-1 text-[11px] text-slate-100 hover:bg-slate-600"
                  >
                    Close edit
                  </button>
                ) : null}
                {selectedConversation.isChannel && selectedConversation.organization && selectedConversation.canManage ? (
                  <button
                    type="button"
                    onClick={() => void archiveChannel()}
                    disabled={archivingChannel}
                    className="rounded-md bg-amber-500/15 px-2 py-1 text-[11px] text-amber-100 hover:bg-amber-500/25 disabled:opacity-60"
                  >
                    {archivingChannel ? "Archiving..." : "Archive"}
                  </button>
                ) : null}
                {selectedConversation.isChannel && selectedConversation.organization && selectedConversation.canManage ? (
                  <button
                    type="button"
                    onClick={() => void deleteChannel()}
                    disabled={deletingChannel}
                    className="rounded-md bg-rose-500/15 px-2 py-1 text-[11px] text-rose-100 hover:bg-rose-500/25 disabled:opacity-60"
                  >
                    {deletingChannel ? "Deleting..." : "Delete"}
                  </button>
                ) : null}
                <Link
                  href="/social"
                  className="rounded-md bg-sky-500/15 px-2 py-1 text-[11px] text-sky-100 hover:bg-sky-500/25"
                >
                  Forum
                </Link>
                <button
                  type="button"
                  onClick={() => setShowPolls((p) => !p)}
                  className="rounded-md bg-indigo-500/15 px-2 py-1 text-[11px] text-indigo-100 hover:bg-indigo-500/25"
                >
                  Polls {polls.length > 0 ? `(${polls.length})` : ""}
                </button>
              </div>
            </div>
            {showAccessEditor && selectedConversation.isChannel && selectedConversation.organization && selectedConversation.canManage ? (
              <div className="border-b border-slate-700/80 bg-[#2b2d31] px-4 py-3">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-300">Edit channel access</p>
                <p className="mt-1 text-xs text-slate-400">
                  Pick specific members who can see and use this channel. Overrides the public/private setting — only selected members will have access. Leave empty to use the channel&apos;s default visibility rules.
                </p>
                {loadingAccess ? (
                  <p className="mt-2 text-xs text-slate-400">Loading channel members...</p>
                ) : (
                  <div className="mt-2 max-h-40 space-y-1 overflow-auto rounded-md border border-slate-700 bg-[#1d212b] p-2">
                    {accessMembers.map((member) => {
                      const label = member.starCitizenHandle || member.name || member.email || "Member";
                      const checked = allowedUserIds.includes(member.id);
                      return (
                        <label key={member.id} className="flex items-center gap-2 rounded-md px-2 py-1 text-xs text-slate-200 hover:bg-slate-800">
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={(event) => {
                              setAllowedUserIds((current) => {
                                if (event.target.checked) {
                                  if (current.includes(member.id)) return current;
                                  return [...current, member.id];
                                }
                                return current.filter((id) => id !== member.id);
                              });
                            }}
                            className="h-3.5 w-3.5"
                          />
                          <span className="truncate">{label}</span>
                        </label>
                      );
                    })}
                    {!accessMembers.length ? <p className="text-xs text-slate-500">No members found for this organization.</p> : null}
                  </div>
                )}
                <div className="mt-2 flex gap-2">
                  <button
                    type="button"
                    onClick={() => void saveAccessSettings()}
                    disabled={savingAccess || loadingAccess}
                    className="rounded-md bg-sky-500 px-2 py-1 text-xs font-semibold text-slate-950 disabled:opacity-60"
                  >
                    {savingAccess ? "Saving..." : "Save access"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setAllowedUserIds([])}
                    disabled={savingAccess || loadingAccess}
                    className="rounded-md bg-slate-700 px-2 py-1 text-xs font-semibold text-slate-100 disabled:opacity-60"
                  >
                    Clear restrictions
                  </button>
                </div>
              </div>
            ) : null}
            {actionError ? (
              <div className="border-b border-rose-500/30 bg-rose-500/10 px-4 py-2 text-xs text-rose-100">
                {actionError}
              </div>
            ) : null}

            {/* Polls panel */}
            {showPolls ? (
              <div className="border-b border-slate-700/80 bg-[#232428] px-4 py-3">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold text-slate-200">Channel polls</p>
                  <button
                    type="button"
                    onClick={() => setShowPollForm((f) => !f)}
                    className="rounded-md bg-indigo-500/20 px-2 py-0.5 text-[11px] text-indigo-100 hover:bg-indigo-500/35"
                  >
                    {showPollForm ? "Close" : "+ New poll"}
                  </button>
                </div>
                {showPollForm ? (
                  <div className="mt-2 space-y-2">
                    <input
                      value={pollQuestion}
                      onChange={(e) => setPollQuestion(e.target.value)}
                      placeholder="Poll question"
                      maxLength={300}
                      className="w-full rounded-md border border-slate-700 bg-[#1d212b] px-3 py-1.5 text-sm text-slate-100 placeholder:text-slate-500"
                    />
                    {pollOptions.map((opt, idx) => (
                      <div key={idx} className="flex gap-1">
                        <input
                          value={opt}
                          onChange={(e) => setPollOptions((prev) => { const n = [...prev]; n[idx] = e.target.value; return n; })}
                          placeholder={`Option ${idx + 1}`}
                          maxLength={120}
                          className="flex-1 rounded-md border border-slate-700 bg-[#1d212b] px-3 py-1.5 text-sm text-slate-100 placeholder:text-slate-500"
                        />
                        {idx >= 2 ? (
                          <button type="button" onClick={() => setPollOptions((prev) => prev.filter((_, i) => i !== idx))} className="rounded bg-slate-700 px-2 text-xs text-slate-100">✕</button>
                        ) : null}
                      </div>
                    ))}
                    {pollOptions.length < 10 ? (
                      <button type="button" onClick={() => setPollOptions((prev) => [...prev, ""])} className="text-xs text-sky-300 hover:text-sky-100">+ Add option</button>
                    ) : null}
                    <label className="flex items-center gap-2 text-xs text-slate-300">
                      <input type="checkbox" checked={pollMultiVote} onChange={(e) => setPollMultiVote(e.target.checked)} />
                      Allow multiple votes
                    </label>
                    <button
                      type="button"
                      onClick={() => void submitPoll()}
                      disabled={creatingPoll || !pollQuestion.trim() || pollOptions.filter((o) => o.trim()).length < 2}
                      className="rounded-md bg-indigo-500 px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-60"
                    >
                      {creatingPoll ? "Creating..." : "Create poll"}
                    </button>
                  </div>
                ) : null}
                <div className="mt-3 space-y-4">
                  {polls.map((poll) => (
                    <div key={poll.id} className="rounded-lg border border-slate-700 bg-[#1d212b] p-3">
                      <p className="text-sm font-semibold text-slate-100">{poll.question}</p>
                      <p className="mt-0.5 text-[11px] text-slate-500">
                        {poll.isClosed ? "Closed" : poll.isMultiVote ? "Multiple choice" : "Single choice"} · {poll.totalVotes} vote{poll.totalVotes !== 1 ? "s" : ""}
                      </p>
                      <div className="mt-2 space-y-1.5">
                        {poll.options.map((option) => {
                          const pct = poll.totalVotes > 0 ? Math.round((option.voteCount / poll.totalVotes) * 100) : 0;
                          return (
                            <button
                              key={option.id}
                              type="button"
                              onClick={() => !poll.isClosed ? void voteOnOption(option.id) : undefined}
                              disabled={poll.isClosed}
                              className={`relative w-full overflow-hidden rounded-md border px-3 py-2 text-left text-xs transition ${option.myVote ? "border-indigo-400/60 bg-indigo-500/15 text-indigo-100" : "border-slate-700 bg-[#232428] text-slate-200 hover:border-slate-500"} ${poll.isClosed ? "cursor-default" : ""}`}
                            >
                              <span className="absolute inset-y-0 left-0 rounded-l-md bg-indigo-500/15 transition-all" style={{ width: `${pct}%` }} />
                              <span className="relative flex justify-between">
                                <span>{option.text}</span>
                                <span className="text-slate-400">{pct}% ({option.voteCount})</span>
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                  {!polls.length ? <p className="text-xs text-slate-500">No polls yet. Create one above.</p> : null}
                </div>
              </div>
            ) : null}

            {loadingMessages && !selectedMessages.length ? (
              <div className="p-4 text-sm text-slate-400">Loading conversation...</div>
            ) : (
              <div className="p-2 sm:p-3">
                <LiveChat
                  key={selectedConversation.id}
                  conversationId={selectedConversation.id}
                  currentUserId={currentUserId}
                  initialMessages={selectedMessages}
                  members={selectedMembers}
                  title={`${selectedConversation.isChannel ? "#" : ""}${getConversationLabel(selectedConversation, currentUserId)}`}
                  subtitle={getConversationMeta(selectedConversation)}
                  placeholder={selectedConversation.isChannel ? "Message this channel" : "Message this user"}
                  emptyMessage="No messages yet. Kick off the conversation."
                  organizationId={selectedConversation.organization?.id ?? null}
                />
              </div>
            )}
          </>
        ) : (
          <div className="p-8 text-center">
            <h3 className="text-xl font-semibold text-slate-100">No conversations yet</h3>
            <p className="mt-2 text-sm text-slate-400">
              Start a direct message from the member list or join an org channel.
            </p>
          </div>
        )}
      </section>

      <aside className="rounded-2xl border border-slate-700/80 bg-[#2b2d31] p-3">
        <section className="rounded-xl border border-slate-700/70 bg-[#232428] p-3">
          <p className="text-[10px] uppercase tracking-[0.18em] text-slate-500">Your badges</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {viewerBadges.map((badge) => (
              <BadgeChip key={badge.key} badge={badge} compact />
            ))}
            {!viewerBadges.length ? <p className="text-xs text-slate-500">No badges unlocked yet.</p> : null}
          </div>
        </section>

        <section className="mt-3 rounded-xl border border-slate-700/70 bg-[#232428] p-3">
          <div className="mb-2 flex items-center justify-between">
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">Online now</p>
            <span className="rounded-md bg-emerald-500/15 px-2 py-0.5 text-[10px] text-emerald-100">{onlineMembers.length}</span>
          </div>
          <div className="space-y-1.5">
            {onlineMembers.slice(0, 10).map((member) => (
              <div key={member.id} className="flex items-center gap-2 rounded-md bg-[#2b2d31] px-2 py-1.5">
                <span className="h-2 w-2 rounded-full bg-emerald-400" />
                <p className="truncate text-sm text-slate-200">
                  {member.starCitizenHandle || member.name || member.email || "Operator"}
                </p>
              </div>
            ))}
            {!onlineMembers.length ? <p className="text-xs text-slate-500">No active pilots.</p> : null}
          </div>
        </section>

        <section className="mt-3 rounded-xl border border-slate-700/70 bg-[#232428] p-3">
          <div className="mb-2 flex items-center justify-between">
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">Start DM</p>
            <span className="rounded-md bg-slate-700 px-2 py-0.5 text-[10px] text-slate-200">{availablePeople.length}</span>
          </div>
          <div className="max-h-[320px] space-y-1.5 overflow-auto pr-1">
            {availablePeople.map((person) => {
              const label = person.starCitizenHandle || person.name || person.email || "Operator";
              return (
                <button
                  key={person.id}
                  type="button"
                  onClick={() => void startDirectMessage(person.id)}
                  disabled={creatingDmFor === person.id}
                  className="w-full rounded-md bg-[#2b2d31] px-2.5 py-2 text-left text-sm text-slate-200 transition hover:bg-[#3a3d44] disabled:opacity-60"
                >
                  <p className="truncate font-medium">{label}</p>
                  {person.bio ? <p className="mt-0.5 line-clamp-1 text-[11px] text-slate-400">{person.bio}</p> : null}
                </button>
              );
            })}
          </div>
        </section>
      </aside>
    </div>
  );
}