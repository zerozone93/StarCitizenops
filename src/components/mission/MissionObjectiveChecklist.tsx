"use client";

import { CheckCircle2, Circle } from "lucide-react";

interface MissionObjectiveChecklistProps {
  items: string[];
  title?: string;
  completed?: boolean[];
  onToggle?: (index: number) => void;
}

export function MissionObjectiveChecklist({
  items,
  title = "Objectives",
  completed = [],
  onToggle,
}: MissionObjectiveChecklistProps) {
  if (!items || items.length === 0) {
    return null;
  }

  return (
    <div className="space-y-2">
      <h4 className="text-sm font-semibold text-gray-300">{title}</h4>
      <div className="space-y-1">
        {items.map((item, idx) => {
          const isCompleted = completed[idx] || false;
          return (
            <div
              key={idx}
              className="flex items-start gap-3 p-2 rounded hover:bg-gray-900/30 cursor-pointer transition-colors"
              onClick={() => onToggle?.(idx)}
            >
              {isCompleted ? (
                <CheckCircle2 className="w-4 h-4 mt-0.5 text-green-500 flex-shrink-0" />
              ) : (
                <Circle className="w-4 h-4 mt-0.5 text-gray-500 flex-shrink-0" />
              )}
              <span className={`text-sm ${isCompleted ? "line-through text-gray-500" : "text-gray-300"}`}>{item}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
