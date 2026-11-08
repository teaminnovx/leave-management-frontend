"use server";

import { revalidatePath } from "next/cache";
import { requireRole, requireUser } from "@/lib/auth";
import { DomainError } from "@/lib/errors";
import { LEAVE_TYPES } from "@/lib/types";
import { markAllRead, updateEntitlements } from "./service";

export type BalanceFormState = { error?: string; saved?: boolean };

export async function saveBalances(_previous: BalanceFormState, formData: FormData): Promise<BalanceFormState> {
  const actor = await requireRole("HR_ADMIN");
  try {
    updateEntitlements(actor, String(formData.get("userId")), Object.fromEntries(LEAVE_TYPES.map((type) => [type, formData.get(type)])));
  } catch (error) {
    if (error instanceof DomainError) return { error: error.message };
    throw error;
  }
  revalidatePath("/", "layout");
  return { saved: true };
}

export async function markNotificationsRead() {
  const user = await requireUser();
  markAllRead(user.id);
  revalidatePath("/", "layout");
}
