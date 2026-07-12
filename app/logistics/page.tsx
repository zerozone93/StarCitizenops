import { MemberSubmissionPortal } from '../../src/components/MemberSubmissionPortal';
import { OrgMembershipGate } from '../../src/components/OrgMembershipGate';
import { logisticsToolConfig } from '../../src/lib/tool-config';
import Link from 'next/link';

export default function LogisticsDashboardPage() {
  return (
    <OrgMembershipGate>
      <main className="container" style={{ padding: '2rem 0 4rem' }}>
        <MemberSubmissionPortal />

        <section className="card" style={{ padding: '2rem', marginTop: '1.25rem' }}>
          <p style={{ textTransform: 'uppercase', letterSpacing: '0.24em', color: '#c9832f', fontSize: '0.78rem', marginBottom: '0.75rem' }}>{logisticsToolConfig.name}</p>
          <h1 style={{ fontSize: '2.2rem', margin: '0 0 0.75rem' }}>Contribution review portal</h1>
          <p style={{ color: '#d7c5a1', lineHeight: 1.7, maxWidth: '760px' }}>
            Members can either offer stock to the org or request stock from the org, upload a screenshot when needed, and let AI review the submission before admins approve or reject it.
          </p>
          <div style={{ marginTop: '1rem' }}>
            <Link className="button button-secondary" href="/logistics/admin">Assign logistics admins</Link>
          </div>
        </section>
      </main>
    </OrgMembershipGate>
  );
}
