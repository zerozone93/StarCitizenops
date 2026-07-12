import { getServerSession } from "next-auth";
import { revalidatePath } from "next/cache";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { toggleCommentReaction } from "@/server/social";

const COMMENT_REACTIONS = ["🔥", "🫡", "✅", "👀", "💬"];

async function createComment(formData: FormData) {
  "use server";

  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return;

  const operationId = String(formData.get("operationId") || "");
  const body = String(formData.get("body") || "").trim();
  if (!operationId || !body) return;

  await prisma.comment.create({
    data: { operationId, userId: session.user.id, body },
  });

  revalidatePath(`/operations/${operationId}`);
}

async function deleteComment(formData: FormData) {
  "use server";

  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return;

  const commentId = String(formData.get("commentId") || "");
  const operationId = String(formData.get("operationId") || "");

  const comment = await prisma.comment.findUnique({ where: { id: commentId } });
  if (!comment || comment.userId !== session.user.id) return;

  await prisma.comment.delete({ where: { id: commentId } });
  revalidatePath(`/operations/${operationId}`);
}

async function reactToComment(formData: FormData) {
  "use server";

  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return;

  const commentId = String(formData.get("commentId") || "");
  const operationId = String(formData.get("operationId") || "");
  const emoji = String(formData.get("emoji") || "");
  if (!commentId || !operationId || !emoji) return;

  await toggleCommentReaction(session.user.id, commentId, emoji);
  revalidatePath(`/operations/${operationId}`);
}

export function CommentThread({
  operationId,
  comments,
  currentUserId,
}: {
  operationId: string;
  comments: Array<{
    id: string;
    body: string;
    user: { id: string; name: string | null; starCitizenHandle: string | null };
    createdAt: Date;
    reactions: Array<{ emoji: string; userId: string }>;
  }>;
  currentUserId: string;
}) {
  return (
    <section className="space-y-3 rounded-xl border border-cyan-500/20 bg-slate-900/50 p-4">
      <h3 className="text-lg font-semibold text-cyan-100">Comments</h3>
      <form action={createComment} className="space-y-2">
        <input type="hidden" name="operationId" value={operationId} />
        <textarea
          name="body"
          required
          className="w-full rounded-md border border-cyan-500/30 bg-slate-950 p-2 text-sm"
          placeholder="Share tactical notes"
        />
        <button className="rounded-md bg-cyan-500/20 px-3 py-2 text-sm text-cyan-100" type="submit">
          Post comment
        </button>
      </form>
      <div className="space-y-2">
        {comments.map((comment) => (
          <article key={comment.id} className="rounded-md border border-cyan-500/20 p-3 text-sm">
            <p className="mb-1 text-cyan-100">{comment.user.starCitizenHandle || comment.user.name || "Operator"}</p>
            <p className="text-slate-300">{comment.body}</p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {COMMENT_REACTIONS.map((emoji) => {
                const count = comment.reactions.filter((reaction) => reaction.emoji === emoji).length;
                const active = comment.reactions.some(
                  (reaction) => reaction.emoji === emoji && reaction.userId === currentUserId
                );

                return (
                  <form action={reactToComment} key={`${comment.id}-${emoji}`}>
                    <input type="hidden" name="commentId" value={comment.id} />
                    <input type="hidden" name="operationId" value={operationId} />
                    <input type="hidden" name="emoji" value={emoji} />
                    <button
                      type="submit"
                      className={`rounded-md border px-2 py-1 text-xs ${active ? "border-cyan-300 bg-cyan-400/20 text-cyan-100" : "border-slate-600 bg-slate-800/80 text-slate-200"}`}
                    >
                      {emoji} {count ? count : ""}
                    </button>
                  </form>
                );
              })}
            </div>
            <form action={deleteComment} className="mt-2">
              <input type="hidden" name="commentId" value={comment.id} />
              <input type="hidden" name="operationId" value={operationId} />
              <button type="submit" className="text-xs text-rose-300">Delete</button>
            </form>
          </article>
        ))}
      </div>
    </section>
  );
}
