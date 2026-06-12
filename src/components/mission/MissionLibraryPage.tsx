"use client";

import { useState, useMemo } from "react";
import { MissionCategory, MissionTemplate, MissionDifficulty } from "@prisma/client";
import { MissionCategoryCard } from "./MissionCategoryCard";
import { MissionTemplateCard } from "./MissionTemplateCard";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, X } from "lucide-react";

interface MissionLibraryPageProps {
  categories: (MissionCategory & { templates: MissionTemplate[] })[];
}

export function MissionLibraryPage({ categories }: MissionLibraryPageProps) {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDifficulty, setSelectedDifficulty] = useState<MissionDifficulty | null>(null);
  const [minPlayers, setMinPlayers] = useState<number | null>(null);

  const allTemplates = useMemo(() => {
    return categories.flatMap((cat) =>
      cat.templates.map((template) => ({
        ...template,
        categoryName: cat.name,
      }))
    );
  }, [categories]);

  const filteredTemplates = useMemo(() => {
    return allTemplates.filter((template) => {
      if (selectedCategory && selectedCategory !== template.categoryId) {
        return false;
      }

      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        if (
          !template.name.toLowerCase().includes(query) &&
          !template.summary?.toLowerCase().includes(query) &&
          !template.tags?.some((tag) => tag.toLowerCase().includes(query))
        ) {
          return false;
        }
      }

      if (selectedDifficulty && template.difficulty !== selectedDifficulty) {
        return false;
      }

      if (minPlayers && template.recommendedPlayersMin < minPlayers) {
        return false;
      }

      return true;
    });
  }, [allTemplates, selectedCategory, searchQuery, selectedDifficulty, minPlayers]);

  const hasFilters = selectedCategory || searchQuery || selectedDifficulty || minPlayers;

  return (
    <div className="space-y-8">
      {/* Search and Filters */}
      <div className="space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
          <Input
            placeholder="Search missions, templates, or tags..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-gray-900 border-gray-700"
          />
        </div>

        <div className="flex gap-2 flex-wrap">
          <div className="text-xs text-gray-500 flex items-center">Difficulty:</div>
          {Object.values(MissionDifficulty).map((diff) => (
            <Button
              key={diff}
              size="sm"
              variant={selectedDifficulty === diff ? "default" : "outline"}
              onClick={() => setSelectedDifficulty(selectedDifficulty === diff ? null : diff)}
              className="text-xs"
            >
              {diff}
            </Button>
          ))}
        </div>

        {hasFilters && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setSelectedCategory(null);
              setSearchQuery("");
              setSelectedDifficulty(null);
              setMinPlayers(null);
            }}
            className="gap-2"
          >
            <X className="w-4 h-4" />
            Clear Filters
          </Button>
        )}
      </div>

      {/* No Selection - Show Categories */}
      {!selectedCategory && !searchQuery && (
        <div>
          <h2 className="text-2xl font-bold text-white mb-6">Mission Categories</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {categories.map((category) => (
              <div
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className="cursor-pointer"
              >
                <MissionCategoryCard
                  id={category.id}
                  name={category.name}
                  description={category.description}
                  icon={category.icon}
                  templateCount={category.templates.length}
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Templates View */}
      {(selectedCategory || searchQuery) && (
        <div>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-white">
              {selectedCategory
                ? categories.find((c) => c.id === selectedCategory)?.name
                : `Search Results`}
            </h2>
            {selectedCategory && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedCategory(null)}
              >
                <X className="w-4 h-4 mr-2" />
                Back
              </Button>
            )}
          </div>

          {filteredTemplates.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-400 mb-4">No missions found matching your criteria</p>
              <Button
                variant="outline"
                onClick={() => {
                  setSelectedCategory(null);
                  setSearchQuery("");
                  setSelectedDifficulty(null);
                }}
              >
                View All Missions
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredTemplates.map((template) => (
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
          )}
        </div>
      )}
    </div>
  );
}
