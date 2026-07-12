export type DemoItem = {
  id: string;
  name: string;
  category: string;
  location: string;
  total: number;
  available: number;
  reserved: number;
  issued: number;
  status: 'Healthy' | 'Low' | 'Critical';
};

export const demoInventory: DemoItem[] = [
  { id: '1', name: 'P4-AR Rifle', category: 'Weapons', location: 'Stanton Warehouse', total: 14, available: 8, reserved: 4, issued: 2, status: 'Healthy' },
  { id: '2', name: 'MedPen', category: 'Medical', location: 'Pyro Outpost', total: 36, available: 24, reserved: 6, issued: 6, status: 'Healthy' },
  { id: '3', name: 'Morozov Heavy Armour', category: 'Armour', location: 'Seraphim Station', total: 6, available: 2, reserved: 2, issued: 2, status: 'Low' },
  { id: '4', name: 'Ammunition Crate', category: 'Ammo', location: 'Ironclad Assault', total: 8, available: 2, reserved: 3, issued: 3, status: 'Critical' },
];

export const demoRequests = [
  { id: 'REQ-1042', title: 'Storm Breaker Loadout', status: 'Awaiting Approval', priority: 'High', requestedBy: 'NightHawk', operation: 'Storm Breaker' },
  { id: 'REQ-1043', title: 'Medical Resupply', status: 'Reserved', priority: 'Medium', requestedBy: 'Raven', operation: 'Operation Ember' },
];

export const demoActivity = [
  { id: 'TX-1001', type: 'Transfer', item: 'P4-AR Rifle', location: 'Stanton Warehouse → Pyro Outpost', time: '12 mins ago' },
  { id: 'TX-1002', type: 'Issue', item: 'MedPen', location: 'Member Custody', time: '32 mins ago' },
  { id: 'TX-1003', type: 'Scan Review', item: 'Ammunition Crate', location: 'AI Scan', time: '1 hr ago' },
];
