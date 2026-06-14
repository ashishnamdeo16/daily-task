"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/server/auth";
import { resetAllUserData } from "@/server/services/reset.service";
import type { ActionResult } from "@/lib/types";

export async function resetAccount(): Promise<ActionResult<null>> {
  try {
    const user = await requireUser();
    await resetAllUserData(user.id);
    revalidatePath("/", "layout");
    return { success: true, data: null };
  } catch (err) {
    console.error(err);
    return { success: false, error: "Failed to reset account. Please try again." };
  }
}
