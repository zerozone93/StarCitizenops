export type MembershipState = {
  isMemberOfOrg: boolean;
  orgId: string | null;
  memberName: string;
};

export function getMembershipState(orgId: string | null): MembershipState {
  return {
    isMemberOfOrg: orgId === 'org-demo-01' || orgId === null,
    orgId: orgId ?? 'org-demo-01',
    memberName: 'Assigned Org Member',
  };
}
