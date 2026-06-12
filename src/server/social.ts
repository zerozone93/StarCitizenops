import { prisma } from "@/lib/prisma";
import { ForbiddenError, NotFoundError, ValidationError } from "@/lib/errors";
import { isSiteAdmin } from "@/server/permissions";
import { hasAppPrivilege } from "@/lib/permissions";
import { createNotification } from "@/server/notifications";
import type { OrganizationMemberRole, OrganizationVisibility, SocialPostType } from "@prisma/client";

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

async function canAccessChannel(userId: string, conversationId: string) {
  const conversation = await prisma.conversation.findUnique({
    where: { id: conversationId },
    select: {
      id: true,
      isChannel: true,
      visibility: true,
      organizationId: true,
      createdById: true,
    },
  });

  if (!conversation) {
    throw new NotFoundError("Conversation not found");
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

export async function listOrganizationChannels(userId: string, organizationId: string) {
  await ensureOrganizationChannelsForUser(userId);

  const membership = await prisma.organizationMember.findUnique({
    where: { userId_organizationId: { userId, organizationId } },
    select: { role: true },
  });

  const isAdmin = await isSiteAdmin(userId);
  const isLeadership = isAdmin || LEADERSHIP_ROLES.includes(membership?.role as OrganizationMemberRole);

  return prisma.conversation.findMany({
    where: {
      organizationId,
      isChannel: true,
      ...(isLeadership ? {} : { visibility: "PUBLIC" }),
    },
    include: {
      messages: {
        orderBy: { createdAt: "desc" },
        take: 1,
        select: { id: true, body: true, createdAt: true },
      },
    },
    orderBy: { createdAt: "asc" },
  });
}

export async function listUserConversations(userId: string) {
  await ensureGlobalChannels(userId);
  const hasPrivilegedAccess = await hasGlobalPrivilegedChatAccess(userId);

  const conversations = await prisma.conversation.findMany({
    where: {
      OR: [
        {
          isChannel: true,
          organizationId: null,
          ...(hasPrivilegedAccess ? {} : { visibility: "PUBLIC" }),
        },
        {
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

  return conversations;
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

  return users.map((user) => ({
    ...user,
    isFollowing: followingIds.has(user.id),
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
  return prisma.user.findMany({
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

  return messages.map((message) => {
    const reactionSummary = message.reactions.reduce<Record<string, number>>((acc, reaction) => {
      acc[reaction.emoji] = (acc[reaction.emoji] || 0) + 1;
      return acc;
    }, {});

    return {
      ...message,
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
          link: `/social?channel=${conversationId}`,
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
  const [membership, isAdmin, user] = await Promise.all([
    prisma.organizationMember.findUnique({
      where: { userId_organizationId: { userId, organizationId } },
      include: { appPrivileges: true },
    }),
    isSiteAdmin(userId),
    prisma.user.findUnique({ where: { id: userId }, select: { siteRole: true } }),
  ]);

  if (!membership && !isAdmin) {
    throw new ForbiddenError("You must be a member of this organization");
  }

  if (
    !isAdmin &&
    !hasAppPrivilege(
      "manageChannels",
      user?.siteRole || "MEMBER",
      membership?.role,
      membership?.appPrivileges || undefined
    )
  ) {
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
  const [membership, isAdmin, user] = await Promise.all([
    prisma.organizationMember.findUnique({
      where: { userId_organizationId: { userId, organizationId } },
      include: { appPrivileges: true },
    }),
    isSiteAdmin(userId),
    prisma.user.findUnique({ where: { id: userId }, select: { siteRole: true } }),
  ]);

  if (
    !isAdmin &&
    !hasAppPrivilege(
      "manageChannels",
      user?.siteRole || "MEMBER",
      membership?.role,
      membership?.appPrivileges || undefined
    )
  ) {
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

export async function updateOrganizationChannelVisibility(
  userId: string,
  organizationId: string,
  conversationId: string,
  visibility: OrganizationVisibility
) {
  const [membership, isAdmin, user] = await Promise.all([
    prisma.organizationMember.findUnique({
      where: { userId_organizationId: { userId, organizationId } },
      include: { appPrivileges: true },
    }),
    isSiteAdmin(userId),
    prisma.user.findUnique({ where: { id: userId }, select: { siteRole: true } }),
  ]);

  if (
    !isAdmin &&
    !hasAppPrivilege(
      "manageChannels",
      user?.siteRole || "MEMBER",
      membership?.role,
      membership?.appPrivileges || undefined
    )
  ) {
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
