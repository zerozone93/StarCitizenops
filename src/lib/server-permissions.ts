import { headers } from 'next/headers';
import { logisticsPermissions } from './logistics-permissions';

export type ServerAuthContext = {
  userId: string;
  orgId: string;
  role: string;
  permissions: Set<string>;
};

const rolePermissionMap: Record<string, string[]> = {
  LOGISTICS_ADMIN: Object.values(logisticsPermissions),
  LOGISTICS_OFFICER: [
    logisticsPermissions.toolAccess,
    logisticsPermissions.view,
    logisticsPermissions.stockCreate,
    logisticsPermissions.stockAdjust,
    logisticsPermissions.stockTransfer,
    logisticsPermissions.stockIssue,
    logisticsPermissions.stockReturn,
    logisticsPermissions.requestsCreate,
    logisticsPermissions.requestsReview,
    logisticsPermissions.requestsApprove,
    logisticsPermissions.requestsReject,
    logisticsPermissions.importsCreate,
    logisticsPermissions.importsApprove,
    logisticsPermissions.exportsCreate,
    logisticsPermissions.scansCreate,
    logisticsPermissions.scansReview,
    logisticsPermissions.auditsView,
  ],
  QUARTERMASTER: [
    logisticsPermissions.toolAccess,
    logisticsPermissions.view,
    logisticsPermissions.stockCreate,
    logisticsPermissions.stockAdjust,
    logisticsPermissions.stockTransfer,
    logisticsPermissions.stockIssue,
    logisticsPermissions.stockReturn,
    logisticsPermissions.requestsCreate,
    logisticsPermissions.requestsReview,
    logisticsPermissions.requestsApprove,
    logisticsPermissions.scansCreate,
    logisticsPermissions.scansReview,
  ],
  LOGISTICS_MEMBER: [
    logisticsPermissions.toolAccess,
    logisticsPermissions.view,
    logisticsPermissions.requestsCreate,
    logisticsPermissions.scansCreate,
  ],
  LOGISTICS_VIEWER: [logisticsPermissions.toolAccess, logisticsPermissions.view],
};

const parsePermissionsHeader = (raw: string | null) => {
  if (!raw) {
    return [];
  }

  return raw
    .split(',')
    .map((permission) => permission.trim())
    .filter(Boolean);
};

export async function getServerAuthContext(): Promise<ServerAuthContext> {
  const requestHeaders = await headers();
  const role = requestHeaders.get('x-scops-role') ?? process.env.STAROPS_DEFAULT_ROLE ?? 'LOGISTICS_ADMIN';
  const userId = requestHeaders.get('x-scops-user-id') ?? process.env.STAROPS_DEFAULT_USER_ID ?? 'demo-user';
  const orgId = requestHeaders.get('x-scops-org-id') ?? process.env.STAROPS_DEFAULT_ORG_ID ?? 'org-demo-01';

  const explicitPermissions = parsePermissionsHeader(requestHeaders.get('x-scops-permissions'));
  const rolePermissions = rolePermissionMap[role] ?? [];

  return {
    userId,
    orgId,
    role,
    permissions: new Set([...rolePermissions, ...explicitPermissions]),
  };
}

export async function requirePermission(permission: string) {
  const auth = await getServerAuthContext();
  const bypass = process.env.STAROPS_PERMISSION_BYPASS === 'true';

  return bypass || auth.permissions.has(permission);
}
