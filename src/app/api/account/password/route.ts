import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { compare, hash } from "bcryptjs";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const updateSchema = z
  .object({
    currentPassword: z.string().min(8, "Current password is required"),
    newPassword: z.string().min(8, "New password must be at least 8 characters").max(128),
    confirmPassword: z.string().min(8, "Confirm password is required").max(128),
  })
  .superRefine((data, ctx) => {
    if (data.newPassword !== data.confirmPassword) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["confirmPassword"],
        message: "Passwords do not match",
      });
    }
  });

const resetSchema = z
  .object({
    newPassword: z.string().min(8, "New password must be at least 8 characters").max(128),
    confirmPassword: z.string().min(8, "Confirm password is required").max(128),
  })
  .superRefine((data, ctx) => {
    if (data.newPassword !== data.confirmPassword) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["confirmPassword"],
        message: "Passwords do not match",
      });
    }
  });

function flattenFieldErrors(fieldErrors: Record<string, string[] | undefined>) {
  return Object.fromEntries(
    Object.entries(fieldErrors)
      .map(([key, messages]) => [key, messages?.[0]])
      .filter(([, message]) => Boolean(message))
  ) as Record<string, string>;
}

export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const parsed = updateSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "Please correct the highlighted password fields.",
        fieldErrors: flattenFieldErrors(parsed.error.flatten().fieldErrors),
      },
      { status: 400 }
    );
  }

  const account = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { passwordHash: true },
  });

  if (!account?.passwordHash) {
    return NextResponse.json(
      { error: "This account cannot change password from settings." },
      { status: 400 }
    );
  }

  const validCurrentPassword = await compare(parsed.data.currentPassword, account.passwordHash);
  if (!validCurrentPassword) {
    return NextResponse.json(
      { error: "Please correct the highlighted password fields.", fieldErrors: { currentPassword: "Current password is incorrect." } },
      { status: 400 }
    );
  }

  const nextHash = await hash(parsed.data.newPassword, 10);
  await prisma.user.update({
    where: { id: session.user.id },
    data: { passwordHash: nextHash },
  });

  return NextResponse.json({ success: true, message: "Password updated successfully." });
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const parsed = resetSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "Please correct the highlighted reset fields.",
        fieldErrors: flattenFieldErrors(parsed.error.flatten().fieldErrors),
      },
      { status: 400 }
    );
  }

  const nextHash = await hash(parsed.data.newPassword, 10);
  await prisma.user.update({
    where: { id: session.user.id },
    data: {
      passwordHash: nextHash,
      passwordResetToken: null,
      passwordResetExpiry: null,
    },
  });

  return NextResponse.json({ success: true, message: "Password reset successfully." });
}
