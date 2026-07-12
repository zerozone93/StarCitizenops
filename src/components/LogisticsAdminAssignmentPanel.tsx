'use client';

import { useEffect, useState } from 'react';

type AdminAssignment = {
  id: string;
  organisationId: string;
  userId: string;
  assignedBy: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
};

export function LogisticsAdminAssignmentPanel() {
  const [admins, setAdmins] = useState<AdminAssignment[]>([]);
  const [userId, setUserId] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const loadAdmins = async () => {
    const response = await fetch('/api/logistics/admins');
    if (!response.ok) {
      setMessage('Unable to load admin assignments with current permissions.');
      return;
    }

    const data = (await response.json()) as { admins: AdminAssignment[] };
    setAdmins(data.admins ?? []);
  };

  useEffect(() => {
    loadAdmins();
  }, []);

  const assignAdmin = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!userId.trim()) {
      setMessage('Enter a user id before assigning admin access.');
      return;
    }

    setLoading(true);
    setMessage('');

    try {
      const response = await fetch('/api/logistics/admins', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: userId.trim() }),
      });

      if (!response.ok) {
        setMessage('Assignment failed. Confirm you have logistics settings permissions.');
        return;
      }

      setMessage('Admin assignment saved.');
      setUserId('');
      await loadAdmins();
    } finally {
      setLoading(false);
    }
  };

  const removeAdmin = async (targetUserId: string) => {
    setLoading(true);
    setMessage('');

    try {
      const response = await fetch('/api/logistics/admins', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: targetUserId }),
      });

      if (!response.ok) {
        setMessage('Unable to remove assignment.');
        return;
      }

      setMessage(`Admin removed: ${targetUserId}`);
      await loadAdmins();
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="card" style={{ padding: '1.5rem' }}>
      <h2 style={{ marginTop: 0 }}>Assign Logistics Admins</h2>
      <p style={{ color: '#d7c5a1', marginTop: 0 }}>
        Only users with logistics settings permission should assign or remove admins.
      </p>

      {message ? (
        <p style={{ color: '#c9832f', marginBottom: '1rem' }}>{message}</p>
      ) : null}

      <form onSubmit={assignAdmin} style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
        <input
          value={userId}
          onChange={(event) => setUserId((event.target as HTMLInputElement).value)}
          placeholder="scops-user-id"
          style={{
            minWidth: '280px',
            padding: '0.7rem',
            borderRadius: '10px',
            border: '1px solid rgba(212,145,55,0.32)',
            background: 'rgba(20,18,15,0.82)',
            color: '#f8e9cc',
          }}
        />
        <button className="button button-primary" type="submit" disabled={loading}>Assign Admin</button>
      </form>

      <div style={{ display: 'grid', gap: '0.6rem' }}>
        {admins.length === 0 ? (
          <p style={{ margin: 0, color: '#9f8d68' }}>No active logistics admins assigned yet.</p>
        ) : (
          admins.map((admin) => (
            <div key={admin.id} style={{ padding: '0.75rem', borderRadius: '10px', background: 'rgba(255,255,255,0.04)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
              <div>
                <p style={{ margin: 0, color: '#d7c5a1' }}><strong>{admin.userId}</strong></p>
                <p style={{ margin: '0.2rem 0 0', color: '#9f8d68', fontSize: '0.86rem' }}>
                  Assigned by {admin.assignedBy} on {new Date(admin.createdAt).toLocaleString()}
                </p>
              </div>
              <button className="button button-secondary" type="button" onClick={() => removeAdmin(admin.userId)} disabled={loading}>
                Remove
              </button>
            </div>
          ))
        )}
      </div>
    </section>
  );
}
