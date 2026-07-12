import "server-only";

import {
  IndustrialJobStatus,
  IndustrialJobType,
  InventoryItemCategory,
  type OrganizationVisibility,
} from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { ForbiddenError, NotFoundError, ValidationError } from "@/lib/errors";

type UserOrgScope = {
  organizationId: string;
  name: string;
  tag: string;
  visibility: OrganizationVisibility;
  role: string;
};

type CreateLocationInput = {
  organizationId: string;
  name: string;
  description?: string;
};

type CreateItemInput = {
  organizationId: string;
  locationId?: string;
  name: string;
  category: InventoryItemCategory;
  quantity: number;
  unit: string;
  sku?: string;
  notes?: string;
};

type UpdateItemInput = {
  quantity?: number;
  locationId?: string | null;
  notes?: string;
};

type CreateJobInput = {
  organizationId: string;
  title: string;
  jobType: IndustrialJobType;
  priority: number;
  targetItemId?: string;
  quantityTarget?: number;
  dueAt?: string;
  notes?: string;
};

type UpdateJobInput = {
  status?: IndustrialJobStatus;
  quantityCompleted?: number;
  notes?: string;
};

async function isPrivilegedAdmin(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { siteRole: true, id: true },
  });

  return !!user && user.siteRole === "SITE_ADMIN" && !user.id.startsWith("demo-");
}

async function assertOrgAccess(userId: string, organizationId: string) {
  const [admin, membership, organization] = await Promise.all([
    isPrivilegedAdmin(userId),
    prisma.organizationMember.findUnique({
      where: {
        userId_organizationId: {
          userId,
          organizationId,
        },
      },
      select: { role: true },
    }),
    prisma.organization.findUnique({
      where: { id: organizationId },
      select: { id: true },
    }),
  ]);

  if (!organization) {
    throw new NotFoundError("Organization not found");
  }

  if (!admin && !membership) {
    throw new ForbiddenError("You do not have access to this organization inventory");
  }
}

export async function listInventoryIndustrialOrganizations(userId: string): Promise<UserOrgScope[]> {
  const admin = await isPrivilegedAdmin(userId);

  if (admin) {
    const organizations = await prisma.organization.findMany({
      select: {
        id: true,
        name: true,
        tag: true,
        visibility: true,
      },
      orderBy: { name: "asc" },
    });

    return organizations.map((organization) => ({
      organizationId: organization.id,
      name: organization.name,
      tag: organization.tag,
      visibility: organization.visibility,
      role: "SITE_ADMIN",
    }));
  }

  const memberships = await prisma.organizationMember.findMany({
    where: { userId },
    select: {
      role: true,
      organization: {
        select: {
          id: true,
          name: true,
          tag: true,
          visibility: true,
        },
      },
    },
    orderBy: {
      organization: {
        name: "asc",
      },
    },
  });

  return memberships.map((membership) => ({
    organizationId: membership.organization.id,
    name: membership.organization.name,
    tag: membership.organization.tag,
    visibility: membership.organization.visibility,
    role: membership.role,
  }));
}

export async function getInventoryIndustrialDashboard(userId: string, organizationId: string) {
  await assertOrgAccess(userId, organizationId);

  const [locations, items, jobs] = await Promise.all([
    prisma.inventoryLocation.findMany({
      where: { organizationId },
      select: {
        id: true,
        name: true,
        description: true,
        createdAt: true,
        owner: {
          select: {
            id: true,
            name: true,
            starCitizenHandle: true,
          },
        },
      },
      orderBy: [{ name: "asc" }],
    }),
    prisma.inventoryItem.findMany({
      where: { organizationId },
      select: {
        id: true,
        name: true,
        category: true,
        quantity: true,
        unit: true,
        sku: true,
        notes: true,
        updatedAt: true,
        location: {
          select: {
            id: true,
            name: true,
          },
        },
        owner: {
          select: {
            id: true,
            name: true,
            starCitizenHandle: true,
          },
        },
        lastUpdatedBy: {
          select: {
            id: true,
            name: true,
            starCitizenHandle: true,
          },
        },
      },
      orderBy: [{ updatedAt: "desc" }],
    }),
    prisma.industrialJob.findMany({
      where: { organizationId },
      select: {
        id: true,
        title: true,
        jobType: true,
        status: true,
        priority: true,
        quantityTarget: true,
        quantityCompleted: true,
        dueAt: true,
        notes: true,
        updatedAt: true,
        targetItem: {
          select: {
            id: true,
            name: true,
            unit: true,
          },
        },
        createdBy: {
          select: {
            id: true,
            name: true,
            starCitizenHandle: true,
          },
        },
      },
      orderBy: [{ status: "asc" }, { priority: "desc" }, { dueAt: "asc" }],
    }),
  ]);

  return {
    organizationId,
    totals: {
      locations: locations.length,
      items: items.length,
      quantityOnHand: items.reduce((sum, item) => sum + item.quantity, 0),
      jobsOpen: jobs.filter((job) => job.status !== "COMPLETED" && job.status !== "CANCELLED").length,
    },
    locations,
    items,
    jobs,
  };
}

export async function createInventoryLocation(userId: string, input: CreateLocationInput) {
  await assertOrgAccess(userId, input.organizationId);

  if (!input.name.trim()) {
    throw new ValidationError("Location name is required");
  }

  return prisma.inventoryLocation.create({
    data: {
      organizationId: input.organizationId,
      ownerId: userId,
      name: input.name.trim(),
      description: input.description?.trim() || null,
    },
    select: {
      id: true,
      name: true,
      description: true,
    },
  });
}

export async function createInventoryItem(userId: string, input: CreateItemInput) {
  await assertOrgAccess(userId, input.organizationId);

  if (!input.name.trim()) {
    throw new ValidationError("Item name is required");
  }

  if (!Number.isFinite(input.quantity) || input.quantity < 0) {
    throw new ValidationError("Quantity must be zero or greater");
  }

  if (input.locationId) {
    const location = await prisma.inventoryLocation.findFirst({
      where: {
        id: input.locationId,
        organizationId: input.organizationId,
      },
      select: { id: true },
    });

    if (!location) {
      throw new NotFoundError("Inventory location not found");
    }
  }

  return prisma.inventoryItem.create({
    data: {
      organizationId: input.organizationId,
      ownerId: userId,
      lastUpdatedById: userId,
      locationId: input.locationId || null,
      name: input.name.trim(),
      category: input.category,
      quantity: input.quantity,
      unit: input.unit.trim() || "units",
      sku: input.sku?.trim() || null,
      notes: input.notes?.trim() || null,
    },
    select: {
      id: true,
      name: true,
      category: true,
      quantity: true,
      unit: true,
      sku: true,
      notes: true,
    },
  });
}

export async function updateInventoryItem(userId: string, itemId: string, input: UpdateItemInput) {
  const item = await prisma.inventoryItem.findUnique({
    where: { id: itemId },
    select: {
      id: true,
      organizationId: true,
    },
  });

  if (!item) {
    throw new NotFoundError("Inventory item not found");
  }

  await assertOrgAccess(userId, item.organizationId);

  if (typeof input.quantity === "number" && (!Number.isFinite(input.quantity) || input.quantity < 0)) {
    throw new ValidationError("Quantity must be zero or greater");
  }

  if (typeof input.locationId === "string" && input.locationId.trim()) {
    const location = await prisma.inventoryLocation.findFirst({
      where: {
        id: input.locationId,
        organizationId: item.organizationId,
      },
      select: { id: true },
    });

    if (!location) {
      throw new NotFoundError("Inventory location not found");
    }
  }

  return prisma.inventoryItem.update({
    where: { id: itemId },
    data: {
      quantity: typeof input.quantity === "number" ? input.quantity : undefined,
      locationId: input.locationId === null ? null : input.locationId,
      notes: typeof input.notes === "string" ? input.notes.trim() || null : undefined,
      lastUpdatedById: userId,
    },
    select: {
      id: true,
      quantity: true,
      locationId: true,
      notes: true,
      updatedAt: true,
    },
  });
}

export async function createIndustrialJob(userId: string, input: CreateJobInput) {
  await assertOrgAccess(userId, input.organizationId);

  if (!input.title.trim()) {
    throw new ValidationError("Job title is required");
  }

  if (!Number.isFinite(input.priority) || input.priority < 1 || input.priority > 5) {
    throw new ValidationError("Priority must be between 1 and 5");
  }

  if (typeof input.quantityTarget === "number" && input.quantityTarget < 0) {
    throw new ValidationError("Target quantity must be zero or greater");
  }

  if (input.targetItemId) {
    const targetItem = await prisma.inventoryItem.findFirst({
      where: {
        id: input.targetItemId,
        organizationId: input.organizationId,
      },
      select: { id: true },
    });

    if (!targetItem) {
      throw new NotFoundError("Target inventory item not found");
    }
  }

  return prisma.industrialJob.create({
    data: {
      organizationId: input.organizationId,
      createdById: userId,
      title: input.title.trim(),
      jobType: input.jobType,
      priority: input.priority,
      targetItemId: input.targetItemId || null,
      quantityTarget: input.quantityTarget,
      dueAt: input.dueAt ? new Date(input.dueAt) : null,
      notes: input.notes?.trim() || null,
    },
    select: {
      id: true,
      title: true,
      jobType: true,
      status: true,
      priority: true,
      quantityTarget: true,
      dueAt: true,
    },
  });
}

export async function updateIndustrialJob(userId: string, jobId: string, input: UpdateJobInput) {
  const job = await prisma.industrialJob.findUnique({
    where: { id: jobId },
    select: {
      id: true,
      organizationId: true,
    },
  });

  if (!job) {
    throw new NotFoundError("Industrial job not found");
  }

  await assertOrgAccess(userId, job.organizationId);

  if (typeof input.quantityCompleted === "number" && input.quantityCompleted < 0) {
    throw new ValidationError("Completed quantity must be zero or greater");
  }

  const status = input.status;
  const completedAt = status === "COMPLETED" ? new Date() : status ? null : undefined;

  return prisma.industrialJob.update({
    where: { id: jobId },
    data: {
      status,
      quantityCompleted: typeof input.quantityCompleted === "number" ? input.quantityCompleted : undefined,
      notes: typeof input.notes === "string" ? input.notes.trim() || null : undefined,
      completedAt,
    },
    select: {
      id: true,
      status: true,
      quantityCompleted: true,
      completedAt: true,
      updatedAt: true,
    },
  });
}
