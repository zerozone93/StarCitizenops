"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/session";
import {
  createSocialCategory,
  createDirectConversation,
  createForumPost,
  createForumReply,
} from "@/server/social";
import type { SocialPostType } from "@prisma/client";

export async function createForumPostAction(formData: FormData) {
  const user = await requireUser();
  const title = String(formData.get("title") || "");
  const body = String(formData.get("body") || "");
  const type = String(formData.get("type") || "TOPIC") as SocialPostType;
  const categoryId = String(formData.get("categoryId") || "").trim();
  const organizationId = String(formData.get("organizationId") || "").trim();
  const agreedToGuidelines = String(formData.get("agreedToGuidelines") || "") === "on";
  const redirectTo = String(formData.get("redirectTo") || "/social");

  await createForumPost(user.id, {
    title,
    body,
    type,
    categoryId: categoryId || undefined,
    organizationId: organizationId || undefined,
    agreedToGuidelines,
  });
  revalidatePath("/social");
  if (organizationId) {
    revalidatePath(`/organizations/${organizationId}`);
  }
  revalidatePath(redirectTo);
}

export async function createForumCategoryAction(formData: FormData) {
  const user = await requireUser();
  const name = String(formData.get("name") || "");
  const description = String(formData.get("description") || "");

  await createSocialCategory(user.id, { name, description });
  revalidatePath("/social");
}

export async function createForumReplyAction(formData: FormData) {
  const user = await requireUser();
  const postId = String(formData.get("postId") || "");
  const body = String(formData.get("body") || "");
  const redirectTo = String(formData.get("redirectTo") || "/social");
  if (!postId || !body.trim()) return;

  await createForumReply(user.id, postId, body);
  revalidatePath("/social");
  revalidatePath(redirectTo);
}

export async function startDirectConversationAction(formData: FormData) {
  const user = await requireUser();
  const targetUserId = String(formData.get("targetUserId") || "").trim();
  if (!targetUserId) return;

  const conversation = await createDirectConversation(user.id, targetUserId);
  revalidatePath("/social");
  redirect(`/social?channel=${conversation.id}`);
}
