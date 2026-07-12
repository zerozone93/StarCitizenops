"use client";

import { MissionTemplate } from "@prisma/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MissionDifficultyBadge } from "./MissionDifficultyBadge";
import { MissionObjectiveChecklist } from "./MissionObjectiveChecklist";
import { Users, Clock, AlertTriangle } from "lucide-react";

interface MissionTemplateDetailProps {
  template: MissionTemplate;
  children?: React.ReactNode;
}

export function MissionTemplateDetail({ template, children }: MissionTemplateDetailProps) {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-4">
        <div>
          <h1 className="text-3xl font-bold text-white">{template.name}</h1>
          {template.summary && <p className="text-gray-400 mt-2">{template.summary}</p>}
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <MissionDifficultyBadge difficulty={template.difficulty} />
          {template.estimatedDuration && (
            <Badge variant="outline" className="gap-2 bg-gray-900 border-gray-700 text-gray-300">
              <Clock className="w-3 h-3" />
              {template.estimatedDuration}
            </Badge>
          )}
          <Badge variant="outline" className="gap-2 bg-gray-900 border-gray-700 text-gray-300">
            <Users className="w-3 h-3" />
            {template.recommendedPlayersMin}-{template.recommendedPlayersMax} players
          </Badge>
        </div>
      </div>

      {/* Description */}
      {template.description && (
        <Card className="border-gray-700 bg-gray-900/50">
          <CardHeader>
            <CardTitle className="text-lg">Description</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-300 leading-relaxed">{template.description}</p>
          </CardContent>
        </Card>
      )}

      {/* Requirements Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Required Roles */}
        <Card className="border-gray-700 bg-gray-900/50">
          <CardHeader>
            <CardTitle className="text-base">Required Roles</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {template.requiredRoles && template.requiredRoles.length > 0 ? (
                template.requiredRoles.map((role, idx) => (
                  <Badge key={idx} className="bg-blue-950 text-blue-100 border-blue-700">
                    {role}
                  </Badge>
                ))
              ) : (
                <p className="text-sm text-gray-500">No specific roles required</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Optional Roles */}
        {template.optionalRoles && template.optionalRoles.length > 0 && (
          <Card className="border-gray-700 bg-gray-900/50">
            <CardHeader>
              <CardTitle className="text-base">Optional Roles</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {template.optionalRoles.map((role, idx) => (
                  <Badge key={idx} variant="outline" className="bg-blue-950/50 text-blue-200 border-blue-700">
                    {role}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Required Assets */}
        <Card className="border-gray-700 bg-gray-900/50">
          <CardHeader>
            <CardTitle className="text-base">Required Assets</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {template.requiredAssets && template.requiredAssets.length > 0 ? (
                template.requiredAssets.map((asset, idx) => (
                  <Badge key={idx} className="bg-purple-950 text-purple-100 border-purple-700">
                    {asset}
                  </Badge>
                ))
              ) : (
                <p className="text-sm text-gray-500">No specific assets required</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Optional Assets */}
        {template.optionalAssets && template.optionalAssets.length > 0 && (
          <Card className="border-gray-700 bg-gray-900/50">
            <CardHeader>
              <CardTitle className="text-base">Optional Assets</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {template.optionalAssets.map((asset, idx) => (
                  <Badge key={idx} variant="outline" className="bg-purple-950/50 text-purple-200 border-purple-700">
                    {asset}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Objectives */}
      {template.objectives && template.objectives.length > 0 && (
        <Card className="border-gray-700 bg-gray-900/50">
          <CardHeader>
            <CardTitle className="text-base">Objectives</CardTitle>
          </CardHeader>
          <CardContent>
            <MissionObjectiveChecklist items={template.objectives} title="" />
          </CardContent>
        </Card>
      )}

      {/* Execution Steps */}
      {template.executionSteps && template.executionSteps.length > 0 && (
        <Card className="border-gray-700 bg-gray-900/50">
          <CardHeader>
            <CardTitle className="text-base">Execution Steps</CardTitle>
          </CardHeader>
          <CardContent>
            <ol className="space-y-2">
              {template.executionSteps.map((step, idx) => (
                <li key={idx} className="flex gap-3">
                  <span className="font-semibold text-blue-400 flex-shrink-0">{idx + 1}.</span>
                  <span className="text-gray-300">{step}</span>
                </li>
              ))}
            </ol>
          </CardContent>
        </Card>
      )}

      {/* Preparation Checklist */}
      {template.preparationChecklist && template.preparationChecklist.length > 0 && (
        <Card className="border-gray-700 bg-gray-900/50">
          <CardHeader>
            <CardTitle className="text-base">Preparation Checklist</CardTitle>
          </CardHeader>
          <CardContent>
            <MissionObjectiveChecklist items={template.preparationChecklist} title="" />
          </CardContent>
        </Card>
      )}

      {/* Success/Failure Conditions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {template.successConditions && template.successConditions.length > 0 && (
          <Card className="border-gray-700 bg-gray-900/50">
            <CardHeader>
              <CardTitle className="text-base text-green-400">Success Conditions</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {template.successConditions.map((condition, idx) => (
                  <li key={idx} className="flex gap-2 text-gray-300">
                    <span className="text-green-500">✓</span>
                    {condition}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}

        {template.failureConditions && template.failureConditions.length > 0 && (
          <Card className="border-gray-700 bg-gray-900/50">
            <CardHeader>
              <CardTitle className="text-base text-red-400">Failure Conditions</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {template.failureConditions.map((condition, idx) => (
                  <li key={idx} className="flex gap-2 text-gray-300">
                    <span className="text-red-500">✗</span>
                    {condition}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Risks */}
      {template.risks && template.risks.length > 0 && (
        <Card className="border-orange-700/30 bg-orange-950/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base text-orange-400">
              <AlertTriangle className="w-4 h-4" />
              Risks
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {template.risks.map((risk, idx) => (
                <li key={idx} className="flex gap-2 text-gray-300">
                  <span className="text-orange-500 flex-shrink-0">⚠</span>
                  {risk}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Tags */}
      {template.tags && template.tags.length > 0 && (
        <div className="flex flex-wrap gap-2 pt-4 border-t border-gray-700">
          {template.tags.map((tag, idx) => (
            <Badge key={idx} variant="secondary" className="bg-gray-800 text-gray-300">
              {tag}
            </Badge>
          ))}
        </div>
      )}

      {/* Action Buttons */}
      {children && <div className="pt-4 flex gap-3">{children}</div>}
    </div>
  );
}
