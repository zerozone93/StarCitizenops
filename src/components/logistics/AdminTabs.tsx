import React from 'react';

export type AdminTab = 'dashboard' | 'approval' | 'inventory' | 'refinery' | 'fulfillment';

type AdminTabsProps = {
  activeAdminTab: AdminTab;
  onTabChange: (tab: AdminTab) => void;
};

const tabConfig: Array<{ id: AdminTab; label: string }> = [
  { id: 'dashboard', label: 'Dashboard' },
  { id: 'approval', label: 'Approval queue' },
  { id: 'inventory', label: 'Manage stock' },
  { id: 'refinery', label: 'Refinery queue' },
  { id: 'fulfillment', label: 'Fulfillment & Archive' },
];

export function AdminTabs({ activeAdminTab, onTabChange }: AdminTabsProps) {
  return (
    <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
      {tabConfig.map((tab) => (
        <button
          key={tab.id}
          className="button button-secondary"
          type="button"
          onClick={() => onTabChange(tab.id)}
          style={{ opacity: activeAdminTab === tab.id ? 1 : 0.7, padding: '0.6rem 1.2rem' }}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
