import { prisma } from "@/lib/prisma";
import { ForbiddenError, NotFoundError } from "@/lib/errors";

export async function createComment(userId: string, operationId: string, body: string) {
  const op = await prisma.operation.findUnique({ where: { id: operationId } });
  if (!op) throw new NotFoundError("Operation not found");
  return prisma.comment.create({ data: { userId, operationId, body } });
}

export async function deleteComment(userId: string, commentId: string) {
  const comment = await prisma.comment.findUnique({ where: { id: commentId } });
  if (!comment) throw new NotFoundError("Comment not found");
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (comment.userId !== userId && user?.siteRole !== "SITE_ADMIN") throw new ForbiddenError();
  return prisma.comment.delete({ where: { id: commentId } });
}

export async function listCommentsForOperation(operationId: string) {
  return prisma.comment.findMany({
    where: { operationId },
    include: { user: { select: { id: true, name: true, image: true } } },
    orderBy: { createdAt: "asc" },
  });
}
