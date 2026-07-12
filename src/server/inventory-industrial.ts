import "server-only";

import {
  IndustrialJobStatus,
  IndustrialJobType,
  InventoryItemCategory,
  RefineryRunStatus,
  ResourceTicketStatus,
  ResourceTicketType,
} from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { ForbiddenError, NotFoundError, ValidationError } from "@/lib/errors";

type InventoryOrganizationScope = {
  organizationId: string;
  name: string;
  tag: string;
  role: string;
};

type CreateLocationInput = {
  name: string;
  description?: string;
};

type CreateItemInput = {
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

type CreateRefineryRunInput = {
  inputItemId: string;
  outputItemId?: string;
  intakeQuantity: number;
  notes?: string;
};

type UpdateRefineryRunInput = {
  status?: RefineryRunStatus;
  outputQuantity?: number;
  wasteQuantity?: number;
  notes?: string;
};

type CreateResourceTicketInput = {
  itemId: string;
  quantity: number;
  unit?: string;
  type: ResourceTicketType;
  reason: string;
  notes?: string;
};

type UpdateResourceTicketInput = {
  status?: ResourceTicketStatus;
  notes?: string;
};

async function getMembershipScope(userId: string): Promise<InventoryOrganizationScope> {
  const memberships = await prisma.organizationMember.findMany({
    where: { userId },
    select: {
      role: true,
      organization: {
        select: {
          id: true,
          name: true,
          tag: true,
        },
      },
    },
    orderBy: [{ joinedAt: "asc" }],
  });

  if (memberships.length === 0) {
    throw new ForbiddenError("Join an organization to use inventory and industrial tools");
  }

  const membership = memberships[0];
  return {
    organizationId: membership.organization.id,
    name: membership.organization.name,
    tag: membership.organization.tag,
    role: membership.role,
  };
}

export async function getInventoryIndustrialDashboard(userId: string) {
  const membershipScope = await getMembershipScope(userId);
  const organizationId = membershipScope.organizationId;

  const [locations, items, jobs, refineryRuns, tickets] = await Promise.all([
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
    prisma.refineryRun.findMany({
      where: { organizationId },
      select: {
        id: true,
        intakeQuantity: true,
        outputQuantity: true,
        wasteQuantity: true,
        status: true,
        startedAt: true,
        completedAt: true,
        notes: true,
        inputItem: {
          select: {
            id: true,
            name: true,
            unit: true,
          },
        },
        outputItem: {
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
      orderBy: [{ startedAt: "desc" }],
    }),
    prisma.resourceTicket.findMany({
      where: { organizationId },
      select: {
        id: true,
        ticketNumber: true,
        quantity: true,
        unit: true,
        type: true,
        status: true,
        reason: true,
        notes: true,
        fulfilledAt: true,
        createdAt: true,
        item: {
          select: {
            id: true,
            name: true,
            unit: true,
          },
        },
        requester: {
          select: {
            id: true,
            name: true,
            starCitizenHandle: true,
          },
        },
        approvedBy: {
          select: {
            id: true,
            name: true,
            starCitizenHandle: true,
          },
        },
      },
      orderBy: [{ createdAt: "desc" }],
    }),
  ]);

  return {
    organizationId,
    organization: membershipScope,
    totals: {
      locations: locations.length,
      items: items.length,
      quantityOnHand: items.reduce((sum, item) => sum + item.quantity, 0),
      jobsOpen: jobs.filter((job) => job.status !== "COMPLETED" && job.status !== "CANCELLED").length,
      refineryActive: refineryRuns.filter((run) => run.status !== "COMPLETED" && run.status !== "CANCELLED").length,
      ticketsOpen: tickets.filter((ticket) => ticket.status !== "FULFILLED" && ticket.status !== "CANCELLED").length,
    },
    locations,
    items,
    jobs,
    refineryRuns,
    tickets,
  };
}

function buildTicketNumber() {
  const now = new Date();
  const datePart = `${now.getUTCFullYear()}${String(now.getUTCMonth() + 1).padStart(2, "0")}${String(now.getUTCDate()).padStart(2, "0")}`;
  const randomPart = Math.floor(1000 + Math.random() * 9000);
  return `RT-${datePart}-${randomPart}`;
}

export async function createInventoryLocation(userId: string, input: CreateLocationInput) {
  const membershipScope = await getMembershipScope(userId);

  if (!input.name.trim()) {
    throw new ValidationError("Location name is required");
  }

  return prisma.inventoryLocation.create({
    data: {
      organizationId: membershipScope.organizationId,
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
  const membershipScope = await getMembershipScope(userId);
  const organizationId = membershipScope.organizationId;

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
        organizationId,
      },
      select: { id: true },
    });

    if (!location) {
      throw new NotFoundError("Inventory location not found");
    }
  }

  return prisma.inventoryItem.create({
    data: {
      organizationId,
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
  const membershipScope = await getMembershipScope(userId);

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

  if (item.organizationId !== membershipScope.organizationId) {
    throw new ForbiddenError("This inventory item is outside your organization scope");
  }

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
  const membershipScope = await getMembershipScope(userId);
  const organizationId = membershipScope.organizationId;

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
        organizationId,
      },
      select: { id: true },
    });

    if (!targetItem) {
      throw new NotFoundError("Target inventory item not found");
    }
  }

  return prisma.industrialJob.create({
    data: {
      organizationId,
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
  const membershipScope = await getMembershipScope(userId);

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

  if (job.organizationId !== membershipScope.organizationId) {
    throw new ForbiddenError("This industrial job is outside your organization scope");
  }

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

export async function createRefineryRun(userId: string, input: CreateRefineryRunInput) {
  const membershipScope = await getMembershipScope(userId);

  if (!Number.isFinite(input.intakeQuantity) || input.intakeQuantity <= 0) {
    throw new ValidationError("Intake quantity must be greater than zero");
  }

  const inputItem = await prisma.inventoryItem.findFirst({
    where: {
      id: input.inputItemId,
      organizationId: membershipScope.organizationId,
    },
    select: { id: true },
  });

  if (!inputItem) {
    throw new NotFoundError("Input inventory item not found");
  }

  if (input.outputItemId) {
    const outputItem = await prisma.inventoryItem.findFirst({
      where: {
        id: input.outputItemId,
        organizationId: membershipScope.organizationId,
      },
      select: { id: true },
    });

    if (!outputItem) {
      throw new NotFoundError("Output inventory item not found");
    }
  }

  return prisma.refineryRun.create({
    data: {
      organizationId: membershipScope.organizationId,
      createdById: userId,
      inputItemId: input.inputItemId,
      outputItemId: input.outputItemId || null,
      intakeQuantity: input.intakeQuantity,
      notes: input.notes?.trim() || null,
    },
    select: {
      id: true,
      status: true,
      intakeQuantity: true,
      startedAt: true,
    },
  });
}

export async function updateRefineryRun(userId: string, runId: string, input: UpdateRefineryRunInput) {
  const membershipScope = await getMembershipScope(userId);

  const run = await prisma.refineryRun.findUnique({
    where: { id: runId },
    select: { id: true, organizationId: true },
  });

  if (!run) {
    throw new NotFoundError("Refinery run not found");
  }

  if (run.organizationId !== membershipScope.organizationId) {
    throw new ForbiddenError("This refinery run is outside your organization scope");
  }

  const completedAt = input.status === "COMPLETED" ? new Date() : undefined;

  return prisma.refineryRun.update({
    where: { id: runId },
    data: {
      status: input.status,
      outputQuantity: typeof input.outputQuantity === "number" ? input.outputQuantity : undefined,
      wasteQuantity: typeof input.wasteQuantity === "number" ? input.wasteQuantity : undefined,
      notes: typeof input.notes === "string" ? input.notes.trim() || null : undefined,
      completedAt,
    },
    select: {
      id: true,
      status: true,
      outputQuantity: true,
      wasteQuantity: true,
      completedAt: true,
      updatedAt: true,
    },
  });
}

export async function createResourceTicket(userId: string, input: CreateResourceTicketInput) {
  const membershipScope = await getMembershipScope(userId);

  if (!Number.isFinite(input.quantity) || input.quantity <= 0) {
    throw new ValidationError("Ticket quantity must be greater than zero");
  }

  if (!input.reason.trim()) {
    throw new ValidationError("Ticket reason is required");
  }

  const item = await prisma.inventoryItem.findFirst({
    where: {
      id: input.itemId,
      organizationId: membershipScope.organizationId,
    },
    select: { id: true },
  });

  if (!item) {
    throw new NotFoundError("Inventory item not found for ticket");
  }

  return prisma.resourceTicket.create({
    data: {
      ticketNumber: buildTicketNumber(),
      organizationId: membershipScope.organizationId,
      requesterId: userId,
      itemId: input.itemId,
      quantity: input.quantity,
      unit: input.unit?.trim() || "units",
      type: input.type,
      reason: input.reason.trim(),
      notes: input.notes?.trim() || null,
    },
    select: {
      id: true,
      ticketNumber: true,
      status: true,
      createdAt: true,
    },
  });
}

export async function updateResourceTicket(userId: string, ticketId: string, input: UpdateResourceTicketInput) {
  const membershipScope = await getMembershipScope(userId);

  const ticket = await prisma.resourceTicket.findUnique({
    where: { id: ticketId },
    select: { id: true, organizationId: true },
  });

  if (!ticket) {
    throw new NotFoundError("Resource ticket not found");
  }

  if (ticket.organizationId !== membershipScope.organizationId) {
    throw new ForbiddenError("This resource ticket is outside your organization scope");
  }

  const fulfilledAt = input.status === "FULFILLED" ? new Date() : undefined;
  const approvedById = input.status === "APPROVED" || input.status === "FULFILLED" ? userId : undefined;

  return prisma.resourceTicket.update({
    where: { id: ticketId },
    data: {
      status: input.status,
      notes: typeof input.notes === "string" ? input.notes.trim() || null : undefined,
      fulfilledAt,
      approvedById,
    },
    select: {
      id: true,
      status: true,
      fulfilledAt: true,
      approvedById: true,
      updatedAt: true,
    },
  });
}
