"use client";

import { useMemo, useState } from "react";
import type { OrganizationMemberRole } from "@prisma/client";
import { getMilitaryRankLabel } from "@/lib/org-ranks";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type OrganizationMemberItem = {
  id: string;
  role: OrganizationMemberRole;
  title: string | null;
  joinedAt: string;
  user: {
    name: string | null;
    email: string | null;
    starCitizenHandle: string | null;
  };
};

export function OrganizationMembersDropdown({ members }: { members: OrganizationMemberItem[] }) {
  const [selectedMemberId, setSelectedMemberId] = useState(members[0]?.id ?? "");

  const selectedMember = useMemo(
    () => members.find((member) => member.id === selectedMemberId) ?? members[0] ?? null,
    [members, selectedMemberId]
  );

  const selectedMemberIdValue = selectedMember?.id ?? "";

  if (!members.length) {
    return <p className="mt-2 text-sm text-slate-400">No members found.</p>;
  }

  return (
    <div className="mt-2 space-y-3 text-sm text-slate-300">
      <label className="block text-xs uppercase tracking-wide text-slate-400" htmlFor="organization-member-dropdown">
        Select member
      </label>
      <Select value={selectedMemberIdValue} onValueChange={(value) => setSelectedMemberId(value ?? "")}>
        <SelectTrigger
          id="organization-member-dropdown"
          className="w-full rounded-md border-cyan-500/30 bg-slate-950 px-3 text-sm text-cyan-100"
        >
          <SelectValue placeholder="Choose a member" />
        </SelectTrigger>
        <SelectContent className="border border-cyan-500/20 bg-slate-950 text-slate-100">
          {members.map((member) => {
            const displayName = member.user.name || member.user.email || "Operator";
            return (
              <SelectItem key={member.id} value={member.id} className="focus:bg-cyan-500/10 focus:text-cyan-100">
                <span>{displayName}</span>
                <span className="text-xs text-slate-400">{getMilitaryRankLabel(member.role)}</span>
              </SelectItem>
            );
          })}
        </SelectContent>
      </Select>

      {selectedMember ? (
        <div className="rounded border border-cyan-500/20 bg-slate-950/35 p-3">
          <p className="font-medium text-cyan-100">{selectedMember.user.name || selectedMember.user.email || "Operator"}</p>
          {selectedMember.user.starCitizenHandle ? (
            <p className="mt-1 text-xs text-slate-400">@{selectedMember.user.starCitizenHandle}</p>
          ) : null}
          <p className="mt-2 text-xs text-slate-400">Rank: {getMilitaryRankLabel(selectedMember.role)}</p>
          <p className="mt-1 text-xs text-slate-500">System role: {selectedMember.role}</p>
          {selectedMember.title ? <p className="mt-1 text-xs text-slate-500">Assignment: {selectedMember.title}</p> : null}
          <p className="mt-1 text-xs text-slate-500">Joined {new Date(selectedMember.joinedAt).toLocaleDateString()}</p>
        </div>
      ) : null}
    </div>
  );
}
