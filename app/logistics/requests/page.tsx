import { demoRequests } from '../../../src/data/logistics-demo';

export default function LogisticsRequestsPage() {
  return (
    <main className="container" style={{ padding: '2rem 0 4rem' }}>
      <section className="card" style={{ padding: '1.5rem', marginBottom: '1.25rem' }}>
        <h1 style={{ marginTop: 0 }}>Requests & Reservations</h1>
        <p style={{ color: '#cbd5e1', marginBottom: 0 }}>Quartermasters and officers can review requests and turn them into approved reservations and issuances.</p>
      </section>

      <section className="card" style={{ padding: '1.25rem' }}>
        <div style={{ display: 'grid', gap: '0.85rem' }}>
          {demoRequests.map((request) => (
            <div key={request.id} style={{ padding: '1rem', borderRadius: '14px', background: 'rgba(255,255,255,0.04)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.75rem', alignItems: 'center' }}>
                <strong>{request.title}</strong>
                <span style={{ color: '#7dd3fc' }}>{request.priority}</span>
              </div>
              <p style={{ color: '#cbd5e1', margin: '0.35rem 0 0' }}>
                {request.id} • {request.operation} • Requested by {request.requestedBy} • Status: {request.status}
              </p>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
