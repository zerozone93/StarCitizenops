import { notFound } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { EditFleetAssetForm } from "@/components/fleet/EditFleetAssetForm";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";

export const dynamic = "force-dynamic";

export default async function EditFleetAssetPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  const { id } = await params;

  const [ship, vehicle] = await Promise.all([
    prisma.ship.findUnique({ where: { id } }),
    prisma.groundVehicle.findUnique({ where: { id } }),
  ]);

  if (ship && ship.userId === user.id) {
    return (
      <AppShell title="Edit Fleet Asset" subtitle={`Update ${ship.name} x${ship.quantity}`}>
        <EditFleetAssetForm
          kind="ship"
          initial={{
            id: ship.id,
            name: ship.name,
            manufacturer: ship.manufacturer,
            role: ship.role,
            size: ship.size,
            quantity: ship.quantity,
            status: ship.status,
            notes: ship.notes,
          }}
        />
      </AppShell>
    );
  }

  if (vehicle && vehicle.userId === user.id) {
    return (
      <AppShell title="Edit Fleet Asset" subtitle={`Update ${vehicle.name} x${vehicle.quantity}`}>
        <EditFleetAssetForm
          kind="vehicle"
          initial={{
            id: vehicle.id,
            name: vehicle.name,
            manufacturer: vehicle.manufacturer,
            role: vehicle.role,
            size: vehicle.size,
            quantity: vehicle.quantity,
            status: vehicle.status,
            notes: vehicle.notes,
          }}
        />
      </AppShell>
    );
  }

  notFound();
}
