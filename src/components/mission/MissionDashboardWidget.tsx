import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { MissionTemplate, MissionCategory } from "@prisma/client";
import { ArrowRight } from "lucide-react";

interface MissionDashboardWidgetProps {
  title: string;
  description?: string;
  missions: (MissionTemplate & { category: MissionCategory })[];
  actionLink?: string;
  actionLabel?: string;
  maxDisplay?: number;
}

export function MissionDashboardWidget({
  title,
  description,
  missions,
  actionLink = "/missions",
  actionLabel = "Browse All",
  maxDisplay = 3,
}: MissionDashboardWidgetProps) {
  if (!missions || missions.length === 0) {
    return null;
  }

  const displayMissions = missions.slice(0, maxDisplay);

  return (
    <Card className="border-gray-700 bg-gray-900/50">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg">{title}</CardTitle>
            {description && <CardDescription>{description}</CardDescription>}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {displayMissions.map((mission) => (
            <Link key={mission.id} href={`/missions/${mission.id}`} className="block">
              <div className="p-3 rounded-lg border border-gray-700 hover:border-blue-500 bg-gray-950/50 hover:bg-gray-950 transition-all cursor-pointer group">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-gray-100 group-hover:text-blue-300 transition-colors text-sm">
                      {mission.name}
                    </h4>
                    <p className="text-xs text-gray-500">{mission.category.name}</p>
                  </div>
                  <span className="text-xs font-semibold text-gray-400">{mission.difficulty}</span>
                </div>
              </div>
            </Link>
          ))}

          {missions.length > maxDisplay && (
            <Link href={actionLink}>
              <Button variant="outline" size="sm" className="w-full gap-2">
                {actionLabel}
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          )}

          {missions.length <= maxDisplay && (
            <Link href={actionLink}>
              <Button variant="outline" size="sm" className="w-full gap-2">
                {actionLabel}
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          )}
        </div>
      </CardContent>
    </Card>
  );
}