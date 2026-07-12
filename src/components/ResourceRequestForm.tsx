'use client';

import React, { useState } from 'react';
import { getOrgAccessState } from '../lib/access';

export function ResourceRequestForm() {
  const access = getOrgAccessState();
  const [title, setTitle] = useState('');
  const [resource, setResource] = useState('');
  const [quantity, setQuantity] = useState('');
  const [priority, setPriority] = useState('');
  const [reason, setReason] = useState('');

  if (!access.isAuthenticated) {
    return null;
  }

  return (
    <section className="card" style={{ padding: '1.25rem', marginTop: '1.25rem' }}>
      <h3 style={{ marginTop: 0 }}>Create a resource request</h3>
      <div style={{ display: 'grid', gap: '0.75rem' }}>
        <label style={{ display: 'grid', gap: '0.3rem' }}>
          <span style={{ color: '#d7c5a1' }}>Request title</span>
          <input value={title} onChange={(e) => setTitle((e.target as HTMLInputElement).value)} style={{ padding: '0.7rem', borderRadius: '10px', border: '1px solid rgba(212,145,55,0.32)', background: 'rgba(20,18,15,0.82)', color: '#f8e9cc' }} />
        </label>
        <label style={{ display: 'grid', gap: '0.3rem' }}>
          <span style={{ color: '#d7c5a1' }}>Resource</span>
          <input value={resource} onChange={(e) => setResource((e.target as HTMLInputElement).value)} style={{ padding: '0.7rem', borderRadius: '10px', border: '1px solid rgba(212,145,55,0.32)', background: 'rgba(20,18,15,0.82)', color: '#f8e9cc' }} />
        </label>
        <label style={{ display: 'grid', gap: '0.3rem' }}>
          <span style={{ color: '#d7c5a1' }}>Quantity</span>
          <input value={quantity} onChange={(e) => setQuantity((e.target as HTMLInputElement).value)} style={{ padding: '0.7rem', borderRadius: '10px', border: '1px solid rgba(212,145,55,0.32)', background: 'rgba(20,18,15,0.82)', color: '#f8e9cc' }} />
        </label>
        <label style={{ display: 'grid', gap: '0.3rem' }}>
          <span style={{ color: '#d7c5a1' }}>Priority</span>
          <select value={priority} onChange={(e) => setPriority((e.target as HTMLSelectElement).value)} style={{ padding: '0.7rem', borderRadius: '10px', border: '1px solid rgba(212,145,55,0.32)', background: 'rgba(20,18,15,0.82)', color: '#f8e9cc' }}>
            <option value="">Select priority</option>
            <option value="Low">Low</option>
            <option value="Medium">Medium</option>
            <option value="High">High</option>
          </select>
        </label>
        <label style={{ display: 'grid', gap: '0.3rem' }}>
          <span style={{ color: '#d7c5a1' }}>Reason</span>
          <textarea value={reason} onChange={(e) => setReason((e.target as HTMLTextAreaElement).value)} rows={3} style={{ padding: '0.7rem', borderRadius: '10px', border: '1px solid rgba(212,145,55,0.32)', background: 'rgba(20,18,15,0.82)', color: '#f8e9cc' }} />
        </label>
        <button className="button button-secondary" style={{ justifySelf: 'start' }}>Submit request</button>
      </div>
    </section>
  );
}
