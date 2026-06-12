import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";

async function createCoalition(formData: FormData) {
  "use server";
  const user = await requireUser();

  const coalition = await prisma.coalition.create({
    data: {
      name: String(formData.get("name") || ""),
      description: String(formData.get("description") || ""),
      commandNotes: String(formData.get("commandNotes") || ""),
      createdById: user.id,
    },
  });

  revalidatePath("/coalitions");
  redirect(`/coalitions/${coalition.id}`);
}

export default async function NewCoalitionPage() {
  await requireUser();

  return (
    <AppShell title="Create Coalition" subtitle="Coordinate multi-org operations">
      <form action={createCoalition} className="space-y-3 rounded-xl border border-cyan-500/20 bg-slate-900/50 p-4">
        <input name="name" required className="w-full rounded-md border border-cyan-500/30 bg-slate-950 p-2" placeholder="Coalition name" />
        <textarea name="description" className="w-full rounded-md border border-cyan-500/30 bg-slate-950 p-2" placeholder="Description" />
        <textarea name="commandNotes" className="w-full rounded-md border border-cyan-500/30 bg-slate-950 p-2" placeholder="Command structure notes" />
        <button type="submit" className="rounded-md bg-cyan-500 px-4 py-2 font-semibold text-slate-950">Create coalition</button>
      </form>
    </AppShell>
  );
}
