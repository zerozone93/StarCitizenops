import Link from "next/link";
import type { Coalition } from "@prisma/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function CoalitionCard({ coalition }: { coalition: Coalition }) {
  return (
    <Card className="rounded-2xl border border-orange-300/20 bg-slate-900/65 transition hover:border-orange-300/40 hover:bg-slate-900/75">
      <CardHeader>
        <CardTitle className="text-orange-50">
          <Link href={`/coalitions/${coalition.id}`} className="hover:text-orange-200">
            {coalition.name}
          </Link>
        </CardTitle>
      </CardHeader>
      <CardContent className="text-sm text-slate-300">
        <p>{coalition.description || "No description yet."}</p>
      </CardContent>
    </Card>
  );
}
