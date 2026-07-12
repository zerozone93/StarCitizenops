import React from 'react';
import { redirect } from 'next/navigation';
import '../../src/app/globals.css';
import { logisticsPermissions } from '../../src/lib/logistics-permissions';
import { requirePermission } from '../../src/lib/server-permissions';

export const metadata = {
  title: 'Star Citizen Ops Logistics',
  description: 'Organisation inventory and logistics foundation',
};

export default async function LogisticsLayout({ children }: { children: React.ReactNode }) {
  const canAccessTool = await requirePermission(logisticsPermissions.toolAccess);
  const canViewLogistics = await requirePermission(logisticsPermissions.view);

  if (!canAccessTool || !canViewLogistics) {
    redirect('/');
  }

  return <div>{children}</div>;
}
