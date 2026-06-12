import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const organizations = await prisma.organization.findMany({
    select: {
      id: true,
      name: true,
      tag: true,
      visibility: true,
      _count: {
        select: {
          members: true,
        },
      },
    },
    orderBy: { name: "asc" },
  });

  return NextResponse.json(
    organizations.map((org) => ({
      id: org.id,
      name: org.name,
      tag: org.tag,
      visibility: org.visibility,
      memberCount: org._count.members,
    }))
  );
}
