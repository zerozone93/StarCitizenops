import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { LiveChat } from "@/components/social/live-chat";
import { requireUser } from "@/lib/session";
import { listConversationMessages, listUserConversations } from "@/server/social";

export const dynamic = "force-dynamic";

type ChatPageProps = {
  searchParams: Promise<{ channel?: string }>;
};

export default async function ChatPage({ searchParams }: ChatPageProps) {
  const user = await requireUser();
  const [{ channel }, conversations] = await Promise.all([
    searchParams,
    listUserConversations(user.id),
  ]);

  const activeConversation =
    conversations.find((conversation) => conversation.id === channel) || conversations[0] || null;

  const initialMessages = activeConversation
    ? await listConversationMessages(user.id, activeConversation.id)
    : [];

  return (
    <AppShell title="Comms Deck" subtitle="Direct messages and channel chat">
      <section className="grid gap-4 lg:grid-cols-[320px_minmax(0,1fr)]">
        <article className="rounded-xl border border-cyan-500/20 bg-slate-900/50 p-4">
          <h3 className="text-lg font-semibold text-cyan-100">Conversations</h3>
          <p className="mt-1 text-xs text-slate-400">Select a conversation to open live chat.</p>
          <ul className="mt-3 space-y-2 text-sm text-slate-300">
            {conversations.map((conversation) => (
              <li
                key={conversation.id}
                className={`rounded-lg border p-2 ${activeConversation?.id === conversation.id ? "border-cyan-500/40 bg-cyan-500/10" : "border-slate-700"}`}
              >
                <Link href={`/chat?channel=${conversation.id}`} className="font-medium text-cyan-50 hover:text-cyan-200">
                  {conversation.title}
                </Link>
                <p className="mt-1 line-clamp-1 text-xs text-slate-400">{conversation.messages[0]?.body || "No messages yet"}</p>
              </li>
            ))}
            {!conversations.length ? <li className="text-slate-400">No conversations yet.</li> : null}
          </ul>
        </article>

        <div>
          {activeConversation ? (
            <LiveChat
              conversationId={activeConversation.id}
              currentUserId={user.id}
              initialMessages={initialMessages.map((message) => ({
                ...message,
                createdAt: message.createdAt.toISOString(),
              }))}
            />
          ) : (
            <section className="rounded-xl border border-cyan-500/20 bg-slate-900/50 p-4">
              <h3 className="text-lg font-semibold text-cyan-100">Live Chat</h3>
              <p className="mt-2 text-sm text-slate-400">No conversation available for your account yet.</p>
            </section>
          )}
        </div>
      </section>
    </AppShell>
  );
}