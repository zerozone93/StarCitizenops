import { prisma } from "@/lib/prisma";
import { AppShell } from "@/components/app-shell";
import { MissionTemplateDetail } from "@/components/mission/MissionTemplateDetail";
import { CreateOperationFromTemplateButton } from "@/components/mission/CreateOperationFromTemplateButton";
import { MissionReadinessPanel } from "@/components/fleet/MissionReadinessPanel";
import { compareFleetToMissionRequirements, getUserFleet } from "@/lib/fleet";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Metadata } from "next";
import { notFound } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

interface MissionDetailPageProps {
  params: Promise<{ id: string }>;
}

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: MissionDetailPageProps): Promise<Metadata> {
  const { id } = await params;
  const template = await prisma.missionTemplate.findUnique({
    where: { id },
  });

  if (!template) {
    return { title: "Mission Not Found | StarCitizenOps" };
  }

  return {
    title: `${template.name} | Mission Library | StarCitizenOps`,
    description: template.summary || "Mission template details and planning information",
  };
}

export default async function MissionDetailPage({ params }: MissionDetailPageProps) {
  const { id } = await params;
  const [template, session] = await Promise.all([
    prisma.missionTemplate.findUnique({
      where: { id },
      include: { category: true },
    }),
    getServerSession(authOptions),
  ]);

  if (!template) notFound();

  let missionReadiness = null;
  if (session?.user?.id) {
    const fleet = await getUserFleet(session.user.id);
    missionReadiness = compareFleetToMissionRequirements(fleet.assets, template);
  }

  return (
    <AppShell title={template.name} subtitle={template.category.name}>
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Link href="/missions">
            <Button variant="ghost" size="sm" className="gap-2">
              <ArrowLeft className="w-4 h-4" />
              Back to Missions
            </Button>
          </Link>
          <p className="text-sm text-gray-500">{template.category.name}</p>
        </div>

        <MissionTemplateDetail template={template}>
          <CreateOperationFromTemplateButton templateId={template.id} templateName={template.name} />
        </MissionTemplateDetail>

        {missionReadiness ? (
          <MissionReadinessPanel readiness={missionReadiness} />
        ) : null}
      </div>
    </AppShell>
  );
}
