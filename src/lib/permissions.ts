import type { OrganizationMemberRole, SiteRole } from "@prisma/client";

export type PermissionAction =
  | "createOrganization"
  | "editOrganization"
  | "inviteMembers"
  | "createOperation"
  | "editOperation"
  | "assignRoles"
  | "inviteOrganizations"
  | "viewPrivateOperations"
  | "postAfterActionReports";

export type AppPrivilegeAction =
  | "editOrganization"
  | "inviteMembers"
  | "createOperation"
  | "editOperation"
  | "assignRoles"
  | "inviteOrganizations"
  | "viewPrivateOperations"
  | "postAfterActionReports"
  | "manageChannels";

export type AppPrivilegeOverrides = Partial<Record<AppPrivilegeAction, boolean | null>>;

export const APP_PRIVILEGE_ACTIONS: AppPrivilegeAction[] = [
  "editOrganization",
  "inviteMembers",
  "createOperation",
  "editOperation",
  "assignRoles",
  "inviteOrganizations",
  "viewPrivateOperations",
  "postAfterActionReports",
  "manageChannels",
];

const siteRolePowers: Record<SiteRole, PermissionAction[]> = {
  SITE_ADMIN: [
    "createOrganization",
    "editOrganization",
    "inviteMembers",
    "createOperation",
    "editOperation",
    "assignRoles",
    "inviteOrganizations",
    "viewPrivateOperations",
    "postAfterActionReports",
  ],
  MEMBER: ["createOrganization", "createOperation", "viewPrivateOperations"],
  GUEST: [],
};

const orgRolePowers: Record<OrganizationMemberRole, PermissionAction[]> = {
  OWNER: [
    "editOrganization",
    "inviteMembers",
    "createOperation",
    "editOperation",
    "assignRoles",
    "inviteOrganizations",
    "viewPrivateOperations",
    "postAfterActionReports",
  ],
  OFFICER: [
    "inviteMembers",
    "createOperation",
    "editOperation",
    "assignRoles",
    "viewPrivateOperations",
    "postAfterActionReports",
  ],
  COMMANDER: [
    "createOperation",
    "editOperation",
    "assignRoles",
    "viewPrivateOperations",
    "postAfterActionReports",
  ],
  TEAM_LEADER: ["createOperation", "assignRoles", "viewPrivateOperations"],
  MEMBER: ["viewPrivateOperations"],
  GUEST: [],
};

export function can(
  action: PermissionAction,
  siteRole: SiteRole,
  orgRole?: OrganizationMemberRole,
) {
  if (siteRolePowers[siteRole].includes(action)) {
    return true;
  }

  if (orgRole && orgRolePowers[orgRole].includes(action)) {
    return true;
  }

  return false;
}

export function hasAppPrivilege(
  action: AppPrivilegeAction,
  siteRole: SiteRole,
  orgRole?: OrganizationMemberRole,
  overrides?: AppPrivilegeOverrides,
) {
  const override = overrides?.[action];
  if (override === true) {
    return true;
  }

  if (override === false) {
    return false;
  }

  if (action === "manageChannels") {
    if (siteRole === "SITE_ADMIN") {
      return true;
    }

    return orgRole === "OWNER";
  }

  return can(action, siteRole, orgRole);
}
