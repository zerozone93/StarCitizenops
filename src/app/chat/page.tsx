import { AppShell } from "@/components/app-shell";
import { ChatWorkspace } from "@/components/social/chat-workspace";
import { requireUser } from "@/lib/session";
import {
  getUserUsageBadgeProfile,
  listConversationMessages,
  listOnlineMembers,
  listSocialPeople,
  listUserConversations,
} from "@/server/social";

export const dynamic = "force-dynamic";

type ChatPageProps = {
  searchParams: Promise<{ channel?: string }>;
};

export default async function ChatPage({ searchParams }: ChatPageProps) {
  const user = await requireUser();
  const [{ channel }, conversations, people, onlineMembers, badgeProfile] = await Promise.all([
    searchParams,
    listUserConversations(user.id),
    listSocialPeople(user.id),
    listOnlineMembers(user.id),
    getUserUsageBadgeProfile(user.id),
  ]);

  const activeConversation =
    conversations.find((c) => c.id === channel) || conversations[0] || null;

  const initialMessages = activeConversation
    ? await listConversationMessages(user.id, activeConversation.id)
    : [];

  return (
    <AppShell title="Comms Deck" subtitle="Channels, direct messages and tactical comms">
      <ChatWorkspace
        currentUserId={user.id}
        initialConversationId={activeConversation?.id ?? null}
        initialConversations={conversations.map((c) => ({
          ...c,
          messages: c.messages.map((m) => ({ ...m, createdAt: m.createdAt instanceof Date ? m.createdAt.toISOString() : m.createdAt })),
        }))}
        initialMessages={initialMessages.map((m) => ({
          ...m,
          createdAt: m.createdAt.toISOString(),
        }))}
        initialPeople={people}
        initialOnlineMembers={onlineMembers}
        viewerBadges={badgeProfile}
      />
    </AppShell>
  );
}