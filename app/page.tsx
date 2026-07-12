import Link from 'next/link';
import { logisticsToolConfig } from '../src/lib/tool-config';

const metrics = [
  { label: 'Active stock items', value: '184' },
  { label: 'Units available', value: '1,248' },
  { label: 'Open requests', value: '12' },
  { label: 'Pending approvals', value: '4' },
];

const tools = [
  {
    id: logisticsToolConfig.id,
    name: logisticsToolConfig.name,
    description: logisticsToolConfig.shortDescription,
    route: logisticsToolConfig.route,
    adminRoute: logisticsToolConfig.adminRoute,
  },
];

export default function HomePage() {
  return (
    <main className="container" style={{ padding: '2rem 0 4rem' }}>
      <section className="card" style={{ padding: '2rem', marginBottom: '1.5rem' }}>
        <p style={{ textTransform: 'uppercase', letterSpacing: '0.24em', color: '#7dd3fc', fontSize: '0.78rem', marginBottom: '0.75rem' }}>Star Citizen Ops</p>
        <h1 style={{ fontSize: '2.4rem', margin: '0 0 0.75rem' }}>Logistics is now an integrated org tool</h1>
        <p style={{ fontSize: '1rem', lineHeight: 1.7, color: '#cbd5e1', maxWidth: '760px' }}>
          This product is built as a first-class Logistics module for Star Citizen organisations, with a shared org context, audit-ready ledger, requests workflow, and review-friendly imports.
        </p>
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginTop: '1.25rem' }}>
          <Link className="button button-primary" href="/logistics">Open Logistics Dashboard</Link>
          <Link className="button button-secondary" href="/logistics/stock">Manage Stock</Link>
        </div>
      </section>

      <section className="grid grid-2" style={{ marginBottom: '1.5rem' }}>
        {metrics.map((metric) => (
          <div key={metric.label} className="card" style={{ padding: '1.25rem' }}>
            <p style={{ color: '#9f8d68', margin: '0 0 0.35rem' }}>{metric.label}</p>
            <p style={{ fontSize: '1.7rem', margin: 0, fontWeight: 700 }}>{metric.value}</p>
          </div>
        ))}
      </section>

      <section className="card" style={{ padding: '1.5rem', marginBottom: '1.5rem' }}>
        <h2 style={{ marginTop: 0 }}>Tools</h2>
        <div className="grid grid-2">
          {tools.map((tool) => (
            <div key={tool.id} style={{ padding: '1rem', borderRadius: '14px', background: 'rgba(255,255,255,0.04)' }}>
              <h3 style={{ margin: '0 0 0.35rem' }}>{tool.name}</h3>
              <p style={{ color: '#d7c5a1', margin: '0 0 0.85rem' }}>{tool.description}</p>
              <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
                <Link className="button button-primary" href={tool.route}>Open Tool</Link>
                <Link className="button button-secondary" href={tool.adminRoute}>Assign Admins</Link>
              </div>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
