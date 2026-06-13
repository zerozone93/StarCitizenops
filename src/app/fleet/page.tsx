import Link from "next/link";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { FleetAssetTable } from "@/components/fleet/FleetAssetTable";
import { FleetSummaryCards } from "@/components/fleet/FleetSummaryCards";
import { prisma } from "@/lib/prisma";
import { deleteGroundVehicleForUser, deleteShipForUser, getUserFleetData } from "@/lib/fleet-actions";
import { getOrganizationFleetView } from "@/lib/fleet";
import { requireUser } from "@/lib/session";

async function deleteFleetAsset(formData: FormData) {
  "use server";
  const user = await requireUser();
  const assetId = String(formData.get("assetId") || "");
  const assetType = String(formData.get("assetType") || "ship");

  if (assetType === "vehicle") {
    await deleteGroundVehicleForUser(user.id, assetId);
  } else {
    await deleteShipForUser(user.id, assetId);
  }

  revalidatePath("/fleet");
  revalidatePath("/dashboard");
  revalidatePath("/profile");
  redirect("/fleet?message=Fleet%20asset%20deleted");
}

export default async function FleetPage({
  searchParams,
}: {
  searchParams: Promise<{ message?: string; organizationId?: string }>;
}) {
  const user = await requireUser();
  const { message, organizationId: requestedOrganizationId } = await searchParams;

  const [fleet, memberships] = await Promise.all([
    getUserFleetData(user.id),
    prisma.organizationMember.findMany({
      where: { userId: user.id },
      include: {
        organization: {
          select: {
            id: true,
            name: true,
            tag: true,
          },
        },
      },
      orderBy: { joinedAt: "asc" },
    }),
  ]);

  const selectedOrganizationId = memberships.some((membership) => membership.organizationId === requestedOrganizationId)
    ? requestedOrganizationId || ""
    : memberships[0]?.organizationId || "";

  const organizationFleet = selectedOrganizationId
    ? await getOrganizationFleetView(selectedOrganizationId)
    : null;

  const shipAssets = fleet.assets.filter((asset) => asset.kind === "ship");
  const vehicleAssets = fleet.assets.filter((asset) => asset.kind === "vehicle");

  return (
    <AppShell title="Fleet Management" subtitle="My fleet is private. Organization fleet shows member-contributed assets.">
      <div className="mb-3 flex items-center justify-between gap-2">
        <div className="flex gap-2">
          <Link href="/fleet/add" className="rounded-md bg-cyan-500 px-3 py-2 text-sm font-semibold text-slate-950">
            Add Ship or Vehicle
          </Link>
        </div>
      </div>

      {message ? (
        <div className="rounded-md border border-cyan-500/20 bg-cyan-950/30 p-3 text-sm text-cyan-100">
          {message}
        </div>
      ) : null}

      <section className="space-y-3 rounded-xl border border-cyan-500/20 bg-slate-900/50 p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-lg font-semibold text-cyan-100">My Fleet (Private)</h3>
          <p className="text-xs text-slate-400">Only you can view and edit this section.</p>
        </div>

        <FleetSummaryCards summary={fleet.summary} />

        <FleetAssetTable
          title="Ships"
          assets={shipAssets}
          renderActions={(asset) => (
            <div className="flex items-center gap-2">
              <Link href={`/fleet/edit/${asset.id}`} className="rounded bg-cyan-500/20 px-2 py-1 text-xs text-cyan-100">
                Edit
              </Link>
              <form action={deleteFleetAsset}>
                <input type="hidden" name="assetId" value={asset.id} />
                <input type="hidden" name="assetType" value="ship" />
                <button type="submit" className="rounded bg-rose-500/20 px-2 py-1 text-xs text-rose-200">
                  Delete
                </button>
              </form>
            </div>
          )}
        />

        <FleetAssetTable
          title="Ground Vehicles"
          assets={vehicleAssets}
          renderActions={(asset) => (
            <div className="flex items-center gap-2">
              <Link href={`/fleet/edit/${asset.id}`} className="rounded bg-cyan-500/20 px-2 py-1 text-xs text-cyan-100">
                Edit
              </Link>
              <form action={deleteFleetAsset}>
                <input type="hidden" name="assetId" value={asset.id} />
                <input type="hidden" name="assetType" value="vehicle" />
                <button type="submit" className="rounded bg-rose-500/20 px-2 py-1 text-xs text-rose-200">
                  Delete
                </button>
              </form>
            </div>
          )}
        />
      </section>

      <section className="space-y-3 rounded-xl border border-indigo-500/20 bg-slate-900/50 p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-lg font-semibold text-indigo-100">Organization Fleet</h3>
          <form method="get" className="flex items-center gap-2">
            <input type="hidden" name="message" value={message || ""} />
            <select
              name="organizationId"
              defaultValue={selectedOrganizationId}
              className="rounded-md border border-indigo-500/30 bg-slate-950 px-3 py-2 text-xs text-indigo-100"
            >
              {memberships.map((membership) => (
                <option key={membership.organizationId} value={membership.organizationId}>
                  {membership.organization.name} [{membership.organization.tag}]
                </option>
              ))}
            </select>
            <button type="submit" className="rounded-md border border-indigo-500/40 bg-indigo-500/10 px-3 py-2 text-xs text-indigo-100">
              View
            </button>
          </form>
        </div>

        {!memberships.length ? (
          <p className="text-sm text-slate-400">Join an organization to view shared org fleet assets.</p>
        ) : !organizationFleet ? (
          <p className="text-sm text-slate-400">Unable to load organization fleet right now.</p>
        ) : (
          <>
            <p className="text-xs text-slate-400">
              Showing assets contributed by members of {organizationFleet.organizationName} [{organizationFleet.organizationTag}].
            </p>
            <FleetSummaryCards summary={organizationFleet.summary} />

            <div className="overflow-x-auto rounded-xl border border-indigo-500/20 bg-slate-950/40 p-3">
              <h4 className="mb-3 text-sm font-semibold text-indigo-100">Ships (Grouped by type)</h4>
              <table className="w-full text-left text-sm text-slate-300">
                <thead>
                  <tr className="border-b border-indigo-500/20 text-xs uppercase tracking-wide text-slate-400">
                    <th className="py-2">Ship</th>
                    <th className="py-2">Manufacturer</th>
                    <th className="py-2">Role</th>
                    <th className="py-2">Total Qty</th>
                    <th className="py-2">Owners</th>
                  </tr>
                </thead>
                <tbody>
                  {organizationFleet.groupedShips.map((asset) => (
                    <tr key={asset.key} className="border-b border-indigo-500/10 align-top">
                      <td className="py-2 font-medium text-indigo-100">{asset.name}</td>
                      <td className="py-2">{asset.manufacturer}</td>
                      <td className="py-2">{asset.role}</td>
                      <td className="py-2">{asset.totalQuantity}</td>
                      <td className="py-2">
                        <details>
                          <summary className="cursor-pointer text-xs text-indigo-200">
                            {asset.owners.length} owner{asset.owners.length === 1 ? "" : "s"}
                          </summary>
                          <ul className="mt-2 space-y-1 text-xs text-slate-300">
                            {asset.owners.map((owner, index) => (
                              <li key={`${asset.key}-${owner.userId}-${index}`}>
                                {owner.quantity}x {asset.name} - {owner.displayName}
                                {owner.starCitizenHandle ? ` (@${owner.starCitizenHandle})` : ""}
                              </li>
                            ))}
                          </ul>
                        </details>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {!organizationFleet.groupedShips.length ? <p className="text-sm text-slate-400">No ships in org fleet.</p> : null}
            </div>

            <div className="overflow-x-auto rounded-xl border border-indigo-500/20 bg-slate-950/40 p-3">
              <h4 className="mb-3 text-sm font-semibold text-indigo-100">Ground Vehicles (Grouped by type)</h4>
              <table className="w-full text-left text-sm text-slate-300">
                <thead>
                  <tr className="border-b border-indigo-500/20 text-xs uppercase tracking-wide text-slate-400">
                    <th className="py-2">Vehicle</th>
                    <th className="py-2">Manufacturer</th>
                    <th className="py-2">Role</th>
                    <th className="py-2">Total Qty</th>
                    <th className="py-2">Owners</th>
                  </tr>
                </thead>
                <tbody>
                  {organizationFleet.groupedVehicles.map((asset) => (
                    <tr key={asset.key} className="border-b border-indigo-500/10 align-top">
                      <td className="py-2 font-medium text-indigo-100">{asset.name}</td>
                      <td className="py-2">{asset.manufacturer}</td>
                      <td className="py-2">{asset.role}</td>
                      <td className="py-2">{asset.totalQuantity}</td>
                      <td className="py-2">
                        <details>
                          <summary className="cursor-pointer text-xs text-indigo-200">
                            {asset.owners.length} owner{asset.owners.length === 1 ? "" : "s"}
                          </summary>
                          <ul className="mt-2 space-y-1 text-xs text-slate-300">
                            {asset.owners.map((owner, index) => (
                              <li key={`${asset.key}-${owner.userId}-${index}`}>
                                {owner.quantity}x {asset.name} - {owner.displayName}
                                {owner.starCitizenHandle ? ` (@${owner.starCitizenHandle})` : ""}
                              </li>
                            ))}
                          </ul>
                        </details>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {!organizationFleet.groupedVehicles.length ? <p className="text-sm text-slate-400">No ground vehicles in org fleet.</p> : null}
            </div>
          </>
        )}
      </section>
    </AppShell>
  );
}
