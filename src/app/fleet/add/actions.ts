"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { addGroundVehicleForUser, addShipForUser } from "@/lib/fleet-actions";
import { requireUser } from "@/lib/session";

export async function addFleetAsset(formData: FormData) {
  const user = await requireUser();
  const assetType = String(formData.get("assetType") || "ship");

  const payload = {
    name: String(formData.get("name") || ""),
    manufacturer: String(formData.get("manufacturer") || ""),
    role: String(formData.get("role") || ""),
    size: String(formData.get("size") || ""),
    quantity: Number(formData.get("quantity") || 1),
    status: String(formData.get("status") || "AVAILABLE"),
    notes: String(formData.get("notes") || ""),
  };

  let message = "Fleet updated.";
  if (assetType === "vehicle") {
    const result = await addGroundVehicleForUser(user.id, payload);
    message = result.message;
  } else {
    const result = await addShipForUser(user.id, payload);
    message = result.message;
  }

  revalidatePath("/fleet");
  revalidatePath("/dashboard");
  revalidatePath("/profile");
  redirect(`/fleet?message=${encodeURIComponent(message)}`);
}
