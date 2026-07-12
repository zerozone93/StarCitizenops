export type OrgRole = 'OWNER' | 'ADMIN' | 'QUARTERMASTER' | 'VIEWER';

export type OrgAccessState = {
  isAuthenticated: boolean;
  isOrgAdmin: boolean;
  canEdit: boolean;
  orgId: string | null;
  role: OrgRole;
};

export function getOrgAccessState(): OrgAccessState {
  return {
    isAuthenticated: true,
    isOrgAdmin: true,
    canEdit: true,
    orgId: 'org-demo-01',
    role: 'ADMIN',
  };
}
