import { demoInventory } from '../../../src/data/logistics-demo';
import { OrgAccessGate } from '../../../src/components/OrgAccessGate';
import { OrgMembershipGate } from '../../../src/components/OrgMembershipGate';

export default function LogisticsStockPage() {
  return (
    <OrgMembershipGate>
    <OrgAccessGate>
    <main className="container" style={{ padding: '2rem 0 4rem' }}>
      <section className="card" style={{ padding: '1.5rem', marginBottom: '1.25rem' }}>
        <h1 style={{ marginTop: 0 }}>Stock Ledger</h1>
        <p style={{ color: '#cbd5e1', marginBottom: 0 }}>This is the org-integrated inventory workspace for managing stock by location and item.</p>
      </section>

      <section className="card" style={{ padding: '1.25rem' }}>
        <div style={{ display: 'grid', gap: '0.85rem' }}>
          {demoInventory.map((item) => (
            <div key={item.id} style={{ padding: '1rem', borderRadius: '14px', background: 'rgba(255,255,255,0.04)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.75rem', alignItems: 'center' }}>
                <strong>{item.name}</strong>
                <span style={{ color: item.status === 'Critical' ? '#fda4af' : item.status === 'Low' ? '#fcd34d' : '#86efac' }}>{item.status}</span>
              </div>
              <p style={{ color: '#cbd5e1', margin: '0.35rem 0 0' }}>
                {item.category} • {item.location} • Total {item.total} • Available {item.available} • Reserved {item.reserved} • Issued {item.issued}
              </p>
            </div>
          ))}
        </div>
      </section>
    </main>
    </OrgAccessGate>
    </OrgMembershipGate>
  );
}
