import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MissionDifficultyBadge } from "./MissionDifficultyBadge";
import { MissionDifficulty } from "@prisma/client";
import { Users, Clock } from "lucide-react";

interface MissionTemplateCardProps {
  id: string;
  name: string;
  summary?: string | null;
  difficulty: MissionDifficulty;
  estimatedDuration?: string | null;
  recommendedPlayersMin: number;
  recommendedPlayersMax: number;
  categoryId: string;
  tags?: string[];
}

export function MissionTemplateCard({
  id,
  name,
  summary,
  difficulty,
  estimatedDuration,
  recommendedPlayersMin,
  recommendedPlayersMax,
  tags = [],
}: MissionTemplateCardProps) {
  return (
    <Link href={`/missions/${id}`}>
      <Card className="group cursor-pointer border-gray-700 hover:border-blue-500 bg-gray-900/50 hover:bg-gray-900/80 transition-all">
        <CardHeader>
          <CardTitle className="text-base group-hover:text-blue-300 transition-colors">{name}</CardTitle>
          {summary && <CardDescription className="text-gray-400 text-sm line-clamp-2">{summary}</CardDescription>}
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-2">
              <MissionDifficultyBadge difficulty={difficulty} />
              {estimatedDuration && (
                <div className="flex items-center gap-1 text-xs text-gray-400">
                  <Clock className="w-3 h-3" />
                  {estimatedDuration}
                </div>
              )}
            </div>

            <div className="flex items-center gap-1 text-xs text-gray-400">
              <Users className="w-3 h-3" />
              {recommendedPlayersMin}-{recommendedPlayersMax} players
            </div>

            {tags && tags.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {tags.slice(0, 2).map((tag, idx) => (
                  <Badge key={idx} variant="secondary" className="text-xs bg-gray-800 text-gray-300">
                    {tag}
                  </Badge>
                ))}
                {tags.length > 2 && (
                  <Badge variant="secondary" className="text-xs bg-gray-800 text-gray-300">
                    +{tags.length - 2}
                  </Badge>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
