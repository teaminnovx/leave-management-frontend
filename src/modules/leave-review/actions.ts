"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireRole } from "@/lib/auth";
import { DomainError, ValidationError } from "@/lib/errors";
import type { ReviewFormState } from "./schema";
import { decide, startReview } from "./service";

export async function startReviewAction(_previous: ReviewFormState, formData: FormData): Promise<ReviewFormState> {
  const actor = await requireRole("SUPERVISOR");
  try {
    startReview(actor, String(formData.get("id")));
  } catch (error) {
    if (error instanceof DomainError) return { error: error.message };
    throw error;
  }
  revalidatePath("/", "layout");
  return {};
}

export async function decideAction(_previous: ReviewFormState, formData: FormData): Promise<ReviewFormState> {
  const actor = await requireRole("SUPERVISOR");
  try {
    decide(actor, String(formData.get("id")), {
      decision: formData.get("decision"),
      comment: formData.get("comment") ?? "",
    });
  } catch (error) {
    if (error instanceof ValidationError) return { fieldErrors: error.fieldErrors };
    if (error instanceof DomainError) return { error: error.message };
    throw error;
  }
  revalidatePath("/", "layout");
  redirect("/review");
}
