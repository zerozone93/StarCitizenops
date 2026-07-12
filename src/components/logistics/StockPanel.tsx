import React from 'react';

type StockPanelProps = {
  catalogSyncedAt: string | null;
  inventoryMessage: string;
  children: React.ReactNode;
};

export function StockPanel({ catalogSyncedAt, inventoryMessage, children }: StockPanelProps) {
  return (
    <div className="card" style={{ padding: '1.25rem', display: 'grid', gap: '1rem' }}>
      <div>
        <h3 style={{ margin: '0 0 0.5rem' }}>Manage stock</h3>
        <p style={{ margin: 0, color: '#d7c5a1', fontSize: '0.95rem' }}>Add new stock, edit existing entries, upload screenshots for AI verification, and organize by category and location.</p>
        {catalogSyncedAt ? <p style={{ margin: '0.35rem 0 0', color: '#9f8d68', fontSize: '0.82rem' }}>Catalog synced: {new Date(catalogSyncedAt).toLocaleString()}</p> : null}
        <p style={{ margin: '0.4rem 0 0', color: '#9f8d68', fontSize: '0.88rem' }}>
          Raw materials are refinery-managed. Approve intake to Refinery Queue, then complete the job to add output to inventory.
        </p>
      </div>

      {inventoryMessage ? (
        <div style={{ padding: '0.85rem 1rem', borderRadius: '12px', background: 'rgba(34, 197, 94, 0.14)', color: '#f3d19a' }}>
          {inventoryMessage}
        </div>
      ) : null}

      {children}
    </div>
  );
}
