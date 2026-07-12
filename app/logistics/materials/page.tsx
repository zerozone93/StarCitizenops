import { materialsDemo, materialsMetrics } from '../../../src/data/materials-demo';
import { AdminActionPanel } from '../../../src/components/AdminActionPanel';
import { OrgAccessGate } from '../../../src/components/OrgAccessGate';
import { OrgMembershipGate } from '../../../src/components/OrgMembershipGate';

export default function MaterialsPage() {
  return (
    <OrgMembershipGate>
    <OrgAccessGate>
    <main className="container" style={{ padding: '2rem 0 4rem' }}>
      <section className="card" style={{ padding: '1.5rem', marginBottom: '1.25rem' }}>
        <p style={{ textTransform: 'uppercase', letterSpacing: '0.24em', color: '#7dd3fc', fontSize: '0.78rem', marginBottom: '0.75rem' }}>Mining & Materials</p>
        <h1 style={{ marginTop: 0 }}>Materials Ledger</h1>
        <p style={{ color: '#cbd5e1', marginBottom: 0 }}>Track raw ore, mixed mining loads, refinery jobs, refined output and ownership in a batch-aware ledger.</p>
      </section>

      <section className="grid grid-2" style={{ marginBottom: '1.25rem' }}>
        {materialsMetrics.map((metric) => (
          <div key={metric.label} className="card" style={{ padding: '1.25rem' }}>
            <p style={{ color: '#94a3b8', margin: '0 0 0.35rem' }}>{metric.label}</p>
            <p style={{ fontSize: '1.5rem', margin: 0, fontWeight: 700 }}>{metric.value}</p>
          </div>
        ))}
      </section>

      <section className="grid grid-2">
        <div className="card" style={{ padding: '1.25rem' }}>
          <h2 style={{ marginTop: 0 }}>Raw and Unrefined Material</h2>
          {materialsDemo.rawOre.map((row) => (
            <div key={row.id} style={{ padding: '0.85rem', borderRadius: '12px', background: 'rgba(255,255,255,0.04)', marginBottom: '0.7rem' }}>
              <strong>{row.material}</strong>
              <p style={{ color: '#cbd5e1', margin: '0.35rem 0 0' }}>{row.batch} • {row.quantity} {row.unit} • {row.location} • {row.owner} • {row.status}</p>
              <p style={{ color: '#94a3b8', margin: '0.2rem 0 0', fontSize: '0.88rem' }}>
                Method: {row.extractionMethod} • Purity: {row.purity} • Inert: {row.inertContent} • Volatility: {row.volatility}
              </p>
              <p style={{ color: '#94a3b8', margin: '0.15rem 0 0', fontSize: '0.84rem' }}>Source: {row.source}</p>
            </div>
          ))}
        </div>

        <div className="card" style={{ padding: '1.25rem' }}>
          <h2 style={{ marginTop: 0 }}>Refining in Progress</h2>
          {materialsDemo.refining.map((row) => (
            <div key={row.id} style={{ padding: '0.85rem', borderRadius: '12px', background: 'rgba(255,255,255,0.04)', marginBottom: '0.7rem' }}>
              <strong>{row.job}</strong>
              <p style={{ color: '#cbd5e1', margin: '0.35rem 0 0' }}>{row.refinery} • {row.material} • {row.input} → {row.output} • Yield {row.yield} • {row.status}</p>
              <p style={{ color: '#94a3b8', margin: '0.2rem 0 0', fontSize: '0.88rem' }}>
                {row.method} • {row.methodProfile} • Time: {row.estimatedTime} • Cost: {row.cost}
              </p>
            </div>
          ))}
        </div>
      </section>

      <AdminActionPanel />

      <section className="card" style={{ padding: '1.25rem', marginTop: '1.25rem' }}>
        <h2 style={{ marginTop: 0 }}>Refined Material Ready for Sale or Transfer</h2>
        {materialsDemo.refined.map((row) => (
          <div key={row.id} style={{ padding: '0.85rem', borderRadius: '12px', background: 'rgba(255,255,255,0.04)', marginBottom: '0.7rem' }}>
            <strong>{row.material}</strong>
            <p style={{ color: '#cbd5e1', margin: '0.35rem 0 0' }}>{row.batch} • {row.quantity} {row.unit} • {row.location} • {row.owner} • {row.status}</p>
            <p style={{ color: '#94a3b8', margin: '0.2rem 0 0', fontSize: '0.88rem' }}>Grade: {row.grade} • Destination: {row.destination}</p>
          </div>
        ))}
      </section>
    </main>
    </OrgAccessGate>
    </OrgMembershipGate>
  );
}
