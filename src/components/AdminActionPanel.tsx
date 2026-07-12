import React from 'react';
import { getOrgAccessState } from '../lib/access';

export function AdminActionPanel() {
  const access = getOrgAccessState();

  if (!access.canEdit) {
    return null;
  }

  return (
    <section className="card" style={{ padding: '1.25rem', marginTop: '1.25rem' }}>
      <h3 style={{ marginTop: 0 }}>Admin actions</h3>
      <div style={{ display: 'grid', gap: '0.75rem' }}>
        <div style={{ padding: '0.9rem', borderRadius: '12px', background: 'rgba(255,255,255,0.04)' }}>
          <strong>Adjust material batch</strong>
          <p style={{ margin: '0.3rem 0 0', color: '#d7c5a1' }}>Update quantity, state or destination for an assigned org admin.</p>
        </div>
        <div style={{ padding: '0.9rem', borderRadius: '12px', background: 'rgba(255,255,255,0.04)' }}>
          <strong>Approve refinery job</strong>
          <p style={{ margin: '0.3rem 0 0', color: '#d7c5a1' }}>Review and approve refinery output, yield and losses.</p>
        </div>
        <div style={{ padding: '0.9rem', borderRadius: '12px', background: 'rgba(255,255,255,0.04)' }}>
          <strong>Transfer to member or operation</strong>
          <p style={{ margin: '0.3rem 0 0', color: '#d7c5a1' }}>Move material into a new org-owned or member-owned workflow.</p>
        </div>
      </div>
    </section>
  );
}
