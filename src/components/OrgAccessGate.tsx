import React from 'react';
import { getOrgAccessState } from '../lib/access';

export function OrgAccessGate({ children }: { children: React.ReactNode }) {
  const access = getOrgAccessState();

  if (!access.isAuthenticated) {
    return (
      <div className="container" style={{ padding: '2rem 0 4rem' }}>
        <div className="card" style={{ padding: '1.5rem' }}>
          <h2 style={{ marginTop: 0 }}>Access restricted</h2>
          <p style={{ color: '#d7c5a1' }}>You must be signed in to view this organisation logistics workspace.</p>
        </div>
      </div>
    );
  }

  if (!access.isOrgAdmin) {
    return (
      <div className="container" style={{ padding: '2rem 0 4rem' }}>
        <div className="card" style={{ padding: '1.5rem' }}>
          <h2 style={{ marginTop: 0 }}>Organisation admins only</h2>
          <p style={{ color: '#d7c5a1' }}>Only assigned organisation administrators can change values in this logistics module.</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
