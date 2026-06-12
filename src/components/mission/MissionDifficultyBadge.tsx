import { MissionDifficulty } from "@prisma/client";
import { Badge } from "@/components/ui/badge";

interface MissionDifficultyBadgeProps {
  difficulty: MissionDifficulty;
}

const difficultyConfig = {
  [MissionDifficulty.EASY]: {
    label: "Easy",
    className: "bg-green-900 text-green-100 hover:bg-green-800",
  },
  [MissionDifficulty.MEDIUM]: {
    label: "Medium",
    className: "bg-yellow-900 text-yellow-100 hover:bg-yellow-800",
  },
  [MissionDifficulty.HARD]: {
    label: "Hard",
    className: "bg-red-900 text-red-100 hover:bg-red-800",
  },
  [MissionDifficulty.EXTREME]: {
    label: "Extreme",
    className: "bg-purple-900 text-purple-100 hover:bg-purple-800",
  },
};

export function MissionDifficultyBadge({ difficulty }: MissionDifficultyBadgeProps) {
  const config = difficultyConfig[difficulty];
  return <Badge className={config.className}>{config.label}</Badge>;
}
