import { prisma } from "@/lib/prisma";
import { ForbiddenError, NotFoundError, ValidationError } from "@/lib/errors";
import { isSiteAdmin } from "@/server/permissions";
import { hasAppPrivilege } from "@/lib/permissions";
import { createNotification } from "@/server/notifications";
import type { OrganizationMemberRole, OrganizationVisibility, SocialPostType } from "@prisma/client";

export type UsageBadge = {
  key: string;
  label: string;
  tone: "cyan" | "amber" | "emerald" | "rose";
  hint: string;
};

type ConversationUnreadCount = {
  conversationId: string;
  unreadCount: number;
};

const MAX_MESSAGE_LENGTH = 2000;
const MAX_FORUM_TITLE_LENGTH = 140;
const MAX_FORUM_BODY_LENGTH = 5000;
const MAX_CATEGORY_NAME_LENGTH = 60;
const MAX_CATEGORY_DESCRIPTION_LENGTH = 240;

const LEADERSHIP_ROLES: OrganizationMemberRole[] = ["OWNER", "OFFICER", "COMMANDER"];

const PINNED_GUIDELINE_TITLE = "Community Guidelines: Read Before Posting";
const PINNED_GUIDELINE_BODY = [
  "Welcome to Sosial Forum. Keep this forum useful, respectful, and mission-focused.",
  "",
  "1. Zero tolerance for racism, sexism, hate speech, harassment, or targeted abuse.",
  "2. No politics, real-world culture-war arguments, or inflammatory off-topic debates.",
  "3. No slurs, discriminatory language, or demeaning stereotypes of any person or group.",
  "4. Keep it mission-relevant: use clear titles, choose the right category, and stay on-topic.",
  "5. No spam, repeated promotions, phishing/scam links, or misleading clickbait titles.",
  "6. Respect privacy: do not post private org plans, personal data, or sensitive operation intel.",
  "7. No NSFW, explicit, or graphic content. Keep all discussion suitable for all members.",
  "8. Disagree professionally: critique ideas, not people; avoid insults and flamebait.",
  "9. If conflict escalates, stop replying and escalate to moderators/leadership.",
  "10. Repeated or severe violations may result in content removal, role restrictions, mute, or removal.",
  "",
  "By posting in Sosial Forum, you agree to follow these rules.",
].join("\n");

async function hasGlobalPrivilegedChatAccess(userId: string) {
  const [isAdmin, leadershipMembership] = await Promise.all([
    isSiteAdmin(userId),
    prisma.organizationMember.findFirst({
      where: {
        userId,
        role: { in: LEADERSHIP_ROLES },
      },
      select: { organizationId: true },
    }),
  ]);

  return isAdmin || Boolean(leadershipMembership);
}

async function getOrganizationRole(userId: string, organizationId: string) {
  const membership = await prisma.organizationMember.findUnique({
    where: { userId_organizationId: { userId, organizationId } },
    select: { role: true },
  });
  return membership?.role ?? null;
}

async function canManageOrganizationChannels(userId: string, organizationId: string) {
  const [membership, isAdmin, user] = await Promise.all([
    prisma.organizationMember.findUnique({
      where: { userId_organizationId: { userId, organizationId } },
      include: { appPrivileges: true, customRank: { include: { appPrivileges: true } } },
    }),
    isSiteAdmin(userId),
    prisma.user.findUnique({ where: { id: userId }, select: { siteRole: true } }),
  ]);

  if (isAdmin) {
    return true;
  }

  if (!membership) {
    return false;
  }

  const mergedPrivileges = {
    ...membership.customRank?.appPrivileges,
    ...membership.appPrivileges,
  };

  return hasAppPrivilege(
    "manageChannels",
    user?.siteRole || "MEMBER",
    membership.role,
    mergedPrivileges
  );
}

async function canAccessChannel(userId: string, conversationId: string) {
  const conversation = await prisma.conversation.findUnique({
    where: { id: conversationId },
    select: {
      id: true,
      isChannel: true,
      isArchived: true,
      visibility: true,
      organizationId: true,
      createdById: true,
    },
  });

  if (!conversation) {
    throw new NotFoundError("Conversation not found");
  }

  if (conversation.isArchived) {
    throw new ForbiddenError("This channel has been archived");
  }

  if (!conversation.isChannel) {
    const membership = await prisma.conversationParticipant.findUnique({
      where: {
        conversationId_userId: {
          conversationId,
          userId,
        },
      },
    });

    if (!membership) {
      throw new ForbiddenError("You are not a participant in this conversation");
    }

    return;
  }

  if (!conversation.organizationId) {
    if (conversation.visibility === "PRIVATE") {
      const privileged = await hasGlobalPrivilegedChatAccess(userId);
      if (!privileged) {
        throw new ForbiddenError("This channel is restricted to privileged members");
      }
    }

    return;
  }

  const role = await getOrganizationRole(userId, conversation.organizationId);
  if (!role) {
    throw new ForbiddenError("You are not a member of this organization");
  }

  const [restrictedAccess, canManageChannels] = await Promise.all([
    prisma.conversationChannelAccess.findMany({
      where: { conversationId },
      select: { userId: true },
    }),
    canManageOrganizationChannels(userId, conversation.organizationId),
  ]);

  if (canManageChannels) return; // channel managers bypass all access rules

  const hasAllowlist = restrictedAccess.length > 0;
  const inAllowlist = hasAllowlist && restrictedAccess.some((e) => e.userId === userId);

  // If an allowlist exists, it replaces both the visibility and leadership check
  if (hasAllowlist) {
    if (!inAllowlist) {
      throw new ForbiddenError("This channel is restricted to selected members");
    }
    return; // allowlist grants full access regardless of visibility
  }

  // No allowlist — fall back to visibility rule
  if (conversation.visibility === "PRIVATE" && !LEADERSHIP_ROLES.includes(role)) {
    throw new ForbiddenError("This channel is restricted to leadership roles");
  }
}

async function ensureGuidelinePost() {
  const existing = await prisma.socialPost.findMany({
    where: { pinned: true, type: "GUIDELINE", title: PINNED_GUIDELINE_TITLE },
    select: { id: true },
    orderBy: { createdAt: "desc" },
  });

  if (existing.length > 0) {
    const [canonical, ...duplicates] = existing;

    if (duplicates.length > 0) {
      await prisma.socialPost.deleteMany({
        where: {
          id: {
            in: duplicates.map((post) => post.id),
          },
        },
      });
    }

    await prisma.socialPost.update({
      where: { id: canonical.id },
      data: {
        body: PINNED_GUIDELINE_BODY,
        pinned: true,
        locked: true,
      },
    });
    return;
  }

  const author = await prisma.user.findFirst({
    where: { siteRole: "SITE_ADMIN" },
    select: { id: true },
    orderBy: { createdAt: "asc" },
  });

  const fallbackAuthor =
    author ??
    (await prisma.user.findFirst({
      select: { id: true },
      orderBy: { createdAt: "asc" },
    }));

  if (!fallbackAuthor) return;

  await prisma.socialPost.create({
    data: {
      title: PINNED_GUIDELINE_TITLE,
      body: PINNED_GUIDELINE_BODY,
      type: "GUIDELINE",
      pinned: true,
      locked: true,
      authorId: fallbackAuthor.id,
    },
  });
}

function slugifyCategoryName(name: string) {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

type UsageStats = {
  messages: number;
  posts: number;
  replies: number;
  operations: number;
  memberships: number;
  follows: number;
};

function countByKey<T extends string>(rows: Array<Record<T, string> & { _count: { _all: number } }>, key: T) {
  return new Map(rows.map((row) => [row[key], row._count._all]));
}

function buildUsageBadges(stats: UsageStats): UsageBadge[] {
  const badges: UsageBadge[] = [];

  if (stats.memberships >= 1) {
    badges.push({
      key: "recruit",
      label: "Recruit",
      tone: "emerald",
      hint: "Joined an organization and entered the command network.",
    });
  }

  if (stats.messages >= 1) {
    badges.push({
      key: "first-ping",
      label: "First Ping",
      tone: "cyan",
      hint: "Sent your first chat message.",
    });
  }

  if (stats.messages >= 25) {
    badges.push({
      key: "signal-runner",
      label: "Signal Runner",
      tone: "cyan",
      hint: "Sent 25 or more messages across command channels.",
    });
  }

  if (stats.posts + stats.replies >= 5) {
    badges.push({
      key: "forum-voice",
      label: "Forum Voice",
      tone: "amber",
      hint: "Contributed at least 5 forum posts or replies.",
    });
  }

  if (stats.operations >= 1) {
    badges.push({
      key: "briefing-officer",
      label: "Briefing Officer",
      tone: "rose",
      hint: "Commanded at least one operation.",
    });
  }

  if (stats.memberships >= 2) {
    badges.push({
      key: "coalition-minded",
      label: "Coalition Minded",
      tone: "amber",
      hint: "Built presence across multiple organizations.",
    });
  }

  if (stats.follows >= 3) {
    badges.push({
      key: "networked",
      label: "Networked",
      tone: "emerald",
      hint: "Connected with at least 3 other members.",
    });
  }

  return badges;
}

async function buildUsageBadgeMap(userIds: string[]) {
  const uniqueUserIds = [...new Set(userIds.filter(Boolean))];
  if (!uniqueUserIds.length) return new Map<string, UsageBadge[]>();

  const [messageCounts, postCounts, replyCounts, operationCounts, membershipCounts, followCounts] =
    await Promise.all([
      prisma.message.groupBy({
        by: ["senderId"],
        where: { senderId: { in: uniqueUserIds } },
        _count: { _all: true },
      }),
      prisma.socialPost.groupBy({
        by: ["authorId"],
        where: { authorId: { in: uniqueUserIds } },
        _count: { _all: true },
      }),
      prisma.socialPostReply.groupBy({
        by: ["authorId"],
        where: { authorId: { in: uniqueUserIds } },
        _count: { _all: true },
      }),
      prisma.operation.groupBy({
        by: ["commanderId"],
        where: { commanderId: { in: uniqueUserIds } },
        _count: { _all: true },
      }),
      prisma.organizationMember.groupBy({
        by: ["userId"],
        where: { userId: { in: uniqueUserIds } },
        _count: { _all: true },
      }),
      prisma.userFollow.groupBy({
        by: ["followerId"],
        where: { followerId: { in: uniqueUserIds } },
        _count: { _all: true },
      }),
    ]);

  const messageMap = countByKey(messageCounts, "senderId");
  const postMap = countByKey(postCounts, "authorId");
  const replyMap = countByKey(replyCounts, "authorId");
  const operationMap = countByKey(operationCounts, "commanderId");
  const membershipMap = countByKey(membershipCounts, "userId");
  const followMap = countByKey(followCounts, "followerId");

  return new Map(
    uniqueUserIds.map((userId) => [
      userId,
      buildUsageBadges({
        messages: messageMap.get(userId) || 0,
        posts: postMap.get(userId) || 0,
        replies: replyMap.get(userId) || 0,
        operations: operationMap.get(userId) || 0,
        memberships: membershipMap.get(userId) || 0,
        follows: followMap.get(userId) || 0,
      }),
    ])
  );
}

export async function getUserUsageBadgeProfile(userId: string) {
  const badgeMap = await buildUsageBadgeMap([userId]);
  return badgeMap.get(userId) || [];
}

export async function ensureOrganizationChannelsForUser(userId: string) {
  const memberships = await prisma.organizationMember.findMany({
    where: { userId },
    select: { organizationId: true },
  });

  const organizationIds = memberships.map((m) => m.organizationId);
  if (!organizationIds.length) return;

  for (const organizationId of organizationIds) {
    const existing = await prisma.conversation.findMany({
      where: { organizationId, isChannel: true },
      select: { title: true },
    });

    const existingTitles = new Set(existing.map((c) => c.title.toLowerCase()));
    const defaults: Array<{ title: string; description: string; visibility: OrganizationVisibility }> = [
      {
        title: "General Ops",
        description: "Main coordination channel for day-to-day organization communication.",
        visibility: "PUBLIC",
      },
      {
        title: "Questions & Help",
        description: "Ask questions, request support, and share quick tactical advice.",
        visibility: "PUBLIC",
      },
      {
        title: "Command Briefing",
        description: "Leadership-only channel for strategic planning and high-level decisions.",
        visibility: "PRIVATE",
      },
    ];

    const toCreate = defaults.filter((channel) => !existingTitles.has(channel.title.toLowerCase()));
    if (!toCreate.length) continue;

    await prisma.conversation.createMany({
      data: toCreate.map((channel) => ({
        title: channel.title,
        description: channel.description,
        organizationId,
        createdById: userId,
        isChannel: true,
        visibility: channel.visibility,
      })),
    });
  }
}

async function ensureGlobalChannels(userId: string) {
  const defaults: Array<{ title: string; description: string; visibility: OrganizationVisibility }> = [
    {
      title: "General Public Chat",
      description: "Open chat for all platform members.",
      visibility: "PUBLIC",
    },
    {
      title: "Privileged Coordination",
      description: "Leadership and privileged discussion channel.",
      visibility: "PRIVATE",
    },
  ];

  const existing = await prisma.conversation.findMany({
    where: {
      isChannel: true,
      organizationId: null,
      title: { in: defaults.map((channel) => channel.title) },
    },
    select: { title: true },
  });

  const existingTitles = new Set(existing.map((channel) => channel.title));

  for (const channel of defaults) {
    if (existingTitles.has(channel.title)) continue;

    await prisma.conversation.create({
      data: {
        title: channel.title,
        description: channel.description,
        isChannel: true,
        visibility: channel.visibility,
        createdById: userId,
      },
    });
  }
}

async function ensureConversationAccess(userId: string, conversationId: string) {
  await canAccessChannel(userId, conversationId);
}

async function listConversationUnreadCounts(
  userId: string,
  conversationIds: string[]
): Promise<ConversationUnreadCount[]> {
  if (!conversationIds.length) return [];

  const readStates = await prisma.conversationReadState.findMany({
    where: {
      userId,
      conversationId: { in: conversationIds },
    },
    select: {
      conversationId: true,
      lastReadAt: true,
    },
  });

  const readStateMap = new Map(
    readStates.map((readState) => [readState.conversationId, readState.lastReadAt])
  );

  const unreadCounts = await prisma.$transaction(
    conversationIds.map((conversationId) =>
      prisma.message.count({
        where: {
          conversationId,
          senderId: { not: userId },
          ...(readStateMap.get(conversationId)
            ? { createdAt: { gt: readStateMap.get(conversationId)! } }
            : {}),
        },
      })
    )
  );

  return conversationIds.map((conversationId, index) => ({
    conversationId,
    unreadCount: unreadCounts[index] || 0,
  }));
}

export async function getUnreadMessageCount(userId: string) {
  const conversations = await listUserConversations(userId);
  return conversations.reduce((sum, conversation) => sum + conversation.unreadCount, 0);
}

export async function markConversationRead(
  userId: string,
  conversationId: string,
  readAt: Date = new Date()
) {
  await ensureConversationAccess(userId, conversationId);

  return prisma.conversationReadState.upsert({
    where: {
      conversationId_userId: {
        conversationId,
        userId,
      },
    },
    update: {
      lastReadAt: readAt,
    },
    create: {
      conversationId,
      userId,
      lastReadAt: readAt,
    },
  });
}

export async function listOrganizationChannels(userId: string, organizationId: string) {
  await ensureOrganizationChannelsForUser(userId);

  const [membership, isAdmin] = await Promise.all([
    prisma.organizationMember.findUnique({
      where: { userId_organizationId: { userId, organizationId } },
      select: { role: true },
    }),
    isSiteAdmin(userId),
  ]);

  const canManage = isAdmin || (membership ? await canManageOrganizationChannels(userId, organizationId) : false);
  const isLeadership = isAdmin || LEADERSHIP_ROLES.includes(membership?.role as OrganizationMemberRole);

  const allChannels = await prisma.conversation.findMany({
    where: { organizationId, isChannel: true, isArchived: false },
    include: {
      channelAccesses: { select: { userId: true } },
      messages: {
        orderBy: { createdAt: "desc" },
        take: 1,
        select: { id: true, body: true, createdAt: true },
      },
    },
    orderBy: { createdAt: "asc" },
  });

  return allChannels.filter((channel) => {
    if (canManage) return true;
    const hasAllowlist = channel.channelAccesses.length > 0;
    if (hasAllowlist) return channel.channelAccesses.some((a) => a.userId === userId);
    if (channel.visibility === "PRIVATE") return isLeadership;
    return true;
  });
}

export async function listUserConversations(userId: string) {
  await ensureGlobalChannels(userId);
  const hasPrivilegedAccess = await hasGlobalPrivilegedChatAccess(userId);

  // Fetch org IDs the user belongs to so we can include their org channels
  const userMemberships = await prisma.organizationMember.findMany({
    where: { userId },
    select: { organizationId: true, role: true, appPrivileges: true },
  });
  const memberOrgIds = userMemberships.map((m) => m.organizationId);

  const conversations = await prisma.conversation.findMany({
    where: {
      OR: [
        // Global public channels
        {
          isChannel: true,
          isArchived: false,
          organizationId: null,
          ...(hasPrivilegedAccess ? {} : { visibility: "PUBLIC" }),
        },
        // Org channels — all visibility; access filtering done below
        ...(memberOrgIds.length
          ? [{
              isChannel: true,
              isArchived: false,
              organizationId: { in: memberOrgIds },
            }]
          : []),
        // DMs
        {
          isArchived: false,
          isChannel: false,
          participants: {
            some: { userId },
          },
        },
      ],
    },
    include: {
      organization: {
        select: { id: true, name: true, tag: true },
      },
      group: {
        select: { id: true, name: true, position: true },
      },
      participants: {
        include: {
          user: {
            select: { id: true, name: true, email: true, starCitizenHandle: true },
          },
        },
      },
      messages: {
        orderBy: { createdAt: "desc" },
        take: 1,
        select: { id: true, body: true, createdAt: true },
      },
    },
    orderBy: { updatedAt: "desc" },
  });

  const unreadCounts = await listConversationUnreadCounts(
    userId,
    conversations.map((conversation) => conversation.id)
  );
  const unreadCountMap = new Map(
    unreadCounts.map((entry) => [entry.conversationId, entry.unreadCount])
  );

  const organizationIds = [...new Set(conversations.map((conversation) => conversation.organizationId).filter(Boolean))] as string[];
  const manageMap = new Map<string, boolean>();

  if (organizationIds.length) {
    const manageEntries = await Promise.all(
      organizationIds.map(async (organizationId) => [organizationId, await canManageOrganizationChannels(userId, organizationId)] as const)
    );

    for (const [organizationId, canManage] of manageEntries) {
      manageMap.set(organizationId, canManage);
    }
  }

  const organizationChannelIds = conversations
    .filter((conversation) => conversation.isChannel && Boolean(conversation.organizationId))
    .map((conversation) => conversation.id);

  const accessEntries = organizationChannelIds.length
    ? await prisma.conversationChannelAccess.findMany({
        where: { conversationId: { in: organizationChannelIds } },
        select: { conversationId: true, userId: true },
      })
    : [];

  const allowedMap = new Map<string, Set<string>>();
  for (const entry of accessEntries) {
    const existing = allowedMap.get(entry.conversationId);
    if (existing) {
      existing.add(entry.userId);
      continue;
    }
    allowedMap.set(entry.conversationId, new Set([entry.userId]));
  }

  const accessibleConversations = conversations.filter((conversation) => {
    if (!conversation.isChannel || !conversation.organizationId) {
      return true;
    }

    const canManage = Boolean(manageMap.get(conversation.organizationId));
    if (canManage) return true; // managers always see everything

    const allowedUsers = allowedMap.get(conversation.id);
    const hasAllowlist = allowedUsers && allowedUsers.size > 0;

    // PRIVATE channel: must be in allowlist OR leadership role
    if (conversation.visibility === "PRIVATE") {
      if (hasAllowlist) {
        return allowedUsers!.has(userId); // allowlist overrides role requirement
      }
      // No allowlist — fall back to leadership role check
      const membership = userMemberships.find((m) => m.organizationId === conversation.organizationId);
      return Boolean(membership && LEADERSHIP_ROLES.includes(membership.role as OrganizationMemberRole));
    }

    // PUBLIC channel: visible to all members unless allowlist restricts it
    if (hasAllowlist) {
      return allowedUsers!.has(userId);
    }

    return true; // PUBLIC with no allowlist — visible to all org members
  });

  return accessibleConversations.map((conversation) => ({
    ...conversation,
    canManage:
      conversation.isChannel && conversation.organizationId
        ? Boolean(manageMap.get(conversation.organizationId))
        : false,
    unreadCount: unreadCountMap.get(conversation.id) || 0,
  }));
}

export async function listSocialPeople(userId: string) {
  const isAdmin = await isSiteAdmin(userId);
  const organizationMemberships = isAdmin
    ? []
    : await prisma.organizationMember.findMany({
        where: { userId },
        select: { organizationId: true },
      });
  const organizationIds = organizationMemberships.map((membership) => membership.organizationId);

  const [users, follows] = await Promise.all([
    prisma.user.findMany({
      where: {
        id: { not: userId },
        ...(isAdmin
          ? {}
          : {
              orgMemberships: {
                some: {
                  organizationId: {
                    in: organizationIds.length ? organizationIds : ["__none__"],
                  },
                },
              },
            }),
      },
      select: {
        id: true,
        name: true,
        email: true,
        starCitizenHandle: true,
        bio: true,
        _count: {
          select: {
            followers: true,
            following: true,
          },
        },
      },
      orderBy: { createdAt: "asc" },
      take: 50,
    }),
    prisma.userFollow.findMany({
      where: { followerId: userId },
      select: { followingId: true },
    }),
  ]);

  const followingIds = new Set(follows.map((follow) => follow.followingId));
  const badgeMap = await buildUsageBadgeMap(users.map((user) => user.id));

  return users.map((user) => ({
    ...user,
    isFollowing: followingIds.has(user.id),
    badges: badgeMap.get(user.id) || [],
  }));
}

export async function createDirectConversation(
  userId: string,
  targetUserId: string,
  initialMessage?: string
) {
  if (!targetUserId || targetUserId === userId) {
    throw new ValidationError("Select another user to message");
  }

  const targetUser = await prisma.user.findUnique({
    where: { id: targetUserId },
    select: { id: true, name: true, email: true, starCitizenHandle: true },
  });

  if (!targetUser) {
    throw new NotFoundError("User not found");
  }

  const title = targetUser.starCitizenHandle
    ? `DM: @${targetUser.starCitizenHandle}`
    : `DM: ${targetUser.name || targetUser.email || "Operator"}`;

  const trimmedInitialMessage = initialMessage?.trim() ?? "";
  if (trimmedInitialMessage.length > MAX_MESSAGE_LENGTH) {
    throw new ValidationError("Message exceeds 2000 characters");
  }

  const conversation = await prisma.$transaction(async (tx) => {
    const existingConversation = await tx.conversation.findFirst({
      where: {
        isChannel: false,
        participants: {
          some: { userId },
        },
        AND: [
          {
            participants: {
              some: { userId: targetUserId },
            },
          },
          {
            participants: {
              every: {
                userId: {
                  in: [userId, targetUserId],
                },
              },
            },
          },
        ],
      },
      select: { id: true },
    });

    if (existingConversation) {
      return existingConversation;
    }

    const createdConversation = await tx.conversation.create({
      data: {
        title,
        description: "Direct member message",
        createdById: userId,
        isChannel: false,
      },
    });

    await tx.conversationParticipant.createMany({
      data: [
        { conversationId: createdConversation.id, userId },
        { conversationId: createdConversation.id, userId: targetUserId },
      ],
    });

    if (trimmedInitialMessage) {
      await tx.message.create({
        data: {
          conversationId: createdConversation.id,
          senderId: userId,
          body: trimmedInitialMessage,
        },
      });
    }

    return createdConversation;
  });

  return conversation;
}

export async function listOnlineMembers(userId: string) {
  const members = await prisma.user.findMany({
    where: {
      id: { not: userId },
      sessions: {
        some: {
          expires: { gt: new Date() },
        },
      },
    },
    select: {
      id: true,
      name: true,
      email: true,
      starCitizenHandle: true,
    },
    orderBy: { updatedAt: "desc" },
    take: 80,
  });

  const badgeMap = await buildUsageBadgeMap(members.map((member) => member.id));

  return members.map((member) => ({
    ...member,
    badges: badgeMap.get(member.id) || [],
  }));
}

export async function listForumPosts() {
  await ensureGuidelinePost();

  return prisma.socialPost.findMany({
    where: {
      organizationId: null,
    },
    include: {
      author: {
        select: { id: true, name: true, email: true, starCitizenHandle: true },
      },
      organization: {
        select: { id: true, name: true, tag: true },
      },
      category: {
        select: { id: true, name: true, slug: true },
      },
      replies: {
        include: {
          author: {
            select: { id: true, name: true, email: true, starCitizenHandle: true },
          },
        },
        orderBy: { createdAt: "asc" },
        take: 20,
      },
      _count: {
        select: { replies: true },
      },
    },
    orderBy: [{ pinned: "desc" }, { updatedAt: "desc" }],
    take: 40,
  });
}

export async function listOrganizationForumPosts(userId: string, organizationId: string) {
  const [membership, isAdmin] = await Promise.all([
    prisma.organizationMember.findUnique({
      where: { userId_organizationId: { userId, organizationId } },
      select: { userId: true },
    }),
    isSiteAdmin(userId),
  ]);

  if (!membership && !isAdmin) {
    throw new ForbiddenError("You must be a member of this organization");
  }

  return prisma.socialPost.findMany({
    where: {
      organizationId,
    },
    include: {
      author: {
        select: { id: true, name: true, email: true, starCitizenHandle: true },
      },
      category: {
        select: { id: true, name: true, slug: true },
      },
      replies: {
        include: {
          author: {
            select: { id: true, name: true, email: true, starCitizenHandle: true },
          },
        },
        orderBy: { createdAt: "asc" },
        take: 20,
      },
      _count: {
        select: { replies: true },
      },
    },
    orderBy: [{ pinned: "desc" }, { updatedAt: "desc" }],
    take: 40,
  });
}

export async function listDashboardForumPosts(userId: string) {
  void userId;
  await ensureGuidelinePost();

  // Global forum feed for all users
  return prisma.socialPost.findMany({
    where: {
      organizationId: null,
    },
    include: {
      author: {
        select: { id: true, name: true, email: true, starCitizenHandle: true },
      },
      organization: {
        select: { id: true, name: true, tag: true },
      },
      category: {
        select: { id: true, name: true, slug: true },
      },
      _count: {
        select: { replies: true },
      },
    },
    orderBy: [{ pinned: "desc" }, { updatedAt: "desc" }],
    take: 40,
  });
}

export async function createForumPost(
  userId: string,
  input: {
    title: string;
    body: string;
    type: SocialPostType;
    categoryId?: string;
    organizationId?: string;
    agreedToGuidelines: boolean;
  }
) {
  if (!input.agreedToGuidelines) {
    throw new ValidationError("You must agree to the community guidelines before posting");
  }

  const title = input.title.trim();
  const body = input.body.trim();

  if (!title) {
    throw new ValidationError("Post title is required");
  }
  if (title.length > MAX_FORUM_TITLE_LENGTH) {
    throw new ValidationError(`Title must be ${MAX_FORUM_TITLE_LENGTH} characters or less`);
  }
  if (!body) {
    throw new ValidationError("Post body is required");
  }
  if (body.length > MAX_FORUM_BODY_LENGTH) {
    throw new ValidationError(`Post body must be ${MAX_FORUM_BODY_LENGTH} characters or less`);
  }
  if (!["TOPIC", "QUESTION"].includes(input.type)) {
    throw new ValidationError("Post type must be TOPIC or QUESTION");
  }

  if (input.categoryId) {
    const category = await prisma.socialCategory.findUnique({
      where: { id: input.categoryId },
      select: { id: true },
    });
    if (!category) {
      throw new ValidationError("Selected category does not exist");
    }
  }

  if (input.organizationId) {
    const [membership, isAdmin] = await Promise.all([
      prisma.organizationMember.findUnique({
        where: {
          userId_organizationId: {
            userId,
            organizationId: input.organizationId,
          },
        },
        select: { userId: true },
      }),
      isSiteAdmin(userId),
    ]);

    if (!membership && !isAdmin) {
      throw new ForbiddenError("You must be an organization member to post here");
    }
  }

  return prisma.socialPost.create({
    data: {
      title,
      body,
      type: input.type,
      categoryId: input.categoryId || null,
      authorId: userId,
      organizationId: input.organizationId || null,
    },
  });
}

export async function createForumReply(userId: string, postId: string, body: string) {
  const trimmed = body.trim();
  if (!trimmed) {
    throw new ValidationError("Reply is required");
  }
  if (trimmed.length > MAX_FORUM_BODY_LENGTH) {
    throw new ValidationError(`Reply must be ${MAX_FORUM_BODY_LENGTH} characters or less`);
  }

  const post = await prisma.socialPost.findUnique({
    where: { id: postId },
    select: { id: true, locked: true, organizationId: true },
  });

  if (!post) {
    throw new NotFoundError("Post not found");
  }
  if (post.locked) {
    throw new ForbiddenError("Replies are disabled for this post");
  }

  if (post.organizationId) {
    const [membership, isAdmin] = await Promise.all([
      prisma.organizationMember.findUnique({
        where: {
          userId_organizationId: {
            userId,
            organizationId: post.organizationId,
          },
        },
        select: { userId: true },
      }),
      isSiteAdmin(userId),
    ]);

    if (!membership && !isAdmin) {
      throw new ForbiddenError("You must be an organization member to reply here");
    }
  }

  return prisma.socialPostReply.create({
    data: {
      postId,
      authorId: userId,
      body: trimmed,
    },
  });
}

export async function listConversationMessages(userId: string, conversationId: string) {
  await ensureConversationAccess(userId, conversationId);

  const messages = await prisma.message.findMany({
    where: { conversationId },
    include: {
      sender: {
        select: {
          id: true,
          name: true,
          email: true,
          starCitizenHandle: true,
        },
      },
      reactions: {
        select: {
          emoji: true,
          userId: true,
        },
      },
    },
    orderBy: { createdAt: "asc" },
    take: 120,
  });

  await markConversationRead(
    userId,
    conversationId,
    messages[messages.length - 1]?.createdAt || new Date()
  );

  const senderIds = [...new Set(messages.map((m) => m.sender.id))];
  const [senderOrgMemberships, senderBadgeMap] = await Promise.all([
    prisma.organizationMember.findMany({
      where: { userId: { in: senderIds } },
      select: {
        userId: true,
        role: true,
        organization: { select: { tag: true } },
      },
    }),
    buildUsageBadgeMap(senderIds),
  ]);

  const senderOrgMap = new Map<string, Array<{ orgTag: string; role: string }>>();
  for (const membership of senderOrgMemberships) {
    const existing = senderOrgMap.get(membership.userId) ?? [];
    existing.push({ orgTag: membership.organization.tag, role: membership.role });
    senderOrgMap.set(membership.userId, existing);
  }

  return messages.map((message) => {
    const reactionSummary = message.reactions.reduce<Record<string, number>>((acc, reaction) => {
      acc[reaction.emoji] = (acc[reaction.emoji] || 0) + 1;
      return acc;
    }, {});

    return {
      ...message,
      sender: {
        ...message.sender,
        orgMemberships: senderOrgMap.get(message.sender.id) ?? [],
        badges: senderBadgeMap.get(message.sender.id) ?? [],
      },
      reactionSummary,
      myReactions: message.reactions
        .filter((reaction) => reaction.userId === userId)
        .map((reaction) => reaction.emoji),
    };
  });
}

export async function sendMessage(userId: string, conversationId: string, body: string) {
  await ensureConversationAccess(userId, conversationId);

  const trimmed = body.trim();
  if (!trimmed) {
    throw new ValidationError("Message is required");
  }

  if (trimmed.length > MAX_MESSAGE_LENGTH) {
    throw new ValidationError("Message exceeds 2000 characters");
  }

  const message = await prisma.message.create({
    data: {
      conversationId,
      senderId: userId,
      body: trimmed,
    },
    include: {
      sender: { select: { name: true, starCitizenHandle: true } },
    },
  });

  await markConversationRead(userId, conversationId, message.createdAt);

  // Parse @mentions and notify mentioned users
  const mentionMatches = [...trimmed.matchAll(/@(\w+)/g)];
  if (mentionMatches.length > 0) {
    const handles = [...new Set(mentionMatches.map((m) => m[1].toLowerCase()))];
    const mentionedUsers = await prisma.user.findMany({
      where: {
        starCitizenHandle: { in: handles, mode: "insensitive" },
        id: { not: userId },
      },
      select: { id: true },
    });

    const senderName =
      message.sender.starCitizenHandle || message.sender.name || "Someone";

    await Promise.all(
      mentionedUsers.map((u) =>
        createNotification({
          userId: u.id,
          type: "COMMENT_MENTION",
          title: `${senderName} mentioned you in a message`,
          body: trimmed.slice(0, 200),
          link: `/chat?channel=${conversationId}`,
        })
      )
    );
  }

  return message;
}

export async function toggleMessageReaction(userId: string, messageId: string, emoji: string) {
  const normalized = emoji.trim();
  if (!normalized) {
    throw new ValidationError("Reaction emoji is required");
  }

  const message = await prisma.message.findUnique({
    where: { id: messageId },
    select: { id: true, conversationId: true },
  });

  if (!message) {
    throw new NotFoundError("Message not found");
  }

  await ensureConversationAccess(userId, message.conversationId);

  const existing = await prisma.messageReaction.findUnique({
    where: {
      messageId_userId_emoji: {
        messageId,
        userId,
        emoji: normalized,
      },
    },
  });

  if (existing) {
    await prisma.messageReaction.delete({
      where: {
        messageId_userId_emoji: {
          messageId,
          userId,
          emoji: normalized,
        },
      },
    });
    return;
  }

  await prisma.messageReaction.create({
    data: {
      messageId,
      userId,
      emoji: normalized,
    },
  });
}

export async function toggleCommentReaction(userId: string, commentId: string, emoji: string) {
  const normalized = emoji.trim();
  if (!normalized) {
    throw new ValidationError("Reaction emoji is required");
  }

  const comment = await prisma.comment.findUnique({
    where: { id: commentId },
    select: { id: true },
  });

  if (!comment) {
    throw new NotFoundError("Comment not found");
  }

  const existing = await prisma.commentReaction.findUnique({
    where: {
      commentId_userId_emoji: {
        commentId,
        userId,
        emoji: normalized,
      },
    },
  });

  if (existing) {
    await prisma.commentReaction.delete({
      where: {
        commentId_userId_emoji: {
          commentId,
          userId,
          emoji: normalized,
        },
      },
    });
    return;
  }

  await prisma.commentReaction.create({
    data: {
      commentId,
      userId,
      emoji: normalized,
    },
  });
}

export async function listSocialCategories() {
  return prisma.socialCategory.findMany({
    orderBy: [{ name: "asc" }],
    select: {
      id: true,
      name: true,
      slug: true,
      description: true,
      _count: {
        select: { posts: true },
      },
    },
  });
}

export async function createSocialCategory(
  userId: string,
  input: { name: string; description?: string }
) {
  const name = input.name.trim();
  const description = input.description?.trim() || null;

  if (!name) {
    throw new ValidationError("Category name is required");
  }
  if (name.length > MAX_CATEGORY_NAME_LENGTH) {
    throw new ValidationError(`Category name must be ${MAX_CATEGORY_NAME_LENGTH} characters or less`);
  }
  if (description && description.length > MAX_CATEGORY_DESCRIPTION_LENGTH) {
    throw new ValidationError(
      `Category description must be ${MAX_CATEGORY_DESCRIPTION_LENGTH} characters or less`
    );
  }

  const baseSlug = slugifyCategoryName(name);
  if (!baseSlug) {
    throw new ValidationError("Category name must include letters or numbers");
  }

  let slug = baseSlug;
  let suffix = 2;
  // Ensure unique slug in a deterministic way.
  while (await prisma.socialCategory.findUnique({ where: { slug }, select: { id: true } })) {
    slug = `${baseSlug}-${suffix}`;
    suffix += 1;
  }

  return prisma.socialCategory.create({
    data: {
      name,
      slug,
      description,
      createdById: userId,
    },
  });
}


export async function listOrganizationChannelSettings(userId: string, organizationId: string) {
  const [membership, canManage] = await Promise.all([
    prisma.organizationMember.findUnique({
      where: { userId_organizationId: { userId, organizationId } },
      select: { id: true },
    }),
    canManageOrganizationChannels(userId, organizationId),
  ]);

  if (!membership && !canManage) {
    throw new ForbiddenError("You must be a member of this organization");
  }

  if (!canManage) {
    throw new ForbiddenError("Only leadership can view channel settings");
  }

  return prisma.conversation.findMany({
    where: { organizationId, isChannel: true },
    select: {
      id: true,
      title: true,
      description: true,
      visibility: true,
      createdAt: true,
      updatedAt: true,
    },
    orderBy: [{ visibility: "asc" }, { title: "asc" }],
  });
}

export async function createOrganizationChannel(
  userId: string,
  organizationId: string,
  input: { title: string; description?: string; visibility: OrganizationVisibility }
) {
  const canManage = await canManageOrganizationChannels(userId, organizationId);
  if (!canManage) {
    throw new ForbiddenError("Only organization owners can create channels");
  }

  const title = input.title.trim();
  if (!title) {
    throw new ValidationError("Channel title is required");
  }
  if (title.length > 80) {
    throw new ValidationError("Channel title must be 80 characters or less");
  }

  return prisma.conversation.create({
    data: {
      title,
      description: input.description?.trim() || null,
      organizationId,
      createdById: userId,
      isChannel: true,
      visibility: input.visibility,
    },
  });
}

export async function createOrganizationChatChannel(
  userId: string,
  input: {
    organizationId: string;
    title: string;
    description?: string;
    visibility?: OrganizationVisibility;
  }
) {
  const organizationId = input.organizationId;
  const canManage = await canManageOrganizationChannels(userId, organizationId);

  if (!canManage) {
    throw new ForbiddenError("Only members with channel privileges can create organization chats");
  }

  const title = input.title.trim();
  if (!title) {
    throw new ValidationError("Channel title is required");
  }
  if (title.length > 80) {
    throw new ValidationError("Channel title must be 80 characters or less");
  }

  return prisma.conversation.create({
    data: {
      title,
      description: input.description?.trim() || null,
      organizationId,
      createdById: userId,
      isChannel: true,
      visibility: input.visibility || "PUBLIC",
    },
    include: {
      organization: {
        select: { id: true, name: true, tag: true },
      },
      participants: {
        include: {
          user: {
            select: { id: true, name: true, email: true, starCitizenHandle: true },
          },
        },
      },
      messages: {
        orderBy: { createdAt: "desc" },
        take: 1,
        select: { id: true, body: true, createdAt: true },
      },
    },
  });
}

export async function renameOrganizationChatChannel(
  userId: string,
  conversationId: string,
  title: string
) {
  const channel = await prisma.conversation.findUnique({
    where: { id: conversationId },
    select: {
      id: true,
      isChannel: true,
      organizationId: true,
    },
  });

  if (!channel || !channel.isChannel || !channel.organizationId) {
    throw new NotFoundError("Organization channel not found");
  }

  const canManage = await canManageOrganizationChannels(userId, channel.organizationId);
  if (!canManage) {
    throw new ForbiddenError("Only members with channel privileges can rename organization chats");
  }

  const trimmedTitle = title.trim();
  if (!trimmedTitle) {
    throw new ValidationError("Channel title is required");
  }
  if (trimmedTitle.length > 80) {
    throw new ValidationError("Channel title must be 80 characters or less");
  }

  return prisma.conversation.update({
    where: { id: conversationId },
    data: {
      title: trimmedTitle,
    },
  });
}

export async function archiveOrganizationChatChannel(
  userId: string,
  conversationId: string,
  isArchived: boolean
) {
  const channel = await prisma.conversation.findUnique({
    where: { id: conversationId },
    select: {
      id: true,
      isChannel: true,
      organizationId: true,
    },
  });

  if (!channel || !channel.isChannel || !channel.organizationId) {
    throw new NotFoundError("Organization channel not found");
  }

  const canManage = await canManageOrganizationChannels(userId, channel.organizationId);
  if (!canManage) {
    throw new ForbiddenError("Only members with channel privileges can archive organization chats");
  }

  return prisma.conversation.update({
    where: { id: conversationId },
    data: { isArchived },
  });
}

export async function deleteOrganizationChatChannel(userId: string, conversationId: string) {
  const channel = await prisma.conversation.findUnique({
    where: { id: conversationId },
    select: {
      id: true,
      isChannel: true,
      organizationId: true,
    },
  });

  if (!channel || !channel.isChannel || !channel.organizationId) {
    throw new NotFoundError("Organization channel not found");
  }

  const canManage = await canManageOrganizationChannels(userId, channel.organizationId);
  if (!canManage) {
    throw new ForbiddenError("Only members with channel privileges can delete organization chats");
  }

  await prisma.conversation.delete({
    where: { id: conversationId },
  });

  return { id: conversationId };
}

export async function listOrganizationChatChannelAccess(userId: string, conversationId: string) {
  const channel = await prisma.conversation.findUnique({
    where: { id: conversationId },
    select: {
      id: true,
      title: true,
      isChannel: true,
      organizationId: true,
    },
  });

  if (!channel || !channel.isChannel || !channel.organizationId) {
    throw new NotFoundError("Organization channel not found");
  }

  const canManage = await canManageOrganizationChannels(userId, channel.organizationId);
  if (!canManage) {
    throw new ForbiddenError("Only members with channel privileges can manage channel access");
  }

  const [organizationMembers, allowedEntries] = await Promise.all([
    prisma.organizationMember.findMany({
      where: { organizationId: channel.organizationId },
      select: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            starCitizenHandle: true,
          },
        },
      },
      orderBy: { joinedAt: "asc" },
    }),
    prisma.conversationChannelAccess.findMany({
      where: { conversationId },
      select: { userId: true },
    }),
  ]);

  return {
    channelId: channel.id,
    channelTitle: channel.title,
    organizationId: channel.organizationId,
    members: organizationMembers.map((member) => member.user),
    allowedUserIds: allowedEntries.map((entry) => entry.userId),
  };
}

export async function updateOrganizationChatChannelAccess(
  userId: string,
  conversationId: string,
  allowedUserIds: string[]
) {
  const channel = await prisma.conversation.findUnique({
    where: { id: conversationId },
    select: {
      id: true,
      isChannel: true,
      organizationId: true,
    },
  });

  if (!channel || !channel.isChannel || !channel.organizationId) {
    throw new NotFoundError("Organization channel not found");
  }

  const canManage = await canManageOrganizationChannels(userId, channel.organizationId);
  if (!canManage) {
    throw new ForbiddenError("Only members with channel privileges can manage channel access");
  }

  const uniqueAllowed = [...new Set(allowedUserIds.filter(Boolean))];

  if (!uniqueAllowed.length) {
    await prisma.conversationChannelAccess.deleteMany({
      where: { conversationId },
    });
    return { channelId: conversationId, allowedUserIds: [] as string[] };
  }

  const validMembers = await prisma.organizationMember.findMany({
    where: {
      organizationId: channel.organizationId,
      userId: { in: uniqueAllowed },
    },
    select: { userId: true },
  });

  const validUserIds = validMembers.map((member) => member.userId);
  if (validUserIds.length !== uniqueAllowed.length) {
    throw new ValidationError("Access list contains users outside this organization");
  }

  await prisma.$transaction(async (tx) => {
    await tx.conversationChannelAccess.deleteMany({
      where: {
        conversationId,
        userId: { notIn: validUserIds },
      },
    });

    for (const memberUserId of validUserIds) {
      await tx.conversationChannelAccess.upsert({
        where: {
          conversationId_userId: {
            conversationId,
            userId: memberUserId,
          },
        },
        update: { grantedById: userId },
        create: {
          conversationId,
          userId: memberUserId,
          grantedById: userId,
        },
      });
    }
  });

  return { channelId: conversationId, allowedUserIds: validUserIds };
}

// ─── Channel Groups ──────────────────────────────────────────────────────────

export async function listConversationGroups(userId: string, organizationId: string) {
  const canManage = await canManageOrganizationChannels(userId, organizationId);
  if (!canManage) throw new ForbiddenError("Only members with channel privileges can manage groups");

  return prisma.conversationGroup.findMany({
    where: { organizationId },
    select: { id: true, name: true, position: true, organizationId: true },
    orderBy: { position: "asc" },
  });
}

export async function createConversationGroup(userId: string, organizationId: string, name: string) {
  const canManage = await canManageOrganizationChannels(userId, organizationId);
  if (!canManage) throw new ForbiddenError("Only members with channel privileges can create groups");

  const trimmed = name.trim();
  if (!trimmed || trimmed.length > 60) throw new ValidationError("Group name must be 1–60 characters");

  const maxPos = await prisma.conversationGroup.aggregate({
    where: { organizationId },
    _max: { position: true },
  });

  return prisma.conversationGroup.create({
    data: { organizationId, name: trimmed, position: (maxPos._max.position ?? -1) + 1, createdById: userId },
    select: { id: true, name: true, position: true, organizationId: true },
  });
}

export async function renameConversationGroup(userId: string, groupId: string, name: string) {
  const group = await prisma.conversationGroup.findUnique({ where: { id: groupId }, select: { id: true, organizationId: true } });
  if (!group) throw new NotFoundError("Group not found");

  const canManage = await canManageOrganizationChannels(userId, group.organizationId);
  if (!canManage) throw new ForbiddenError("Only members with channel privileges can rename groups");

  const trimmed = name.trim();
  if (!trimmed || trimmed.length > 60) throw new ValidationError("Group name must be 1–60 characters");

  return prisma.conversationGroup.update({ where: { id: groupId }, data: { name: trimmed }, select: { id: true, name: true } });
}

export async function deleteDirectConversation(userId: string, conversationId: string) {
  const conversation = await prisma.conversation.findUnique({
    where: { id: conversationId },
    include: { participants: { select: { userId: true } } },
  });

  if (!conversation) throw new NotFoundError("Conversation not found");
  if (conversation.isChannel) throw new ValidationError("Use channel delete for org channels");

  const isParticipant = conversation.participants.some((p) => p.userId === userId);
  if (!isParticipant) throw new ForbiddenError("You are not part of this conversation");

  await prisma.$transaction(async (tx) => {
    await tx.conversationParticipant.deleteMany({ where: { conversationId, userId } });
    const remaining = await tx.conversationParticipant.count({ where: { conversationId } });
    if (remaining === 0) {
      await tx.message.deleteMany({ where: { conversationId } });
      await tx.conversation.delete({ where: { id: conversationId } });
    }
  });

  return { ok: true };
}

export async function deleteConversationGroup(userId: string, groupId: string) {
  const group = await prisma.conversationGroup.findUnique({ where: { id: groupId }, select: { id: true, organizationId: true } });
  if (!group) throw new NotFoundError("Group not found");

  const canManage = await canManageOrganizationChannels(userId, group.organizationId);
  if (!canManage) throw new ForbiddenError("Only members with channel privileges can delete groups");

  // Ungroup all channels before deletion (cascade groupId → null)
  await prisma.conversation.updateMany({ where: { groupId }, data: { groupId: null } });
  await prisma.conversationGroup.delete({ where: { id: groupId } });
  return { id: groupId };
}

export async function moveChannelToGroup(userId: string, conversationId: string, groupId: string | null) {
  const channel = await prisma.conversation.findUnique({
    where: { id: conversationId },
    select: { id: true, isChannel: true, organizationId: true },
  });
  if (!channel || !channel.isChannel || !channel.organizationId) throw new NotFoundError("Channel not found");

  const canManage = await canManageOrganizationChannels(userId, channel.organizationId);
  if (!canManage) throw new ForbiddenError("Only members with channel privileges can move channels");

  if (groupId) {
    const group = await prisma.conversationGroup.findUnique({ where: { id: groupId }, select: { organizationId: true } });
    if (!group || group.organizationId !== channel.organizationId) throw new ValidationError("Group does not belong to this organization");
  }

  return prisma.conversation.update({ where: { id: conversationId }, data: { groupId }, select: { id: true, groupId: true } });
}

// ─── Polls ───────────────────────────────────────────────────────────────────

export async function listConversationPolls(userId: string, conversationId: string) {
  await ensureConversationAccess(userId, conversationId);

  const polls = await prisma.poll.findMany({
    where: { conversationId },
    include: {
      createdBy: { select: { id: true, name: true, starCitizenHandle: true } },
      options: {
        orderBy: { position: "asc" },
        include: { votes: { select: { userId: true } } },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 20,
  });

  return polls.map((poll) => ({
    id: poll.id,
    question: poll.question,
    isMultiVote: poll.isMultiVote,
    endsAt: poll.endsAt?.toISOString() ?? null,
    createdAt: poll.createdAt.toISOString(),
    createdBy: poll.createdBy,
    options: poll.options.map((opt) => ({
      id: opt.id,
      text: opt.text,
      position: opt.position,
      voteCount: opt.votes.length,
      myVote: opt.votes.some((v) => v.userId === userId),
    })),
    totalVotes: poll.options.reduce((sum, opt) => sum + opt.votes.length, 0),
    isClosed: poll.endsAt ? new Date(poll.endsAt) < new Date() : false,
  }));
}

export async function createConversationPoll(
  userId: string,
  conversationId: string,
  input: { question: string; options: string[]; isMultiVote?: boolean; endsAt?: string }
) {
  await ensureConversationAccess(userId, conversationId);

  const question = input.question.trim();
  if (!question || question.length > 300) throw new ValidationError("Poll question must be 1–300 characters");

  const options = input.options.map((o) => o.trim()).filter(Boolean);
  if (options.length < 2) throw new ValidationError("Poll requires at least 2 options");
  if (options.length > 10) throw new ValidationError("Poll can have at most 10 options");

  const endsAt = input.endsAt ? new Date(input.endsAt) : null;

  const poll = await prisma.poll.create({
    data: {
      conversationId,
      createdById: userId,
      question,
      isMultiVote: input.isMultiVote ?? false,
      endsAt,
      options: {
        create: options.map((text, position) => ({ text, position })),
      },
    },
    include: {
      createdBy: { select: { id: true, name: true, starCitizenHandle: true } },
      options: { orderBy: { position: "asc" }, include: { votes: { select: { userId: true } } } },
    },
  });

  return {
    id: poll.id,
    question: poll.question,
    isMultiVote: poll.isMultiVote,
    endsAt: poll.endsAt?.toISOString() ?? null,
    createdAt: poll.createdAt.toISOString(),
    createdBy: poll.createdBy,
    options: poll.options.map((opt) => ({ id: opt.id, text: opt.text, position: opt.position, voteCount: 0, myVote: false })),
    totalVotes: 0,
    isClosed: false,
  };
}

export async function voteOnPoll(userId: string, pollOptionId: string) {
  const option = await prisma.pollOption.findUnique({
    where: { id: pollOptionId },
    include: { poll: { select: { id: true, conversationId: true, isMultiVote: true, endsAt: true } } },
  });
  if (!option) throw new NotFoundError("Poll option not found");

  await ensureConversationAccess(userId, option.poll.conversationId);

  if (option.poll.endsAt && new Date(option.poll.endsAt) < new Date()) {
    throw new ForbiddenError("This poll has ended");
  }

  const existingVote = await prisma.pollVote.findUnique({
    where: { pollOptionId_userId: { pollOptionId, userId } },
  });

  if (existingVote) {
    // Toggle off
    await prisma.pollVote.delete({ where: { pollOptionId_userId: { pollOptionId, userId } } });
    return { voted: false };
  }

  if (!option.poll.isMultiVote) {
    // Remove any existing vote on this poll before adding new one
    const allOptions = await prisma.pollOption.findMany({ where: { pollId: option.poll.id }, select: { id: true } });
    const optionIds = allOptions.map((o) => o.id);
    await prisma.pollVote.deleteMany({ where: { userId, pollOptionId: { in: optionIds } } });
  }

  await prisma.pollVote.create({ data: { pollOptionId, userId } });
  return { voted: true };
}

// ─────────────────────────────────────────────────────────────────────────────

export async function updateOrganizationChannelVisibility(
  userId: string,
  organizationId: string,
  conversationId: string,
  visibility: OrganizationVisibility
) {
  const canManage = await canManageOrganizationChannels(userId, organizationId);
  if (!canManage) {
    throw new ForbiddenError("Only organization owners can change channel visibility");
  }

  const channel = await prisma.conversation.findUnique({
    where: { id: conversationId },
    select: { id: true, organizationId: true, isChannel: true },
  });

  if (!channel || !channel.isChannel || channel.organizationId !== organizationId) {
    throw new NotFoundError("Channel not found");
  }

  return prisma.conversation.update({
    where: { id: conversationId },
    data: { visibility },
  });
}
