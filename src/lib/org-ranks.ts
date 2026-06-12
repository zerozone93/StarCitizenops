import type { OrganizationMemberRole } from "@prisma/client";

const MILITARY_RANK_LABELS: Record<OrganizationMemberRole, string> = {
  OWNER: "Fleet Admiral",
  OFFICER: "Captain",
  COMMANDER: "Commander",
  TEAM_LEADER: "Lieutenant",
  MEMBER: "Crewman",
  GUEST: "Civilian Contractor",
};

export function getMilitaryRankLabel(role: OrganizationMemberRole) {
  return MILITARY_RANK_LABELS[role] ?? role;
}
