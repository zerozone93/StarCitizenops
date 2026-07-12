import React from 'react';

type TicketsPanelProps = {
  children: React.ReactNode;
};

export function TicketsPanel({ children }: TicketsPanelProps) {
  return (
    <div className="card" style={{ padding: '1.25rem', display: 'grid', gap: '1rem' }}>
      <div>
        <h3 style={{ margin: '0 0 0.5rem' }}>Fulfillment & archive</h3>
        <p style={{ margin: 0, color: '#d7c5a1', fontSize: '0.95rem' }}>Track pending fulfillment tickets and view completed/archived deliveries.</p>
      </div>

      {children}
    </div>
  );
}
