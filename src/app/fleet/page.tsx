import Link from "next/link";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { FleetAssetTable } from "@/components/fleet/FleetAssetTable";
import { FleetSummaryCards } from "@/components/fleet/FleetSummaryCards";
import { deleteGroundVehicleForUser, deleteShipForUser, getUserFleetData } from "@/lib/fleet-actions";
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
  searchParams: Promise<{ message?: string }>;
}) {
  const user = await requireUser();
  const { message } = await searchParams;
  const fleet = await getUserFleetData(user.id);

  const shipAssets = fleet.assets.filter((asset) => asset.kind === "ship");
  const vehicleAssets = fleet.assets.filter((asset) => asset.kind === "vehicle");

  return (
    <AppShell title="My Fleet" subtitle="Personal ship and vehicle inventory">
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
    </AppShell>
  );
}
