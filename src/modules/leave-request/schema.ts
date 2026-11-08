import { z } from "zod";
import { LEAVE_TYPES } from "@/lib/types";

/** The DTO + Bean Validation layer. A draft may be incomplete; a submission may not. */
const optionalDate = z.union([z.literal("").transform(() => null), z.iso.date("Enter a valid date.")]);
const requiredDate = (message: string) => z.iso.date(message);

const endNotBeforeStart = {
  check: (value: { startDate: string | null; endDate: string | null }) =>
    !value.startDate || !value.endDate || value.endDate >= value.startDate,
  options: { path: ["endDate"], message: "End date cannot be before the start date." },
};

export const draftSchema = z
  .object({
    type: z.enum(LEAVE_TYPES, "Choose a leave type."),
    startDate: optionalDate,
    endDate: optionalDate,
    reason: z.string().trim().max(1000, "Keep the reason under 1000 characters."),
  })
  .refine(endNotBeforeStart.check, endNotBeforeStart.options);

export const submitSchema = z
  .object({
    type: z.enum(LEAVE_TYPES, "Choose a leave type."),
    startDate: requiredDate("Enter a start date."),
    endDate: requiredDate("Enter an end date."),
    reason: z
      .string()
      .trim()
      .min(10, "Give a reason of at least 10 characters.")
      .max(1000, "Keep the reason under 1000 characters."),
  })
  .refine(endNotBeforeStart.check, endNotBeforeStart.options);

export type LeaveFormState = {
  error?: string;
  fieldErrors?: Record<string, string>;
};
