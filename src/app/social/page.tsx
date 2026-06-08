import { AppShell } from "@/components/app-shell";
import { LiveChat } from "@/components/social/live-chat";
import { requireUser } from "@/lib/session";
import Link from "next/link";
import {
  listConversationMessages,
  listForumPosts,
  listSocialCategories,
  listUserConversations,
} from "@/server/social";
import {
  createForumPostAction,
  createForumCategoryAction,
  createForumReplyAction,
} from "@/app/social/actions";

export const dynamic = "force-dynamic";

type SocialPageProps = {
  searchParams: Promise<{ channel?: string }>;
};

export default async function SocialPage({ searchParams }: SocialPageProps) {
  const user = await requireUser();
  const [{ channel }, conversations, forumPosts, categories] = await Promise.all([
    searchParams,
    listUserConversations(user.id),
    listForumPosts(),
    listSocialCategories(),
  ]);

  // Only show global channels here — org channels live on the org page
  const channelConversations = conversations.filter(
    (conversation) => conversation.isChannel && !conversation.organizationId
  );

  const activeConversation =
    channelConversations.find((conversation) => conversation.id === channel) ||
    channelConversations[0] ||
    null;

  const messages = activeConversation
    ? await listConversationMessages(user.id, activeConversation.id)
    : [];

  return (
    <AppShell title="Sosial Forum" subtitle="Global community forum, categories, and live channels">
      <section className="rounded-xl border border-amber-500/20 bg-slate-900/50 p-4">
        <div className="flex flex-col gap-3">
          <div>
            <h3 className="text-lg font-semibold text-amber-100">Global Forum</h3>
            <p className="mt-1 text-xs text-slate-400">All users can post topics/questions and create categories for discussion.</p>
          </div>
        </div>

        <div className="mt-4 rounded-lg border border-rose-400/25 bg-rose-500/5 p-3">
          <h4 className="text-sm font-semibold text-rose-100">Community Rules</h4>
          <ul className="mt-2 grid gap-1 text-xs text-slate-300">
            <li>1. No racism, sexism, hate speech, harassment, or personal attacks.</li>
            <li>2. No politics or inflammatory real-world debate threads.</li>
            <li>3. No slurs, discriminatory language, or abusive stereotypes.</li>
            <li>4. Stay on-topic and use clear titles/categories.</li>
            <li>5. No spam, scams, phishing links, or repeated promotions.</li>
            <li>6. No private intel leaks or posting personal/sensitive data.</li>
            <li>7. No NSFW or explicit content.</li>
            <li>8. Violations may lead to content removal and account restrictions.</li>
          </ul>
        </div>

        <form action={createForumCategoryAction} className="mt-4 grid gap-2 rounded-lg border border-cyan-500/20 bg-slate-950/60 p-3">
          <input
            name="name"
            required
            maxLength={60}
            placeholder="New category name"
            className="rounded-md border border-cyan-500/30 bg-slate-900 px-3 py-2 text-sm text-slate-100"
          />
          <input
            name="description"
            maxLength={240}
            placeholder="Short description (optional)"
            className="rounded-md border border-cyan-500/30 bg-slate-900 px-3 py-2 text-sm text-slate-100"
          />
          <button
            type="submit"
            className="rounded-md bg-cyan-400 px-4 py-2 text-sm font-semibold text-slate-950"
          >
            Create category
          </button>
        </form>

        <div className="mt-3 flex flex-wrap gap-2">
          {categories.map((category) => (
            <span key={category.id} className="rounded-full border border-cyan-500/25 bg-cyan-500/10 px-2.5 py-1 text-xs text-cyan-100">
              {category.name} ({category._count.posts})
            </span>
          ))}
          {!categories.length ? <span className="text-xs text-slate-500">No categories yet.</span> : null}
        </div>

        <form action={createForumPostAction} className="mt-4 grid gap-2 rounded-lg border border-amber-500/20 bg-slate-950/60 p-3">
          <select
            name="categoryId"
            defaultValue=""
            className="rounded-md border border-cyan-500/30 bg-slate-900 px-3 py-2 text-sm text-cyan-100"
          >
            <option value="">No category</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
          <select
            name="type"
            defaultValue="TOPIC"
            className="rounded-md border border-amber-500/30 bg-slate-900 px-3 py-2 text-sm text-amber-50"
          >
            <option value="TOPIC">Topic</option>
            <option value="QUESTION">Question</option>
          </select>
          <input
            name="title"
            placeholder="Post title"
            required
            maxLength={140}
            className="rounded-md border border-amber-500/30 bg-slate-900 px-3 py-2 text-sm text-slate-100"
          />
          <textarea
            name="body"
            placeholder="Share details, context, and what kind of responses you need"
            required
            maxLength={5000}
            className="min-h-24 rounded-md border border-amber-500/30 bg-slate-900 px-3 py-2 text-sm text-slate-100"
          />
          <label className="flex items-center gap-2 text-xs text-slate-300">
            <input type="checkbox" name="agreedToGuidelines" required className="h-4 w-4" />
            I agree to the community guidelines.
          </label>
          <button
            type="submit"
            className="rounded-md bg-amber-400 px-4 py-2 text-sm font-semibold text-slate-950"
          >
            Publish to Forum
          </button>
        </form>

        <div className="mt-4 space-y-3">
          {forumPosts.map((post) => (
            <article key={post.id} className={`rounded-lg border p-3 ${post.pinned ? "border-amber-400/50 bg-amber-500/10" : "border-slate-700 bg-slate-900/70"}`}>
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <span className={`rounded px-2 py-0.5 ${post.type === "QUESTION" ? "bg-cyan-500/20 text-cyan-100" : post.type === "GUIDELINE" ? "bg-amber-500/30 text-amber-100" : "bg-slate-700 text-slate-200"}`}>
                  {post.type}
                </span>
                {post.pinned ? <span className="rounded bg-amber-500/25 px-2 py-0.5 text-amber-100">PINNED</span> : null}
                {post.locked ? <span className="rounded bg-slate-700 px-2 py-0.5 text-slate-200">LOCKED</span> : null}
                {post.category ? (
                  <span className="rounded bg-cyan-500/20 px-2 py-0.5 text-cyan-100">#{post.category.name}</span>
                ) : null}
                <span className="text-slate-400">
                  by {post.author.starCitizenHandle || post.author.name || post.author.email || "Operator"} · {new Date(post.createdAt).toLocaleString()}
                </span>
              </div>
              <h4 className="mt-2 text-base font-semibold text-slate-100">{post.title}</h4>
              <p className="mt-2 whitespace-pre-line text-sm text-slate-300">{post.body}</p>
              <p className="mt-2 text-xs text-slate-400">Replies: {post._count.replies}</p>

              <div className="mt-3 space-y-2 border-t border-slate-700 pt-3">
                {post.replies.map((reply) => (
                  <div key={reply.id} className="rounded-md border border-slate-700 bg-slate-950/70 p-2">
                    <p className="text-xs text-slate-400">
                      {reply.author.starCitizenHandle || reply.author.name || reply.author.email || "Operator"} · {new Date(reply.createdAt).toLocaleString()}
                    </p>
                    <p className="mt-1 whitespace-pre-line text-sm text-slate-200">{reply.body}</p>
                  </div>
                ))}
                {!post.replies.length ? <p className="text-xs text-slate-500">No replies yet.</p> : null}
              </div>

              {!post.locked ? (
                <form action={createForumReplyAction} className="mt-3 flex gap-2">
                  <input type="hidden" name="postId" value={post.id} />
                  <input
                    name="body"
                    maxLength={5000}
                    required
                    placeholder="Reply to this thread"
                    className="w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100"
                  />
                  <button type="submit" className="rounded-md bg-cyan-500 px-3 py-2 text-sm font-semibold text-slate-950">
                    Reply
                  </button>
                </form>
              ) : (
                <p className="mt-3 text-xs text-slate-500">Replies are disabled for this pinned guideline.</p>
              )}
            </article>
          ))}
          {!forumPosts.length ? <p className="text-sm text-slate-400">No forum posts yet.</p> : null}
        </div>
      </section>

      <section className="grid gap-4">
        <article className="rounded-xl border border-cyan-500/20 bg-slate-900/50 p-4">
          <h3 className="text-lg font-semibold text-cyan-100">Global Channels</h3>
          <p className="mt-1 text-xs text-slate-400">Platform-wide live channels. Org channels are on your org page.</p>
          <ul className="mt-3 space-y-2 text-sm text-slate-300">
            {channelConversations.map((conversation) => (
              <li key={conversation.id} className={`rounded-lg border p-2 ${activeConversation?.id === conversation.id ? "border-cyan-500/40 bg-cyan-500/10" : "border-slate-700"}`}>
                <Link href={`/social?channel=${conversation.id}`} className="font-medium text-cyan-50 hover:text-cyan-200">
                  {conversation.title}
                </Link>
                {conversation.organization ? (
                  <p className="text-xs text-slate-400">
                    {conversation.organization.name} ({conversation.organization.tag}) · {conversation.visibility}
                  </p>
                ) : null}
                {conversation.description ? <p className="mt-1 text-xs text-slate-400">{conversation.description}</p> : null}
                <p className="mt-1 line-clamp-1 text-xs text-slate-400">{conversation.messages[0]?.body || "No messages yet"}</p>
              </li>
            ))}
            {!channelConversations.length ? <li className="text-slate-400">No channels yet.</li> : null}
          </ul>
        </article>

        <div>
          {activeConversation ? (
            <LiveChat
              conversationId={activeConversation.id}
              currentUserId={user.id}
              initialMessages={messages.map((message) => ({
                ...message,
                createdAt: message.createdAt.toISOString(),
              }))}
            />
          ) : (
            <section className="rounded-xl border border-cyan-500/20 bg-slate-900/50 p-4">
              <h3 className="text-lg font-semibold text-cyan-100">Live Command Chat</h3>
              <p className="mt-2 text-sm text-slate-400">No conversation available for your account yet.</p>
            </section>
          )}
        </div>
      </section>

    </AppShell>
  );
}
