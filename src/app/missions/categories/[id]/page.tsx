import { prisma } from "@/lib/prisma";
import { AppShell } from "@/components/app-shell";
import { MissionTemplateCard } from "@/components/mission/MissionTemplateCard";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Metadata } from "next";
import { notFound } from "next/navigation";

interface CategoryPageProps {
  params: Promise<{ id: string }>;
}

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: CategoryPageProps): Promise<Metadata> {
  const { id } = await params;
  const category = await prisma.missionCategory.findUnique({
    where: { id },
  });

  if (!category) {
    return { title: "Category Not Found | StarCitizenOps" };
  }

  return {
    title: `${category.name} | Mission Library | StarCitizenOps`,
    description: category.description || `Browse ${category.name} mission templates`,
  };
}

export default async function CategoryPage({ params }: CategoryPageProps) {
  const { id } = await params;
  const category = await prisma.missionCategory.findUnique({
    where: { id },
    include: {
      templates: {
        orderBy: { name: "asc" },
      },
    },
  });

  if (!category) {
    notFound();
  }

  return (
    <AppShell title={category.name} subtitle="Mission category">
      <div className="space-y-6">
      <div className="flex flex-col gap-4">
        <Link href="/missions">
          <Button variant="ghost" size="sm" className="gap-2">
            <ArrowLeft className="w-4 h-4" />
            Back to Missions
          </Button>
        </Link>
      </div>

      <div className="space-y-2">
        <div className="flex flex-col gap-3">
          <div className="text-4xl">{category.icon}</div>
          <div>
            <h1 className="text-3xl font-bold text-white">{category.name}</h1>
            {category.description && <p className="text-gray-400">{category.description}</p>}
          </div>
        </div>
      </div>

      <div className="grid gap-4">
        {category.templates.map((template) => (
          <MissionTemplateCard
            key={template.id}
            id={template.id}
            name={template.name}
            summary={template.summary}
            difficulty={template.difficulty}
            estimatedDuration={template.estimatedDuration}
            recommendedPlayersMin={template.recommendedPlayersMin}
            recommendedPlayersMax={template.recommendedPlayersMax}
            categoryId={template.categoryId}
            tags={template.tags}
          />
        ))}
      </div>

      {category.templates.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-400">No mission templates in this category yet</p>
        </div>
      )}
      </div>
    </AppShell>
  );
}
