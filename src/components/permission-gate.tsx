import type { ReactNode } from "react";
import { can, type PermissionAction } from "@/lib/permissions";
import { SiteRole, OrganizationMemberRole } from "@prisma/client";

type PermissionGateProps = {
  children: ReactNode;
  action: PermissionAction;
  siteRole?: SiteRole;
  orgRole?: OrganizationMemberRole;
  fallback?: ReactNode;
};

export function PermissionGate({
  children,
  action,
  siteRole = SiteRole.GUEST,
  orgRole,
  fallback = <p className="text-sm text-rose-300">Permission required.</p>,
}: PermissionGateProps) {
  return can(action, siteRole, orgRole) ? children : fallback;
}
