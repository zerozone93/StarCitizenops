import Link from 'next/link';
import { redirect } from 'next/navigation';
import { LogisticsAdminAssignmentPanel } from '../../../src/components/LogisticsAdminAssignmentPanel';
import { logisticsPermissions } from '../../../src/lib/logistics-permissions';
import { requirePermission } from '../../../src/lib/server-permissions';

export default async function LogisticsAdminPage() {
  const canManageSettings =
    (await requirePermission(logisticsPermissions.settingsManage)) ||
    (await requirePermission(logisticsPermissions.adminsAssign));

  if (!canManageSettings) {
    redirect('/');
  }

  return (
    <main className="container" style={{ padding: '2rem 0 4rem' }}>
      <section className="card" style={{ padding: '1.5rem', marginBottom: '1rem' }}>
        <p style={{ textTransform: 'uppercase', letterSpacing: '0.24em', color: '#c9832f', fontSize: '0.78rem', marginBottom: '0.5rem' }}>Tool Administration</p>
        <h1 style={{ margin: '0 0 0.5rem' }}>Drake Ops Logistics Ledger Admin Controls</h1>
        <p style={{ margin: 0, color: '#d7c5a1' }}>Manage who can administer this logistics tool in Star Citizen Ops.</p>
        <div style={{ marginTop: '0.8rem' }}>
          <Link className="button button-secondary" href="/logistics">Back to logistics dashboard</Link>
        </div>
      </section>

      <LogisticsAdminAssignmentPanel />
    </main>
  );
}
