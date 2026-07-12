import { prisma } from "@/lib/prisma";
import { MissionLibraryPage } from "@/components/mission/MissionLibraryPage";
import { AppShell } from "@/components/app-shell";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Mission Library | StarCitizenOps",
  description: "Browse Star Citizen mission templates and plan your operations",
};

export const dynamic = "force-dynamic";

export default async function MissionsPage() {
  const categories = await prisma.missionCategory.findMany({
    include: {
      templates: true,
    },
    orderBy: {
      name: "asc",
    },
  });

  return (
    <AppShell title="Mission Library" subtitle="Browse contracts and plan operations">
      <div className="space-y-8">
        <div className="space-y-2">
          <h1 className="text-4xl font-bold text-white">Mission Library</h1>
          <p className="text-gray-400">
            Browse mission templates, understand required roles and assets, and create operations from proven tactics.
          </p>
        </div>

        <MissionLibraryPage categories={categories} />
      </div>
    </AppShell>
  );
}
