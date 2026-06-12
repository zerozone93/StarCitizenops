"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  OperationStatus,
  OperationType,
  type SiteRole,
  OrganizationMemberRole,
  OrganizationVisibility,
  ThreatLevel,
} from "@prisma/client";
import { hasAppPrivilege } from "@/lib/permissions";
import { requireUser } from "@/lib/session";
import { ValidationError } from "@/lib/errors";
import { prisma } from "@/lib/prisma";
import { organizationJoinRequestSchema } from "@/lib/validators";
import {
  acceptOrganizationInvite,
  approveJoinRequest,
  cancelJoinRequest,
  cancelOrganizationInvite,
  createJoinRequest,
  createOrganizationBulletin,
  createOrganizationInvite,
  declineOrganizationInvite,
  rejectJoinRequest,
} from "@/server/organization-social";

function requiredString(formData: FormData, key: string) {
  const value = String(formData.get(key) || "").trim();
  if (!value) throw new ValidationError(`${key} is required`);
  return value;
}

function redirectBack(formData: FormData, fallback: string) {
  return String(formData.get("redirectTo") || fallback);
}

function addRecurringOffset(base: Date, index: number, cadence: "DAILY" | "WEEKLY" | "MONTHLY") {
  const next = new Date(base);
  if (cadence === "DAILY") {
    next.setDate(next.getDate() + index);
    return next;
  }
  if (cadence === "WEEKLY") {
    next.setDate(next.getDate() + index * 7);
    return next;
  }
  next.setMonth(next.getMonth() + index);
  return next;
}

export async function submitJoinRequest(formData: FormData) {
  const user = await requireUser();
  const organizationId = requiredString(formData, "organizationId");
  const redirectTo = redirectBack(formData, `/organizations/${organizationId}`);

  const parsed = organizationJoinRequestSchema.safeParse({
    applicantHandle: String(formData.get("applicantHandle") || ""),
    preferredRole: String(formData.get("preferredRole") || ""),
    weeklyAvailability: String(formData.get("weeklyAvailability") || ""),
    reasonToJoin: String(formData.get("reasonToJoin") || ""),
    message: String(formData.get("message") || ""),
  });

  if (!parsed.success) {
    throw new ValidationError("Please complete the application fields before submitting.");
  }

  await createJoinRequest(user.id, organizationId, {
    applicantHandle: parsed.data.applicantHandle,
    preferredRole: parsed.data.preferredRole,
    weeklyAvailability: parsed.data.weeklyAvailability,
    reasonToJoin: parsed.data.reasonToJoin,
    message: parsed.data.message,
  });

  revalidatePath(`/organizations/${organizationId}`);
  revalidatePath("/organizations");
  redirect(redirectTo);
}

export async function acceptInviteAction(formData: FormData) {
  const user = await requireUser();
  const inviteId = requiredString(formData, "inviteId");
  const redirectTo = redirectBack(formData, "/organizations");

  await acceptOrganizationInvite(user.id, inviteId);

  revalidatePath("/organizations");
  redirect(redirectTo);
}

export async function declineInviteAction(formData: FormData) {
  const user = await requireUser();
  const inviteId = requiredString(formData, "inviteId");
  const redirectTo = redirectBack(formData, "/organizations");

  await declineOrganizationInvite(user.id, inviteId);

  revalidatePath("/organizations");
  redirect(redirectTo);
}

export async function cancelJoinRequestAction(formData: FormData) {
  const user = await requireUser();
  const requestId = requiredString(formData, "requestId");
  const redirectTo = redirectBack(formData, "/organizations");

  await cancelJoinRequest(user.id, requestId);

  revalidatePath("/organizations");
  redirect(redirectTo);
}

export async function sendOrganizationInviteAction(formData: FormData) {
  const user = await requireUser();
  const organizationId = requiredString(formData, "organizationId");
  const redirectTo = redirectBack(formData, `/organizations/${organizationId}`);

  await createOrganizationInvite(user.id, organizationId, {
    email: requiredString(formData, "email"),
    role: requiredString(formData, "role") as OrganizationMemberRole,
    message: String(formData.get("message") || ""),
  });

  revalidatePath(`/organizations/${organizationId}`);
  redirect(redirectTo);
}

export async function cancelOrganizationInviteAction(formData: FormData) {
  const user = await requireUser();
  const inviteId = requiredString(formData, "inviteId");
  const organizationId = requiredString(formData, "organizationId");
  const redirectTo = redirectBack(formData, `/organizations/${organizationId}`);

  await cancelOrganizationInvite(user.id, inviteId);

  revalidatePath(`/organizations/${organizationId}`);
  redirect(redirectTo);
}

export async function approveJoinRequestAction(formData: FormData) {
  const user = await requireUser();
  const requestId = requiredString(formData, "requestId");
  const organizationId = requiredString(formData, "organizationId");
  const redirectTo = redirectBack(formData, `/organizations/${organizationId}`);

  await approveJoinRequest(
    user.id,
    requestId,
    requiredString(formData, "role") as OrganizationMemberRole
  );

  revalidatePath(`/organizations/${organizationId}`);
  redirect(redirectTo);
}

export async function rejectJoinRequestAction(formData: FormData) {
  const user = await requireUser();
  const requestId = requiredString(formData, "requestId");
  const organizationId = requiredString(formData, "organizationId");
  const redirectTo = redirectBack(formData, `/organizations/${organizationId}`);

  await rejectJoinRequest(user.id, requestId, String(formData.get("reason") || ""));

  revalidatePath(`/organizations/${organizationId}`);
  redirect(redirectTo);
}

export async function postOrganizationBulletinAction(formData: FormData) {
  const user = await requireUser();
  const organizationId = requiredString(formData, "organizationId");
  const redirectTo = redirectBack(formData, `/organizations/${organizationId}`);

  await createOrganizationBulletin(user.id, organizationId, {
    title: requiredString(formData, "title"),
    body: requiredString(formData, "body"),
  });

  revalidatePath(`/organizations/${organizationId}`);
  redirect(redirectTo);
}

export async function updateJoinApplicationQuestionsAction(formData: FormData) {
  const user = await requireUser();
  const organizationId = requiredString(formData, "organizationId");
  const redirectTo = redirectBack(formData, `/organizations/${organizationId}`);

  const membership = await prisma.organizationMember.findUnique({
    where: { userId_organizationId: { userId: user.id, organizationId } },
    include: { appPrivileges: true },
  });

  const canManageGrowth = hasAppPrivilege(
    "inviteMembers",
    user.siteRole as SiteRole,
    membership?.role,
    membership?.appPrivileges || undefined
  );

  if (!canManageGrowth) {
    throw new ValidationError("You do not have permission to edit application questions");
  }

  const handlePrompt = requiredString(formData, "joinQuestionHandle").slice(0, 120);
  const preferredRolePrompt = requiredString(formData, "joinQuestionPreferredRole").slice(0, 120);
  const availabilityPrompt = requiredString(formData, "joinQuestionAvailability").slice(0, 120);
  const reasonPrompt = requiredString(formData, "joinQuestionReason").slice(0, 120);

  await prisma.organization.update({
    where: { id: organizationId },
    data: {
      joinQuestionHandle: handlePrompt,
      joinQuestionPreferredRole: preferredRolePrompt,
      joinQuestionAvailability: availabilityPrompt,
      joinQuestionReason: reasonPrompt,
    },
  });

  revalidatePath(`/organizations/${organizationId}`);
  redirect(redirectTo);
}

export async function resetJoinApplicationQuestionsAction(formData: FormData) {
  const user = await requireUser();
  const organizationId = requiredString(formData, "organizationId");
  const redirectTo = redirectBack(formData, `/organizations/${organizationId}`);

  const membership = await prisma.organizationMember.findUnique({
    where: { userId_organizationId: { userId: user.id, organizationId } },
    include: { appPrivileges: true },
  });

  const canManageGrowth = hasAppPrivilege(
    "inviteMembers",
    user.siteRole as SiteRole,
    membership?.role,
    membership?.appPrivileges || undefined
  );

  if (!canManageGrowth) {
    throw new ValidationError("You do not have permission to edit application questions");
  }

  await prisma.organization.update({
    where: { id: organizationId },
    data: {
      joinQuestionHandle: "Star Citizen Username",
      joinQuestionPreferredRole: "Preferred Role",
      joinQuestionAvailability: "Weekly Availability",
      joinQuestionReason: "Why do you want to join?",
    },
  });

  revalidatePath(`/organizations/${organizationId}`);
  redirect(redirectTo);
}

export async function createOrganizationEventAction(formData: FormData) {
  const user = await requireUser();
  const organizationId = requiredString(formData, "organizationId");
  const redirectTo = redirectBack(formData, `/organizations/${organizationId}`);

  const title = requiredString(formData, "title");
  const startTimeValue = requiredString(formData, "startTime");
  const endTimeValue = String(formData.get("endTime") || "").trim();
  const description = String(formData.get("description") || "").trim();
  const recurrence = String(formData.get("recurrence") || "NONE");
  const recurrenceCount = Math.min(
    52,
    Math.max(1, Number.parseInt(String(formData.get("recurrenceCount") || "1"), 10) || 1)
  );
  const cadence =
    recurrence === "DAILY" || recurrence === "WEEKLY" || recurrence === "MONTHLY"
      ? recurrence
      : "NONE";
  const totalOccurrences = cadence === "NONE" ? 1 : recurrenceCount;

  const startTime = new Date(startTimeValue);
  if (Number.isNaN(startTime.getTime())) {
    throw new ValidationError("Invalid start time");
  }

  const endTime = endTimeValue ? new Date(endTimeValue) : null;
  if (endTimeValue && endTime && Number.isNaN(endTime.getTime())) {
    throw new ValidationError("Invalid end time");
  }
  if (endTime && endTime.getTime() <= startTime.getTime()) {
    throw new ValidationError("Event end time must be after start time");
  }

  const membership = await prisma.organizationMember.findUnique({
    where: { userId_organizationId: { userId: user.id, organizationId } },
    include: { appPrivileges: true },
  });

  const canCreateEvent = hasAppPrivilege(
    "createOperation",
    user.siteRole as SiteRole,
    membership?.role,
    membership?.appPrivileges || undefined
  );
  if (!canCreateEvent) {
    throw new ValidationError("You do not have permission to create organization events");
  }

  for (let index = 0; index < totalOccurrences; index += 1) {
    const occurrenceStartTime =
      cadence === "NONE" ? startTime : addRecurringOffset(startTime, index, cadence);
    const occurrenceEndTime =
      endTime && cadence !== "NONE" ? addRecurringOffset(endTime, index, cadence) : endTime;

    await prisma.operation.create({
      data: {
        title,
        type: OperationType.CUSTOM_OPERATION,
        status: OperationStatus.PLANNED,
        threatLevel: ThreatLevel.LOW,
        visibility: OrganizationVisibility.PRIVATE,
        commanderId: user.id,
        organizationId,
        description: description || null,
        objective: "Organization event",
        startTime: occurrenceStartTime,
        endTime: occurrenceEndTime,
      },
    });
  }

  revalidatePath(`/organizations/${organizationId}`);
  revalidatePath("/operations");
  redirect(redirectTo);
}

export async function updateOrganizationEventAction(formData: FormData) {
  const user = await requireUser();
  const eventId = requiredString(formData, "eventId");
  const organizationId = requiredString(formData, "organizationId");
  const redirectTo = redirectBack(formData, `/organizations/${organizationId}`);

  const title = requiredString(formData, "title");
  const startTimeValue = requiredString(formData, "startTime");
  const endTimeValue = String(formData.get("endTime") || "").trim();
  const description = String(formData.get("description") || "").trim();

  const startTime = new Date(startTimeValue);
  if (Number.isNaN(startTime.getTime())) {
    throw new ValidationError("Invalid start time");
  }

  const endTime = endTimeValue ? new Date(endTimeValue) : null;
  if (endTimeValue && endTime && Number.isNaN(endTime.getTime())) {
    throw new ValidationError("Invalid end time");
  }
  if (endTime && endTime.getTime() <= startTime.getTime()) {
    throw new ValidationError("Event end time must be after start time");
  }

  const [event, membership] = await Promise.all([
    prisma.operation.findUnique({
      where: { id: eventId },
      select: { id: true, organizationId: true },
    }),
    prisma.organizationMember.findUnique({
      where: { userId_organizationId: { userId: user.id, organizationId } },
      include: { appPrivileges: true },
    }),
  ]);

  if (!event || event.organizationId !== organizationId) {
    throw new ValidationError("Event not found");
  }

  if (
    !hasAppPrivilege(
      "editOperation",
      user.siteRole as SiteRole,
      membership?.role,
      membership?.appPrivileges || undefined
    )
  ) {
    throw new ValidationError("You do not have permission to edit organization events");
  }

  await prisma.operation.update({
    where: { id: event.id },
    data: {
      title,
      startTime,
      endTime,
      description: description || null,
    },
  });

  revalidatePath(`/organizations/${organizationId}`);
  revalidatePath(`/operations/${event.id}`);
  revalidatePath("/operations");
  redirect(redirectTo);
}

export async function deleteOrganizationEventAction(formData: FormData) {
  const user = await requireUser();
  const eventId = requiredString(formData, "eventId");
  const organizationId = requiredString(formData, "organizationId");
  const redirectTo = redirectBack(formData, `/organizations/${organizationId}`);

  const [event, membership] = await Promise.all([
    prisma.operation.findUnique({
      where: { id: eventId },
      select: { id: true, organizationId: true },
    }),
    prisma.organizationMember.findUnique({
      where: { userId_organizationId: { userId: user.id, organizationId } },
      include: { appPrivileges: true },
    }),
  ]);

  if (!event || event.organizationId !== organizationId) {
    throw new ValidationError("Event not found");
  }

  if (
    !hasAppPrivilege(
      "editOperation",
      user.siteRole as SiteRole,
      membership?.role,
      membership?.appPrivileges || undefined
    )
  ) {
    throw new ValidationError("You do not have permission to delete organization events");
  }

  await prisma.operation.delete({ where: { id: event.id } });

  revalidatePath(`/organizations/${organizationId}`);
  revalidatePath("/operations");
  redirect(redirectTo);
}
