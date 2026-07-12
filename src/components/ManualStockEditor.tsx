'use client';

import React, { useState } from 'react';
import { getOrgAccessState } from '../lib/access';

export function ManualStockEditor() {
  const access = getOrgAccessState();
  const [material, setMaterial] = useState('');
  const [quantity, setQuantity] = useState('');
  const [state, setState] = useState('');
  const [note, setNote] = useState('');

  if (!access.canEdit) {
    return null;
  }

  return (
    <section className="card" style={{ padding: '1.25rem', marginTop: '1.25rem' }}>
      <h3 style={{ marginTop: 0 }}>Manual stock edit</h3>
      <div style={{ display: 'grid', gap: '0.75rem' }}>
        <label style={{ display: 'grid', gap: '0.3rem' }}>
          <span style={{ color: '#d7c5a1' }}>Material</span>
          <input value={material} onChange={(e) => setMaterial((e.target as HTMLInputElement).value)} style={{ padding: '0.7rem', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.12)', background: 'rgba(20,18,15,0.82)', color: 'white' }} />
        </label>
        <label style={{ display: 'grid', gap: '0.3rem' }}>
          <span style={{ color: '#d7c5a1' }}>Quantity</span>
          <input value={quantity} onChange={(e) => setQuantity((e.target as HTMLInputElement).value)} style={{ padding: '0.7rem', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.12)', background: 'rgba(20,18,15,0.82)', color: 'white' }} />
        </label>
        <label style={{ display: 'grid', gap: '0.3rem' }}>
          <span style={{ color: '#d7c5a1' }}>State</span>
          <select value={state} onChange={(e) => setState((e.target as HTMLSelectElement).value)} style={{ padding: '0.7rem', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.12)', background: 'rgba(20,18,15,0.82)', color: 'white' }}>
            <option value="">Select state</option>
            <option value="RAW_ORE">Raw Ore</option>
            <option value="REFINED">Refined</option>
            <option value="RESERVED">Reserved</option>
            <option value="ISSUED">Issued</option>
          </select>
        </label>
        <label style={{ display: 'grid', gap: '0.3rem' }}>
          <span style={{ color: '#d7c5a1' }}>Reason / note</span>
          <textarea value={note} onChange={(e) => setNote((e.target as HTMLTextAreaElement).value)} rows={3} style={{ padding: '0.7rem', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.12)', background: 'rgba(20,18,15,0.82)', color: 'white' }} />
        </label>
        <button className="button button-primary" style={{ justifySelf: 'start' }}>Save adjustment</button>
      </div>
    </section>
  );
}
