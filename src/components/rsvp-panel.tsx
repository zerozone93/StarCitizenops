import { getServerSession } from "next-auth";
import { revalidatePath } from "next/cache";
import { RSVPStatus } from "@prisma/client";
import { authOptions } from "@/lib/auth";
import { setOperationRSVP } from "@/server/rsvp";

async function submitRSVP(formData: FormData) {
  "use server";

  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return;

  const operationId = String(formData.get("operationId") || "");
  const status = String(formData.get("status") || "MAYBE") as RSVPStatus;
  const note = String(formData.get("note") || "");
  const preferredRole = String(formData.get("preferredRole") || "");
  const team = String(formData.get("team") || "");

  await setOperationRSVP(session.user.id, operationId, {
    status,
    note,
    preferredRole,
    team,
  });

  revalidatePath(`/operations/${operationId}`);
}

export function RSVPPanel({
  operationId,
  entries,
}: {
  operationId: string;
  entries: Array<{ id: string; status: RSVPStatus; note: string | null; user: { name: string | null } }>;
}) {
  return (
    <section className="space-y-3 rounded-xl border border-cyan-500/20 bg-slate-900/50 p-4">
      <h3 className="text-lg font-semibold text-cyan-100">RSVP</h3>
      <form action={submitRSVP} className="space-y-2">
        <input type="hidden" name="operationId" value={operationId} />
        <select name="status" className="w-full rounded-md border border-cyan-500/30 bg-slate-950 p-2 text-sm">
          <option value="GOING">Going</option>
          <option value="MAYBE">Maybe</option>
          <option value="DECLINED">Declined</option>
          <option value="STANDBY">Standby</option>
        </select>
        <input
          name="preferredRole"
          className="w-full rounded-md border border-cyan-500/30 bg-slate-950 p-2 text-sm"
          placeholder="Preferred role (pilot, medic, scout...)"
        />
        <input
          name="team"
          className="w-full rounded-md border border-cyan-500/30 bg-slate-950 p-2 text-sm"
          placeholder="Team (Alpha, Logistics, Recon...)"
        />
        <textarea name="note" className="w-full rounded-md border border-cyan-500/30 bg-slate-950 p-2 text-sm" placeholder="Optional note" />
        <button type="submit" className="rounded-md bg-cyan-500/20 px-3 py-2 text-sm text-cyan-100">Update RSVP</button>
      </form>
      <ul className="space-y-2 text-sm text-slate-300">
        {entries.map((entry) => (
          <li key={entry.id} className="rounded-md border border-cyan-500/20 p-2">
            {entry.user.name || "Operator"}: {entry.status}{entry.note ? ` - ${entry.note}` : ""}
          </li>
        ))}
      </ul>
    </section>
  );
}
