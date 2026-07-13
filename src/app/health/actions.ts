"use server";

import { revalidatePath } from "next/cache";
import { refreshHealth, type HealthRefresh } from "@/lib/db/refresh";

/** Pull today's Garmin health summary on demand and revalidate the pages. */
export async function refreshHealthAction(): Promise<HealthRefresh> {
  const result = await refreshHealth();
  revalidatePath("/health");
  revalidatePath("/");
  return result;
}
