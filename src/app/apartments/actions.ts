"use server";

import { revalidatePath } from "next/cache";
import { setStatus } from "@/lib/db/apartments";
import type { ApartmentStatus } from "@/lib/types";

export async function updateApartmentStatus(id: string, status: ApartmentStatus) {
  await setStatus(id, status);
  revalidatePath("/apartments");
  revalidatePath("/");
}
