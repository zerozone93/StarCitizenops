"use client";

import { useEffect, useState } from 'react';

type ScannerStatus = {
  provider?: string;
  configured?: boolean;
};

export default function LogisticsScannerPage() {
  const [status, setStatus] = useState<ScannerStatus | null>(null);
  const [statusError, setStatusError] = useState<string>('');

  useEffect(() => {
    let isMounted = true;

    const loadStatus = async () => {
      try {
        const response = await fetch('/api/logistics/scan', { cache: 'no-store' });
        if (!response.ok) {
          throw new Error('status request failed');
        }

        const data = (await response.json()) as ScannerStatus;
        if (!isMounted) {
          return;
        }

        setStatus(data);
        setStatusError('');
      } catch {
        if (!isMounted) {
          return;
        }

        setStatusError('Unable to load AI provider status.');
      }
    };

    loadStatus();

    return () => {
      isMounted = false;
    };
  }, []);

  const isConfigured = Boolean(status?.configured);
  const statusLabel = statusError
    ? 'Status unavailable'
    : status
      ? isConfigured
        ? 'Connected to StarCitizenOpps'
        : 'Running local fallback'
      : 'Checking AI status...';
  const statusColor = statusError ? '#fda4af' : isConfigured ? '#86efac' : '#fbbf24';

  return (
    <main className="container" style={{ padding: '2rem 0 4rem' }}>
      <section className="card" style={{ padding: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <h1 style={{ marginTop: 0, marginBottom: 0 }}>AI Scan Review</h1>
          <span
            style={{
              padding: '0.35rem 0.7rem',
              borderRadius: '999px',
              border: `1px solid ${statusColor}`,
              color: statusColor,
              fontSize: '0.85rem',
              background: 'rgba(255,255,255,0.03)',
            }}
          >
            {statusLabel}
          </span>
        </div>
        <p style={{ color: '#cbd5e1' }}>
          Upload screenshots for review, validate detections, and convert approved scan results into controlled inventory transactions.
        </p>
        {status?.provider ? (
          <p style={{ margin: '0 0 0.35rem', color: '#94a3b8', fontSize: '0.88rem' }}>
            Provider: {status.provider}
          </p>
        ) : null}
        <div style={{ padding: '1rem', borderRadius: '14px', background: 'rgba(255,255,255,0.04)', marginTop: '1rem' }}>
          <p style={{ margin: 0, color: '#cbd5e1' }}>Upload queue and review workflow will be added in the next iteration.</p>
        </div>
      </section>
    </main>
  );
}
