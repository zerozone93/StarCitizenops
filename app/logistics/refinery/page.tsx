import { OrgAccessGate } from '../../../src/components/OrgAccessGate';
import { OrgMembershipGate } from '../../../src/components/OrgMembershipGate';

export default function RefineryPage() {
  return (
    <OrgMembershipGate>
    <OrgAccessGate>
    <main className="container" style={{ padding: '2rem 0 4rem' }}>
      <section className="card" style={{ padding: '1.5rem' }}>
        <h1 style={{ marginTop: 0 }}>Refinery Jobs</h1>
        <p style={{ color: '#cbd5e1' }}>Create, review, complete and collect refinery jobs while preserving ownership shares and losses.</p>
        <div style={{ padding: '1rem', borderRadius: '14px', background: 'rgba(255,255,255,0.04)', marginTop: '1rem' }}>
          <p style={{ margin: 0, color: '#cbd5e1' }}>This mockup includes the refinery workflow shell for the next design iteration.</p>
        </div>
      </section>
    </main>
    </OrgAccessGate>
    </OrgMembershipGate>
  );
}
