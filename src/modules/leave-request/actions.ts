"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireRole } from "@/lib/auth";
import { DomainError, ValidationError } from "@/lib/errors";
import type { LeaveFormState } from "./schema";
import { saveApplication } from "./service";

export async function saveLeaveApplication(_previous: LeaveFormState, formData: FormData): Promise<LeaveFormState> {
  const actor = await requireRole("EMPLOYEE");
  const upload = formData.get("attachment");

  let id: string;
  try {
    id = await saveApplication(actor, {
      id: formData.get("id")?.toString() || undefined,
      intent: formData.get("intent") === "submit" ? "submit" : "draft",
      fields: {
        type: formData.get("type"),
        startDate: formData.get("startDate") ?? "",
        endDate: formData.get("endDate") ?? "",
        reason: formData.get("reason") ?? "",
      },
      file: upload instanceof File && upload.size > 0 ? upload : null,
    });
  } catch (error) {
    if (error instanceof ValidationError) return { fieldErrors: error.fieldErrors };
    if (error instanceof DomainError) {
      return error.field ? { fieldErrors: { [error.field]: error.message } } : { error: error.message };
    }
    throw error;
  }

  revalidatePath("/", "layout");
  redirect(`/applications/${id}`);
}
