import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '../../../../src/lib/prisma';
import { logisticsPermissions } from '../../../../src/lib/logistics-permissions';
import { getServerAuthContext, requirePermission } from '../../../../src/lib/server-permissions';

const assignAdminSchema = z.object({
  userId: z.string().min(1),
});

const deactivateSchema = z.object({
  userId: z.string().min(1),
});

export async function GET() {
  const auth = await getServerAuthContext();
  const canView = await requirePermission(logisticsPermissions.view);

  if (!canView) {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  }

  const admins = await prisma.logisticsOrgAdmin.findMany({
    where: {
      organisationId: auth.orgId,
      active: true,
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  return NextResponse.json({ admins });
}

export async function POST(request: Request) {
  const auth = await getServerAuthContext();
  const canManage =
    (await requirePermission(logisticsPermissions.settingsManage)) ||
    (await requirePermission(logisticsPermissions.adminsAssign));

  if (!canManage) {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  }

  const payload = assignAdminSchema.safeParse(await request.json());
  if (!payload.success) {
    return NextResponse.json({ error: payload.error.flatten() }, { status: 400 });
  }

  const admin = await prisma.logisticsOrgAdmin.upsert({
    where: {
      organisationId_userId: {
        organisationId: auth.orgId,
        userId: payload.data.userId,
      },
    },
    create: {
      organisationId: auth.orgId,
      userId: payload.data.userId,
      assignedBy: auth.userId,
      active: true,
    },
    update: {
      active: true,
      assignedBy: auth.userId,
    },
  });

  return NextResponse.json({ admin });
}

export async function DELETE(request: Request) {
  const auth = await getServerAuthContext();
  const canManage =
    (await requirePermission(logisticsPermissions.settingsManage)) ||
    (await requirePermission(logisticsPermissions.adminsAssign));

  if (!canManage) {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  }

  const payload = deactivateSchema.safeParse(await request.json());
  if (!payload.success) {
    return NextResponse.json({ error: payload.error.flatten() }, { status: 400 });
  }

  const admin = await prisma.logisticsOrgAdmin.upsert({
    where: {
      organisationId_userId: {
        organisationId: auth.orgId,
        userId: payload.data.userId,
      },
    },
    create: {
      organisationId: auth.orgId,
      userId: payload.data.userId,
      assignedBy: auth.userId,
      active: false,
    },
    update: {
      active: false,
      assignedBy: auth.userId,
    },
  });

  return NextResponse.json({ admin });
}
