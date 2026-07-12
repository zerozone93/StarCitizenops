import React from 'react';

type RefineryPanelProps = {
  children: React.ReactNode;
};

export function RefineryPanel({ children }: RefineryPanelProps) {
  return (
    <div className="card" style={{ padding: '1.25rem', display: 'grid', gap: '1rem' }}>
      <div>
        <h3 style={{ margin: '0 0 0.5rem' }}>Refinery queue</h3>
        <p style={{ margin: 0, color: '#d7c5a1', fontSize: '0.95rem' }}>
          Separate processing lane for incoming materials. Completing a job adds refined output into inventory.
        </p>
      </div>

      {children}
    </div>
  );
}
