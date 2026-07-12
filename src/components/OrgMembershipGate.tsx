import React from 'react';
import { getMembershipState } from '../lib/org-membership';

export function OrgMembershipGate({ children }: { children: React.ReactNode }) {
  const membership = getMembershipState('org-demo-01');

  if (!membership.isMemberOfOrg) {
    return (
      <div className="container" style={{ padding: '2rem 0 4rem' }}>
        <div className="card" style={{ padding: '1.5rem' }}>
          <h2 style={{ marginTop: 0 }}>Organisation membership required</h2>
          <p style={{ color: '#d7c5a1' }}>This logistics intake is only available to members of the selected organisation.</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
