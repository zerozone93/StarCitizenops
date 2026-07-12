"use server";

import { OrganizationFocusType, OrganizationVisibility } from "@prisma/client";
import { compare, hash } from "bcryptjs";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { profileSchema } from "@/lib/validators";

export type SettingsActionState = {
  success: boolean;
  message?: string;
  formError?: string;
  fieldErrors?: Record<string, string>;
};

export const initialSettingsActionState: SettingsActionState = {
  success: false,
};

const passwordSchema = z
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

const loggedInResetPasswordSchema = z
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

const organizationPreferencesSchema = z.object({
  organizationId: z.string().cuid("Invalid organization id"),
  focusType: z.nativeEnum(OrganizationFocusType),
  visibility: z.nativeEnum(OrganizationVisibility),
  description: z.string().max(2000, "Description must be 2000 characters or less").optional().or(z.literal("")),
});

function flattenFieldErrors(fieldErrors: Record<string, string[] | undefined>) {
  return Object.fromEntries(
    Object.entries(fieldErrors)
      .map(([key, messages]) => [key, messages?.[0]])
      .filter(([, message]) => Boolean(message))
  ) as Record<string, string>;
}

export async function updateProfileSettingsAction(
  _prevState: SettingsActionState,
  formData: FormData
): Promise<SettingsActionState> {
  const user = await requireUser();

  const parsed = profileSchema.safeParse({
    name: String(formData.get("name") || ""),
    starCitizenHandle: String(formData.get("starCitizenHandle") || ""),
    bio: String(formData.get("bio") || ""),
    timezone: String(formData.get("timezone") || ""),
    availability: String(formData.get("availability") || ""),
    preferredRoles: formData.getAll("preferredRoles").map(String),
  });

  if (!parsed.success) {
    return {
      success: false,
      formError: "Please correct the highlighted profile fields.",
      fieldErrors: flattenFieldErrors(parsed.error.flatten().fieldErrors),
    };
  }

  await prisma.user.update({
    where: { id: user.id },
    data: {
      name: parsed.data.name,
      starCitizenHandle: parsed.data.starCitizenHandle || null,
      bio: parsed.data.bio || null,
      timezone: parsed.data.timezone || null,
      availability: parsed.data.availability || null,
      preferredRoles: parsed.data.preferredRoles || [],
    },
  });

  revalidatePath("/profile");
  revalidatePath("/settings");

  return {
    success: true,
    message: "Profile settings saved.",
  };
}

export async function updatePasswordAction(
  _prevState: SettingsActionState,
  formData: FormData
): Promise<SettingsActionState> {
  const user = await requireUser();

  const parsed = passwordSchema.safeParse({
    currentPassword: String(formData.get("currentPassword") || ""),
    newPassword: String(formData.get("newPassword") || ""),
    confirmPassword: String(formData.get("confirmPassword") || ""),
  });

  if (!parsed.success) {
    return {
      success: false,
      formError: "Please correct the highlighted password fields.",
      fieldErrors: flattenFieldErrors(parsed.error.flatten().fieldErrors),
    };
  }

  const account = await prisma.user.findUnique({
    where: { id: user.id },
    select: { passwordHash: true },
  });

  if (!account?.passwordHash) {
    return {
      success: false,
      formError: "This account cannot change password from settings.",
    };
  }

  const validCurrentPassword = await compare(parsed.data.currentPassword, account.passwordHash);
  if (!validCurrentPassword) {
    return {
      success: false,
      fieldErrors: {
        currentPassword: "Current password is incorrect.",
      },
    };
  }

  const nextHash = await hash(parsed.data.newPassword, 10);
  await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash: nextHash },
  });

  revalidatePath("/settings");

  return {
    success: true,
    message: "Password updated successfully.",
  };
}

export async function loggedInResetPasswordAction(
  _prevState: SettingsActionState,
  formData: FormData
): Promise<SettingsActionState> {
  const user = await requireUser();

  const parsed = loggedInResetPasswordSchema.safeParse({
    newPassword: String(formData.get("newPassword") || ""),
    confirmPassword: String(formData.get("confirmPassword") || ""),
  });

  if (!parsed.success) {
    return {
      success: false,
      formError: "Please correct the highlighted reset fields.",
      fieldErrors: flattenFieldErrors(parsed.error.flatten().fieldErrors),
    };
  }

  const nextHash = await hash(parsed.data.newPassword, 10);
  await prisma.user.update({
    where: { id: user.id },
    data: {
      passwordHash: nextHash,
      passwordResetToken: null,
      passwordResetExpiry: null,
    },
  });

  revalidatePath("/settings");

  return {
    success: true,
    message: "Password reset successfully.",
  };
}

export async function updateOrganizationPreferencesAction(
  _prevState: SettingsActionState,
  formData: FormData
): Promise<SettingsActionState> {
  const user = await requireUser();

  const parsed = organizationPreferencesSchema.safeParse({
    organizationId: String(formData.get("organizationId") || ""),
    focusType: String(formData.get("focusType") || ""),
    visibility: String(formData.get("visibility") || ""),
    description: String(formData.get("description") || ""),
  });

  if (!parsed.success) {
    return {
      success: false,
      formError: "Please correct the organization settings fields.",
      fieldErrors: flattenFieldErrors(parsed.error.flatten().fieldErrors),
    };
  }

  const organization = await prisma.organization.findFirst({
    where: {
      id: parsed.data.organizationId,
      ownerId: user.id,
    },
    select: { id: true },
  });

  if (!organization) {
    return {
      success: false,
      formError: "Only organization owners can change organization preferences.",
    };
  }

  await prisma.organization.update({
    where: { id: organization.id },
    data: {
      focusType: parsed.data.focusType,
      visibility: parsed.data.visibility,
      description: parsed.data.description || null,
    },
  });

  revalidatePath(`/organizations/${organization.id}`);
  revalidatePath("/organizations");
  revalidatePath("/settings");

  return {
    success: true,
    message: "Organization preferences saved.",
  };
}
