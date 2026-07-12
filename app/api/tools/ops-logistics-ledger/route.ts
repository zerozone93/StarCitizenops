import { NextResponse } from 'next/server';
import { logisticsPermissions } from '../../../../src/lib/logistics-permissions';
import { logisticsToolConfig } from '../../../../src/lib/tool-config';
import { getServerAuthContext, requirePermission } from '../../../../src/lib/server-permissions';

export async function GET() {
  const auth = await getServerAuthContext();
  const canView = await requirePermission(logisticsPermissions.view);

  return NextResponse.json({
    tool: logisticsToolConfig,
    access: {
      canView,
      role: auth.role,
      orgId: auth.orgId,
      userId: auth.userId,
    },
  });
}
