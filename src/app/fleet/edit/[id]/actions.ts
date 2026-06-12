"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { updateGroundVehicleForUser, updateShipForUser } from "@/lib/fleet-actions";
import { requireUser } from "@/lib/session";

export async function updateFleetAsset(formData: FormData) {
  const user = await requireUser();

  const assetType = String(formData.get("assetType") || "ship");
  const payload = {
    id: String(formData.get("id") || ""),
    name: String(formData.get("name") || ""),
    manufacturer: String(formData.get("manufacturer") || ""),
    role: String(formData.get("role") || ""),
    size: String(formData.get("size") || ""),
    quantity: Number(formData.get("quantity") || 1),
    status: String(formData.get("status") || "AVAILABLE"),
    notes: String(formData.get("notes") || ""),
  };

  if (assetType === "vehicle") {
    await updateGroundVehicleForUser(user.id, payload);
  } else {
    await updateShipForUser(user.id, payload);
  }

  revalidatePath("/fleet");
  revalidatePath("/operations/new");
  redirect("/fleet?message=Fleet%20asset%20updated");
}
