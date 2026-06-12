import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowRight } from "lucide-react";

interface MissionCategoryCardProps {
  id: string;
  name: string;
  description?: string | null;
  icon?: string | null;
  templateCount?: number;
}

export function MissionCategoryCard({
  id,
  name,
  description,
  icon = "🎯",
  templateCount = 0,
}: MissionCategoryCardProps) {
  return (
    <Link href={`/missions/categories/${id}`}>
      <Card className="group cursor-pointer border-gray-700 hover:border-blue-500 bg-gray-900/50 hover:bg-gray-900/80 transition-all hover:shadow-lg hover:shadow-blue-900/20">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="text-3xl mb-2">{icon}</div>
              <CardTitle className="text-lg group-hover:text-blue-300 transition-colors">{name}</CardTitle>
            </div>
            <ArrowRight className="w-5 h-5 text-gray-500 group-hover:text-blue-400 transition-colors self-start mt-1" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {description && <CardDescription className="text-gray-400">{description}</CardDescription>}
            {templateCount > 0 && (
              <p className="text-xs text-gray-500">
                {templateCount} template{templateCount !== 1 ? "s" : ""}
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
