import { z } from "zod";

export const decisionSchema = z
  .object({
    decision: z.enum(["APPROVE", "REJECT", "RETURN"], "Choose a decision."),
    comment: z.string().trim().max(1000, "Keep the comment under 1000 characters."),
  })
  .refine((value) => value.decision !== "RETURN" || value.comment.length > 0, {
    path: ["comment"],
    message: "Say what the employee needs to change before returning this application.",
  });

export type Decision = z.infer<typeof decisionSchema>["decision"];

export type ReviewFormState = {
  error?: string;
  fieldErrors?: Record<string, string>;
};
