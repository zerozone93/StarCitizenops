import React from 'react';

type DashboardMetrics = {
  receivingQueueLines: number;
  receivingQueueQuantity: number;
  receivingApprovedLines: number;
  receivingApprovedQuantity: number;
  distributingOpenLines: number;
  distributingOpenQuantity: number;
  distributingCompletedLines: number;
  distributingCompletedQuantity: number;
  distributingApprovedRequests: number;
};

type MemberInsights = {
  topContributors: Array<[string, number]>;
  topWithdrawers: Array<[string, number]>;
};

type DashboardPanelProps = {
  offerMessage: string;
  requestMessage: string;
  receivingDistributingMetrics: DashboardMetrics;
  memberInsights: MemberInsights;
  pendingCount: number;
  approvedCount: number;
  rejectedCount: number;
  children: React.ReactNode;
};

export function DashboardPanel({
  offerMessage,
  requestMessage,
  receivingDistributingMetrics,
  memberInsights,
  pendingCount,
  approvedCount,
  rejectedCount,
  children,
}: DashboardPanelProps) {
  return (
    <>
      <section className="card" style={{ padding: '1.25rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <div>
            <p style={{ textTransform: 'uppercase', letterSpacing: '0.24em', color: '#c9832f', fontSize: '0.78rem', marginBottom: '0.35rem' }}>Member portal</p>
            <h2 style={{ margin: 0 }}>Contribute stock or request items</h2>
          </div>
          <div style={{ color: '#d7c5a1', fontSize: '0.95rem' }}>
            Your submissions will be reviewed by org admins
          </div>
        </div>

        <div style={{ display: 'grid', gap: '1rem', marginTop: '1rem' }}>
          {offerMessage ? (
            <div style={{ padding: '0.85rem 1rem', borderRadius: '12px', background: 'rgba(245, 158, 11, 0.14)', color: '#f2c175' }}>
              {offerMessage}
            </div>
          ) : null}

          {requestMessage ? (
            <div style={{ padding: '0.85rem 1rem', borderRadius: '12px', background: 'rgba(34, 197, 94, 0.14)', color: '#f3d19a' }}>
              {requestMessage}
            </div>
          ) : null}

          {children}
        </div>
      </section>

      <div className="card" style={{ padding: '1rem', display: 'grid', gap: '0.75rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <h3 style={{ margin: 0 }}>Receiving vs Distributing</h3>
          <span style={{ color: '#9f8d68', fontSize: '0.9rem' }}>
            Live totals from multi-line requests and deliveries
          </span>
        </div>
        <div style={{ display: 'grid', gap: '0.7rem', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))' }}>
          <div style={{ padding: '0.8rem', borderRadius: '10px', background: 'rgba(34, 197, 94, 0.12)' }}>
            <p style={{ margin: 0, color: '#d9a45a', fontSize: '0.82rem' }}>Receiving Queue</p>
            <p style={{ margin: '0.25rem 0 0', fontSize: '1.1rem', fontWeight: 700 }}>
              {receivingDistributingMetrics.receivingQueueLines} lines
            </p>
            <p style={{ margin: '0.2rem 0 0', color: '#d7c5a1', fontSize: '0.85rem' }}>
              Qty {receivingDistributingMetrics.receivingQueueQuantity.toFixed(2)}
            </p>
          </div>
          <div style={{ padding: '0.8rem', borderRadius: '10px', background: 'rgba(56, 189, 248, 0.12)' }}>
            <p style={{ margin: 0, color: '#c9832f', fontSize: '0.82rem' }}>Received Approved</p>
            <p style={{ margin: '0.25rem 0 0', fontSize: '1.1rem', fontWeight: 700 }}>
              {receivingDistributingMetrics.receivingApprovedLines} lines
            </p>
            <p style={{ margin: '0.2rem 0 0', color: '#d7c5a1', fontSize: '0.85rem' }}>
              Qty {receivingDistributingMetrics.receivingApprovedQuantity.toFixed(2)}
            </p>
          </div>
          <div style={{ padding: '0.8rem', borderRadius: '10px', background: 'rgba(245, 158, 11, 0.12)' }}>
            <p style={{ margin: 0, color: '#e09a36', fontSize: '0.82rem' }}>Distributing Open</p>
            <p style={{ margin: '0.25rem 0 0', fontSize: '1.1rem', fontWeight: 700 }}>
              {receivingDistributingMetrics.distributingOpenLines} lines
            </p>
            <p style={{ margin: '0.2rem 0 0', color: '#d7c5a1', fontSize: '0.85rem' }}>
              Qty {receivingDistributingMetrics.distributingOpenQuantity.toFixed(2)} • {receivingDistributingMetrics.distributingApprovedRequests} requests
            </p>
          </div>
          <div style={{ padding: '0.8rem', borderRadius: '10px', background: 'rgba(148, 163, 184, 0.16)' }}>
            <p style={{ margin: 0, color: '#d7c5a1', fontSize: '0.82rem' }}>Distributed Completed</p>
            <p style={{ margin: '0.25rem 0 0', fontSize: '1.1rem', fontWeight: 700 }}>
              {receivingDistributingMetrics.distributingCompletedLines} lines
            </p>
            <p style={{ margin: '0.2rem 0 0', color: '#d7c5a1', fontSize: '0.85rem' }}>
              Qty {receivingDistributingMetrics.distributingCompletedQuantity.toFixed(2)}
            </p>
          </div>
        </div>

        <div style={{ display: 'grid', gap: '0.75rem', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))' }}>
          <div style={{ padding: '0.9rem', borderRadius: '12px', background: 'rgba(64, 44, 22, 0.62)' }}>
            <h4 style={{ margin: '0 0 0.5rem', color: '#c9832f' }}>Top contributors</h4>
            {memberInsights.topContributors.length === 0 ? (
              <p style={{ margin: 0, color: '#9f8d68', fontSize: '0.9rem' }}>No approved contributions yet.</p>
            ) : (
              memberInsights.topContributors.map(([member, total]) => (
                <p key={member} style={{ margin: '0.2rem 0', color: '#d7c5a1', fontSize: '0.9rem' }}>
                  {member} • {total.toFixed(2)} units
                </p>
              ))
            )}
          </div>

          <div style={{ padding: '0.9rem', borderRadius: '12px', background: 'rgba(89, 52, 24, 0.55)' }}>
            <h4 style={{ margin: '0 0 0.5rem', color: '#e09a36' }}>Top withdrawers</h4>
            {memberInsights.topWithdrawers.length === 0 ? (
              <p style={{ margin: 0, color: '#9f8d68', fontSize: '0.9rem' }}>No withdrawals tracked yet.</p>
            ) : (
              memberInsights.topWithdrawers.map(([member, total]) => (
                <p key={member} style={{ margin: '0.2rem 0', color: '#d7c5a1', fontSize: '0.9rem' }}>
                  {member} • {total.toFixed(2)} units
                </p>
              ))
            )}
          </div>
        </div>

        <p style={{ margin: 0, color: '#c9832f', fontSize: '0.9rem' }}>Pending {pendingCount} • Approved {approvedCount} • Rejected {rejectedCount}</p>
      </div>
    </>
  );
}
