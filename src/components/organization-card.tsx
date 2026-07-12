import Link from "next/link";
import type { Organization } from "@prisma/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function OrganizationCard({ organization }: { organization: Organization }) {
  return (
    <Card className="rounded-2xl border border-orange-300/20 bg-slate-900/65 transition hover:border-orange-300/40 hover:bg-slate-900/75">
      <CardHeader>
        <CardTitle className="text-orange-50">
          <Link href={`/organizations/${organization.id}`} className="hover:text-orange-200">
            {organization.name} [{organization.tag}]
          </Link>
        </CardTitle>
      </CardHeader>
      <CardContent className="text-sm text-slate-300">
        <p>{organization.description || "No description yet."}</p>
        <p className="mt-3 inline-flex rounded-md border border-cyan-300/30 bg-cyan-300/10 px-2 py-1 text-xs font-medium text-cyan-100">
          Focus: {organization.focusType.replaceAll("_", " ")}
        </p>
      </CardContent>
    </Card>
  );
}
