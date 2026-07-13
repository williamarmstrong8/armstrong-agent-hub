"use server";

import { revalidatePath } from "next/cache";
import { setStatus } from "@/lib/db/apartments";
import { refreshApartments, type ApartmentsRefresh } from "@/lib/db/refresh";
import type { ApartmentStatus } from "@/lib/types";

export async function updateApartmentStatus(id: string, status: ApartmentStatus) {
  await setStatus(id, status);
  revalidatePath("/apartments");
  revalidatePath("/");
}

/** Pull fresh StreetEasy listings on demand and revalidate the pages. */
export async function refreshApartmentsAction(): Promise<ApartmentsRefresh> {
  const result = await refreshApartments();
  revalidatePath("/apartments");
  revalidatePath("/");
  return result;
}
